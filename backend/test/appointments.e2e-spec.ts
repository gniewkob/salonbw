import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from './../src/users/role.enum';
import { UsersService } from './../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service as CatalogService } from './../src/catalog/service.entity';

describe('AppointmentsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;
    let serviceRepo: Repository<CatalogService>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
        serviceRepo = moduleFixture.get(getRepositoryToken(CatalogService));
        await serviceRepo.save({
            name: 'Cut',
            duration: 30,
            price: 10,
        });
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

    it('client cannot modify another client appointment', async () => {
        const client1 = await usersService.createUser('c1@test.com', 'secret', 'C1', Role.Client);
        const client2 = await usersService.createUser('c2@test.com', 'secret', 'C2', Role.Client);
        const employee = await usersService.createUser('e2@test.com', 'secret', 'E2', Role.Employee);
        await usersService.createUser('admin2@test.com', 'secret', 'A', Role.Admin);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin2@test.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token;

        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clientId: client1.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: '2025-07-01T10:00:00.000Z',
            })
            .expect(201);
        const id = create.body.id;

        const loginClient2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'c2@test.com', password: 'secret' })
            .expect(201);
        const token = loginClient2.body.access_token;

        await request(app.getHttpServer())
            .patch(`/appointments/client/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ notes: 'fail' })
            .expect(403);
    });

    it('employee cannot modify appointment of another employee', async () => {
        const client = await usersService.createUser('c3@test.com', 'secret', 'C3', Role.Client);
        const emp1 = await usersService.createUser('e3@test.com', 'secret', 'E3', Role.Employee);
        const emp2 = await usersService.createUser('e4@test.com', 'secret', 'E4', Role.Employee);
        await usersService.createUser('admin3@test.com', 'secret', 'A', Role.Admin);

        const adminLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin3@test.com', password: 'secret' })
            .expect(201);
        const adminToken = adminLogin.body.access_token;

        const create = await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                clientId: client.id,
                employeeId: emp1.id,
                serviceId: 1,
                startTime: '2025-07-01T10:00:00.000Z',
            })
            .expect(201);
        const id = create.body.id;

        const loginEmp2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'e4@test.com', password: 'secret' })
            .expect(201);
        const empToken = loginEmp2.body.access_token;

        await request(app.getHttpServer())
            .patch(`/appointments/employee/${id}`)
            .set('Authorization', `Bearer ${empToken}`)
            .send({ notes: 'nope' })
            .expect(403);
    });
});
