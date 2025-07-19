import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';
import { PaymentsService } from './../src/payments/payments.service';
import { PaymentStatus } from './../src/appointments/appointment.entity';

describe('Payments (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let payments: PaymentsService;

    beforeEach(async () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test';
        process.env.STRIPE_WEBHOOK_SECRET = 'whsec';
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
        payments = moduleFixture.get(PaymentsService);
        (payments as any).stripe.checkout = { sessions: { create: jest.fn().mockResolvedValue({ id: 's', url: 'u' }) } };
        (payments as any).stripe.webhooks = { constructEvent: jest.fn().mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: { id: 's', metadata: { appointmentId: '1' } } },
        }) };
    });

    afterEach(async () => {
        if (app) await app.close();
    });

    it('creates session and processes webhook', async () => {
        const client = await users.createUser('p@test.com','secret','P',Role.Client);
        const employee = await users.createUser('e@test.com','secret','E',Role.Employee);
        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'p@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;
        const start = new Date(Date.now()+86400000).toISOString();
        const appt = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({ clientId: client.id, employeeId: employee.id, serviceId: 1, startTime: start })
            .expect(201);
        const id = appt.body.id;
        await request(app.getHttpServer())
            .post('/payments/create-session')
            .send({ appointmentId: id })
            .expect(201);
        await payments.handleWebhook(Buffer.from(''), 'sig');
        const updated = await request(app.getHttpServer())
            .get(`/appointments/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(updated.body.paymentStatus).toBe(PaymentStatus.Paid);
    });
});
