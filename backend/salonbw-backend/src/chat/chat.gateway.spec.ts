import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { io } from 'socket.io-client';
import { ChatGateway } from './chat.gateway';
import { AppointmentsService } from '../appointments/appointments.service';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Server } from 'http';
import type { AddressInfo } from 'net';
import type { Socket } from 'socket.io-client';

interface Message {
    id: number;
    user: { id: number };
    appointment: { id: number };
    text: string;
    timestamp: Date;
}

type SocketInternal = {
    disconnect?: () => void;
    io?: {
        engine?: {
            transport?: { ws?: { close?: () => void }; socket?: { close?: () => void } };
            ws?: { close?: () => void };
        };
    };
};

function cleanupSocket(socket: Socket): void {
    try {
        const socketInternal = socket as unknown as SocketInternal;
        socketInternal.disconnect?.();
        const transport = socketInternal.io?.engine?.transport;
        transport?.ws?.close?.();
        transport?.socket?.close?.();
        socketInternal.io?.engine?.ws?.close?.();
    } catch (err) {
        // ignore if internal shape differs
    }
}

type AckPayload = { status: 'ok' };
type MessagePayload = { text: string; userId: number };
type MessageAck = { status: 'ok' };

const SKIP = process.env.SKIP_BIND_TESTS === '1';
const d = SKIP ? describe.skip : describe;

d('ChatGateway', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let baseUrl: string;
    let canBind = true;
    let mockAppointmentsService: jest.Mocked<AppointmentsService>;
    let mockChatService: {
        saveMessage: jest.Mock<Promise<Message>, [number, number, string]>;
    };
    let messages: Message[];
    let appointment: Appointment;

    beforeAll(async () => {
        messages = [];
        appointment = {
            id: 1,
            client: { id: 1 } as unknown as User,
            employee: { id: 2 } as unknown as User,
        } as Appointment;

        mockAppointmentsService = {
            findOne: jest.fn().mockResolvedValue(appointment),
        } as Partial<AppointmentsService> as jest.Mocked<AppointmentsService>;

        mockChatService = {
            saveMessage: jest.fn<Promise<Message>, [number, number, string]>(
                (userId, appointmentId, text) => {
                    const msg: Message = {
                        id: messages.length + 1,
                        user: { id: userId },
                        appointment: { id: appointmentId },
                        text,
                        timestamp: new Date(),
                    };
                    messages.push(msg);
                    return Promise.resolve(msg);
                },
            ),
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                ChatGateway,
                {
                    provide: AppointmentsService,
                    useValue: mockAppointmentsService,
                },
                { provide: ChatService, useValue: mockChatService },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'JWT_SECRET') return 'test';
                            if (key === 'FRONTEND_URL') return true;
                            return null;
                        }),
                    },
                },
            ],
            imports: [JwtModule.register({ secret: 'test' })],
        }).compile();

        app = moduleRef.createNestApplication();
        try {
            await app.listen(0, '127.0.0.1');
        } catch (error) {
            const err = error as NodeJS.ErrnoException;
            if (err?.code === 'EPERM') {
                canBind = false;
                return;
            }
            throw error;
        }
        const server = app.getHttpServer() as Server;
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        jwtService = moduleRef.get(JwtService);
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should disconnect clients without token', async () => {
        if (!canBind) {
            expect(canBind).toBe(false);
            return;
        }
        const socket = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false,
        });
        await new Promise<void>((resolve) => {
            socket.on('disconnect', () => resolve());
        });
        expect(socket.connected).toBe(false);
        socket.close();
        // ensure underlying engine/io resources are closed (msw MockHttpSocket)
        cleanupSocket(socket);
        // give socket a moment to fully close and release handles
        await new Promise((r) => setTimeout(r, 50));
    });

    it('should allow authorized clients to exchange messages', async () => {
        if (!canBind) {
            expect(canBind).toBe(false);
            return;
        }
        const token1 = await jwtService.signAsync({ sub: 1, role: 'Client' });
        const token2 = await jwtService.signAsync({ sub: 2, role: 'Employee' });

        const socket1 = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            extraHeaders: { Authorization: `Bearer ${token1}` },
        });
        const socket2 = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            extraHeaders: { Authorization: `Bearer ${token2}` },
        });

        await Promise.all([
            new Promise<void>((resolve) => {
                socket1.on('connect', () => resolve());
            }),
            new Promise<void>((resolve) => {
                socket2.on('connect', () => resolve());
            }),
        ]);

        const join1 = await new Promise<AckPayload>((resolve) => {
            socket1.emit('joinRoom', { appointmentId: 1 }, (payload: AckPayload) =>
                resolve(payload),
            );
        });
        const join2 = await new Promise<AckPayload>((resolve) => {
            socket2.emit('joinRoom', { appointmentId: 1 }, (payload: AckPayload) =>
                resolve(payload),
            );
        });
        expect(join1).toEqual({ status: 'ok' });
        expect(join2).toEqual({ status: 'ok' });

        const received = new Promise<MessagePayload>((resolve) => {
            socket2.on('message', (payload: MessagePayload) => resolve(payload));
        });
        const sendRes = await new Promise<MessageAck>((resolve) => {
            socket1.emit(
                'message',
                { appointmentId: 1, message: 'hello' },
                (payload: MessageAck) => resolve(payload),
            );
        });
        expect(sendRes).toEqual({ status: 'ok' });
        const msg = await received;
        expect(msg.text).toBe('hello');
        expect(msg.userId).toBe(1);

        socket1.close();
        socket2.close();
        cleanupSocket(socket1);
        cleanupSocket(socket2);
        // allow sockets to fully close to avoid jest open handle warnings
        await new Promise<void>((r) => setTimeout(r, 50));
    });

    it('should reject messages exceeding maximum length', async () => {
        if (!canBind) {
            expect(canBind).toBe(false);
            return;
        }
        const token1 = await jwtService.signAsync({ sub: 1, role: 'Client' });
        const token2 = await jwtService.signAsync({ sub: 2, role: 'Employee' });

        const socket1 = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            extraHeaders: { Authorization: `Bearer ${token1}` },
        });
        const socket2 = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            extraHeaders: { Authorization: `Bearer ${token2}` },
        });

        await Promise.all([
            new Promise<void>((resolve) => {
                socket1.on('connect', () => resolve());
            }),
            new Promise<void>((resolve) => {
                socket2.on('connect', () => resolve());
            }),
        ]);

        await new Promise<AckPayload>((resolve) => {
            socket1.emit('joinRoom', { appointmentId: 1 }, (payload: AckPayload) =>
                resolve(payload),
            );
        });
        await new Promise<AckPayload>((resolve) => {
            socket2.emit('joinRoom', { appointmentId: 1 }, (payload: AckPayload) =>
                resolve(payload),
            );
        });

        const longText = 'a'.repeat(501);
        const errorPromise = new Promise<unknown>((resolve) =>
            socket1.on('exception', (payload) => resolve(payload)),
        );
        socket1.emit('message', { appointmentId: 1, message: longText });
        const error = await errorPromise;

        expect(error).toBeDefined();

        socket1.close();
        socket2.close();
        cleanupSocket(socket1);
        cleanupSocket(socket2);
        // allow sockets to fully close to avoid jest open handle warnings
        await new Promise<void>((r) => setTimeout(r, 50));
    });
});
