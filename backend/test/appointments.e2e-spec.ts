import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/users/role.enum';
import { UsersService } from './../src/users/users.service';

describe('AppointmentsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('client can list own appointments', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'client@test.com', password: 'secret', name: 'Client' })
            .expect(201);
        const token = register.body.access_token;
        await request(app.getHttpServer())
            .get('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('client cannot access admin endpoints', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'client2@test.com', password: 'secret', name: 'Client' })
            .expect(201);
        const token = register.body.access_token;
        await request(app.getHttpServer())
            .get('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('admin can CRUD appointments', async () => {
        const client = await usersService.createUser('c@test.com', 'secret', 'C', Role.Client);
        const employee = await usersService.createUser('e@test.com', 'secret', 'E', Role.Employee);
        await usersService.createUser('a@test.com', 'secret', 'A', Role.Admin);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'a@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: '2025-07-01T10:00:00.000Z',
            })
            .expect(201);

        const id = create.body.id;

        await request(app.getHttpServer())
            .patch(`/appointments/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ notes: 'done' })
            .expect(200);

        await request(app.getHttpServer())
            .delete(`/appointments/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('client can cancel own appointment', async () => {
        const client = await usersService.createUser('cc@test.com', 'secret', 'C', Role.Client);
        const employee = await usersService.createUser('ee@test.com', 'secret', 'E', Role.Employee);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'cc@test.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        const create = await request(app.getHttpServer())
            .post('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .send({ employeeId: employee.id, serviceId: 1, startTime: '2025-07-01T10:00:00.000Z' })
            .expect(201);

        const id = create.body.id;

        await request(app.getHttpServer())
            .patch(`/appointments/client/${id}/cancel`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect(res => {
                expect(res.body.status).toBe('cancelled');
            });
    });

    it('employee can complete appointment', async () => {
        const client = await usersService.createUser('ccc@test.com', 'secret', 'C', Role.Client);
        const employee = await usersService.createUser('eee@test.com', 'secret', 'E', Role.Employee);

        const admin = await usersService.createUser('admin@test.com', 'secret', 'A', Role.Admin);
        const loginAdmin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@test.com', password: 'secret' })
            .expect(201);
        const tokenAdmin = loginAdmin.body.access_token;

        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ clientId: client.id, employeeId: employee.id, serviceId: 1, startTime: '2025-07-01T10:00:00.000Z' })
            .expect(201);

        const id = create.body.id;

        const loginEmp = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'eee@test.com', password: 'secret' })
            .expect(201);
        const tokenEmp = loginEmp.body.access_token;

        await request(app.getHttpServer())
            .patch(`/appointments/employee/${id}/complete`)
            .set('Authorization', `Bearer ${tokenEmp}`)
            .expect(200)
            .expect(res => {
                expect(res.body.status).toBe('completed');
            });
    });
});
