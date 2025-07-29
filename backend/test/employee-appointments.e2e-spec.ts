import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { CommissionsService } from './../src/commissions/commissions.service';
import { Role } from './../src/users/role.enum';

describe('Employee appointments actions (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;
    let commissions: CommissionsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();

        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
        commissions = moduleFixture.get(CommissionsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('allows employee to manage only own appointments', async () => {
        const client = await users.createUser(
            'client@empapp.com',
            'secret',
            'Client',
            Role.Client,
        );
        const emp1 = await users.createUser(
            'emp1@empapp.com',
            'secret',
            'E1',
            Role.Employee,
        );
        const emp2 = await users.createUser(
            'emp2@empapp.com',
            'secret',
            'E2',
            Role.Employee,
        );
        await users.createUser(
            'admin@empapp.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@empapp.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token as string;

        const empLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp1@empapp.com', password: 'secret' })
            .expect(201);
        const empToken = empLogin.body.access_token as string;

        const start1 = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const start2 = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const appt1 = await appointments.create(client.id, emp1.id, 1, start1);
        const appt2 = await appointments.create(client.id, emp2.id, 1, start2);

        // verify listing only own appointments
        const list = await request(app.getHttpServer())
            .get('/appointments/employee')
            .set('Authorization', `Bearer ${empToken}`)
            .expect(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body.length).toBe(1);
        expect(list.body[0].id).toBe(appt1.id);

        // cannot cancel or complete another employee appointment
        await request(app.getHttpServer())
            .patch(`/appointments/employee/${appt2.id}/cancel`)
            .set('Authorization', `Bearer ${empToken}`)
            .expect(403);
        await request(app.getHttpServer())
            .patch(`/appointments/employee/${appt2.id}/complete`)
            .set('Authorization', `Bearer ${empToken}`)
            .expect(403);

        // complete own appointment
        await request(app.getHttpServer())
            .patch(`/appointments/employee/${appt1.id}/complete`)
            .set('Authorization', `Bearer ${empToken}`)
            .expect(200);

        const records = await commissions.listForEmployee(emp1.id);
        expect(records.length).toBe(1);
    });
});
