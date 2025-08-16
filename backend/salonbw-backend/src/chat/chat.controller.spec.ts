import { Test } from '@nestjs/testing';
import { INestApplication, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Appointment } from '../appointments/appointment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../users/role.enum';

interface ChatMessage {
    id: number;
    user: { id: number };
    appointment: { id: number };
    text: string;
    timestamp: Date;
}

describe('ChatController', () => {
    let app: INestApplication;
    let chatService: {
        findMessages: jest.Mock;
        saveMessage: jest.Mock;
    };
    let currentUser: { userId: number; role: Role };
    let messages: ChatMessage[];
    let appointment: Appointment;

    beforeEach(async () => {
        messages = [];
        appointment = {
            id: 1,
            client: { id: 1, role: Role.Client } as any,
            employee: { id: 2, role: Role.Employee } as any,
        } as Appointment;

        chatService = {
            findMessages: jest
                .fn<Promise<ChatMessage[]>, [number]>(async (id) =>
                    messages.filter((m) => m.appointment.id === id),
                ),
            saveMessage: jest
                .fn<Promise<ChatMessage>, [number, number, string]>(
                    async (userId, appointmentId, text) => {
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

        const mockAppointmentRepo = {
            findOne: jest.fn(async ({ where: { id } }) =>
                id === appointment.id ? appointment : null,
            ),
        };

        currentUser = { userId: 1, role: Role.Client };

        const moduleRef = await Test.createTestingModule({
            controllers: [ChatController],
            providers: [
                { provide: ChatService, useValue: chatService },
                { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({
                canActivate: (context: ExecutionContext) => {
                    const req = context.switchToHttp().getRequest();
                    req.user = currentUser;
                    return true;
                },
            })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        app = moduleRef.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('should return messages for authorized user and forbid others', async () => {
        await request(app.getHttpServer())
            .get('/appointments/1/chat')
            .expect(200)
            .expect([]);

        await chatService.saveMessage(1, 1, 'hello');

        const res = await request(app.getHttpServer())
            .get('/appointments/1/chat')
            .expect(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].text).toBe('hello');

        currentUser = { userId: 3, role: Role.Client };
        await request(app.getHttpServer())
            .get('/appointments/1/chat')
            .expect(403);
    });
});
