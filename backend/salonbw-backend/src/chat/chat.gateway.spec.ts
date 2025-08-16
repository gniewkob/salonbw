import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { io, Socket } from 'socket.io-client';
import { ChatGateway } from './chat.gateway';
import { AppointmentsService } from '../appointments/appointments.service';
import { ChatService } from './chat.service';
import { Appointment } from '../appointments/appointment.entity';

interface Message {
    id: number;
    user: { id: number };
    appointment: { id: number };
    text: string;
    timestamp: Date;
}

describe('ChatGateway', () => {
    let app: INestApplication;
    let jwtService: JwtService;
    let baseUrl: string;
    let mockAppointmentsService: jest.Mocked<AppointmentsService>;
    let mockChatService: { saveMessage: jest.Mock };
    let messages: Message[];
    let appointment: Appointment;

    beforeAll(async () => {
        messages = [];
        appointment = {
            id: 1,
            client: { id: 1 } as any,
            employee: { id: 2 } as any,
        } as Appointment;

        mockAppointmentsService = {
            findOne: jest.fn().mockResolvedValue(appointment),
        } as any;

        mockChatService = {
            saveMessage: jest
                .fn()
                .mockImplementation(
                    async (
                        userId: number,
                        appointmentId: number,
                        text: string,
                    ) => {
                        const msg = {
                            id: messages.length + 1,
                            user: { id: userId },
                            appointment: { id: appointmentId },
                            text,
                            timestamp: new Date(),
                        };
                        messages.push(msg);
                        return msg;
                    },
                ),
        };

        const moduleRef = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: AppointmentsService, useValue: mockAppointmentsService },
                { provide: ChatService, useValue: mockChatService },
            ],
            imports: [JwtModule.register({ secret: 'test' })],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.listen(0);
        const server = app.getHttpServer();
        const address = server.address();
        baseUrl = `http://localhost:${address.port}`;
        jwtService = moduleRef.get(JwtService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should disconnect clients without token', async () => {
        const socket = io(baseUrl, {
            transports: ['websocket'],
            forceNew: true,
            reconnection: false,
        });
        await new Promise((resolve) => socket.on('disconnect', resolve));
        expect(socket.connected).toBe(false);
        socket.close();
    });

    it('should allow authorized clients to exchange messages', async () => {
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
            new Promise((resolve) => socket1.on('connect', resolve)),
            new Promise((resolve) => socket2.on('connect', resolve)),
        ]);

        const join1 = await new Promise((resolve) =>
            socket1.emit('joinRoom', { appointmentId: 1 }, resolve),
        );
        const join2 = await new Promise((resolve) =>
            socket2.emit('joinRoom', { appointmentId: 1 }, resolve),
        );
        expect(join1).toEqual({ status: 'ok' });
        expect(join2).toEqual({ status: 'ok' });

        const received = new Promise<any>((resolve) =>
            socket2.on('message', resolve),
        );
        const sendRes = await new Promise((resolve) =>
            socket1.emit(
                'message',
                { appointmentId: 1, message: 'hello' },
                resolve,
            ),
        );
        expect(sendRes).toEqual({ status: 'ok' });
        const msg = await received;
        expect(msg.text).toBe('hello');
        expect(msg.userId).toBe(1);

        socket1.close();
        socket2.close();
    });
});
