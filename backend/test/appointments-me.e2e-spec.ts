import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { Role } from './../src/users/role.enum';

describe('Appointments /me endpoint (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('returns appointments based on user role', async () => {
        const client1 = await users.createUser(
            'me-client1@test.com',
            'secret',
            'Client1',
            Role.Client,
        );
        const client2 = await users.createUser(
            'me-client2@test.com',
            'secret',
            'Client2',
            Role.Client,
        );
        const emp1 = await users.createUser(
            'me-emp1@test.com',
            'secret',
            'Emp1',
            Role.Employee,
        );
        const emp2 = await users.createUser(
            'me-emp2@test.com',
            'secret',
            'Emp2',
            Role.Employee,
        );
        await users.createUser('me-admin@test.com', 'secret', 'Admin', Role.Admin);

        const clientLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'me-client1@test.com', password: 'secret' })
            .expect(201);
        const clientToken = clientLogin.body.access_token as string;

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'me-emp1@test.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'me-admin@test.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const start1 = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const start2 = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const appt1 = await appointments.create(client1.id, emp1.id, 1, start1);
        await appointments.create(client2.id, emp2.id, 1, start2);

        const clientRes = await request(app.getHttpServer())
            .get('/appointments/me')
            .set('Authorization', `Bearer ${clientToken}`)
            .expect(200);
        expect(Array.isArray(clientRes.body)).toBe(true);
        expect(clientRes.body.length).toBe(1);
        expect(clientRes.body[0].id).toBe(appt1.id);

        const empRes = await request(app.getHttpServer())
            .get('/appointments/me')
            .set('Authorization', `Bearer ${empToken}`)
            .expect(200);
        expect(empRes.body.length).toBe(1);
        expect(empRes.body[0].id).toBe(appt1.id);

        const adminRes = await request(app.getHttpServer())
            .get('/appointments/me')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(adminRes.body.length).toBe(2);
    });
});
