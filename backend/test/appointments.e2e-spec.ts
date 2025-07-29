import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/users/role.enum';
import { UsersService } from './../src/users/users.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service as CatalogService } from './../src/catalog/service.entity';
import { Appointment } from './../src/appointments/appointment.entity';

describe('AppointmentsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;
    let servicesRepo: Repository<CatalogService>;
    let appointmentsRepo: Repository<Appointment>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
        servicesRepo = moduleFixture.get(getRepositoryToken(CatalogService));
        appointmentsRepo = moduleFixture.get(getRepositoryToken(Appointment));
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('client can list own appointments', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'client@test.com',
                password: 'secret',
                name: 'Client',
            })
            .expect(201);
        const { access_token: token } = register.body as {
            access_token: string;
        };
        await request(app.getHttpServer())
            .get('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('client cannot access admin endpoints', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'client2@test.com',
                password: 'secret',
                name: 'Client',
            })
            .expect(201);
        const { access_token: token } = register.body as {
            access_token: string;
        };
        await request(app.getHttpServer())
            .get('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });

    it('admin can CRUD appointments', async () => {
        const client = await usersService.createUser(
            'c@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'e@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        await usersService.createUser('a@test.com', 'secret', 'A', Role.Admin);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'a@test.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };

        const futureTime = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString();
        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: futureTime,
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

    it('client can create an appointment', async () => {
        await servicesRepo.save(
            servicesRepo.create({ name: 'cut', duration: 30, price: 10 }),
        );
        const client = await usersService.createUser(
            'client3@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'emp3@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client3@test.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };
        const startTime = new Date(
            Date.now() + 48 * 60 * 60 * 1000,
        ).toISOString();

        const res = await request(app.getHttpServer())
            .post('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .send({
                employeeId: employee.id,
                serviceId: 1,
                startTime,
            })
            .expect(201);

        const saved = await appointmentsRepo.findOne({
            where: { id: res.body.id },
        });
        expect(saved).toBeDefined();
        expect(saved?.client.id).toBe(client.id);
        expect(saved?.employee.id).toBe(employee.id);
        expect(saved?.service.id).toBe(1);
    });

    it('rejects appointment with past start time', async () => {
        await servicesRepo.save(
            servicesRepo.create({ name: 'cut', duration: 30, price: 10 }),
        );
        const client = await usersService.createUser(
            'past@test.com',
            'secret',
            'P',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'pastemp@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'past@test.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };
        const startTime = '2020-01-01T11:00:00.000Z';

        await request(app.getHttpServer())
            .post('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .send({
                employeeId: employee.id,
                serviceId: 1,
                startTime,
            })
            .expect(400);

        const appts = await appointmentsRepo.find();
        expect(appts.length).toBe(0);
    });

    it('rejects updating appointment to past time', async () => {
        const admin = await usersService.createUser(
            'upadmin@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'upclient@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'upemp@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'upadmin@test.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };

        const futureTime = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString();
        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: futureTime,
            })
            .expect(201);

        const id = create.body.id;

        await request(app.getHttpServer())
            .patch(`/appointments/admin/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ startTime: '2020-01-01T11:00:00.000Z' })
            .expect(400);
    });

    it('rejects conflicting appointment update', async () => {
        const admin = await usersService.createUser(
            'confadmin@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const client = await usersService.createUser(
            'confclient@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'confemp@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'confadmin@test.com', password: 'secret' })
            .expect(201);
        const { access_token: token } = login.body as { access_token: string };

        const start1 = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const appt1 = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: start1,
            })
            .expect(201);

        const start2 = new Date(
            Date.parse(start1) + 60 * 60 * 1000,
        ).toISOString();
        const appt2 = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: start2,
            })
            .expect(201);

        const conflictStart = new Date(
            Date.parse(start1) + 15 * 60 * 1000,
        ).toISOString();
        await request(app.getHttpServer())
            .patch(`/appointments/admin/${appt2.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ startTime: conflictStart })
            .expect(409);
    });

    it('rejects unauthenticated appointment creation', async () => {
        await servicesRepo.save(
            servicesRepo.create({ name: 'style', duration: 30, price: 20 }),
        );
        const employee = await usersService.createUser(
            'emp4@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const startTime = new Date(
            Date.now() + 72 * 60 * 60 * 1000,
        ).toISOString();
        await request(app.getHttpServer())
            .post('/appointments/client')
            .send({
                employeeId: employee.id,
                serviceId: 1,
                startTime,
            })
            .expect(401);
    });

    it('returns 404 when employee cancels nonexistent appointment', async () => {
        const employee = await usersService.createUser(
            'nfemp1@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'nfemp1@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .patch('/appointments/employee/9999/cancel')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('returns 404 when employee completes nonexistent appointment', async () => {
        const employee = await usersService.createUser(
            'nfemp2@test.com',
            'secret',
            'E',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'nfemp2@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .patch('/appointments/employee/9999/complete')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });
});
