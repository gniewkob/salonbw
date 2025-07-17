import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import * as request from 'supertest';
import { io as Client } from 'socket.io-client';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { Role } from './../src/users/role.enum';

describe('ChatGateway (e2e)', () => {
    let app: INestApplication;
    let users: UsersService;
    let appointments: AppointmentsService;
    let url: string;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.listen(0);
        const address: any = app.getHttpServer().address();
        url = `http://localhost:${address.port}`;
        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('delivers chat messages to all room members', async () => {
        const client = await users.createUser(
            'cgclient@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await users.createUser(
            'cgemp@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const start = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const appt = await appointments.create(
            client.id,
            employee.id,
            1,
            start,
        );

        const loginC = await request(url)
            .post('/auth/login')
            .send({ email: 'cgclient@test.com', password: 'secret' })
            .expect(201);
        const loginE = await request(url)
            .post('/auth/login')
            .send({ email: 'cgemp@test.com', password: 'secret' })
            .expect(201);

        const socketC = Client(url, {
            auth: { token: loginC.body.access_token },
            transports: ['websocket'],
            reconnection: false,
        });
        const socketE = Client(url, {
            auth: { token: loginE.body.access_token },
            transports: ['websocket'],
            reconnection: false,
        });

        await new Promise<void>((resolve) =>
            socketC.on('connect', () => resolve()),
        );
        await new Promise<void>((resolve) =>
            socketE.on('connect', () => resolve()),
        );

        socketC.emit('joinRoom', { appointmentId: appt.id });
        socketE.emit('joinRoom', { appointmentId: appt.id });

        const receivedC: any[] = [];
        const receivedE: any[] = [];
        socketC.on('message', (m) => receivedC.push(m));
        socketE.on('message', (m) => receivedE.push(m));

        socketC.emit('message', { appointmentId: appt.id, content: 'hello' });
        socketE.emit('message', { appointmentId: appt.id, content: 'hi' });

        await new Promise((res) => setTimeout(res, 200));

        expect(receivedC.length).toBe(2);
        expect(receivedE.length).toBe(2);
        const messages = receivedC.map((m) => m.message).sort();
        expect(messages).toEqual(['hello', 'hi']);

        socketC.close();
        socketE.close();

        const history = await request(url)
            .get(`/appointments/${appt.id}/chat`)
            .set('Authorization', `Bearer ${loginC.body.access_token}`)
            .expect(200);
        const bodyMessages = history.body.map((m: any) => m.message).sort();
        expect(bodyMessages).toEqual(['hello', 'hi']);
    });

    it('disconnects when token is invalid', (done) => {
        const bad = Client(url, {
            auth: { token: 'invalid' },
            transports: ['websocket'],
            reconnection: false,
        });
        bad.on('connect', () => {
            bad.on('disconnect', () => done());
        });
        bad.on('connect_error', () => {
            bad.close();
            done();
        });
    });
});
