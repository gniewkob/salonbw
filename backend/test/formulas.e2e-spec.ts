import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { AppointmentsService } from './../src/appointments/appointments.service';
import { Role } from './../src/users/role.enum';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service as CatalogService } from './../src/catalog/service.entity';

describe('FormulasModule (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let appointments: AppointmentsService;
    let servicesRepo: Repository<CatalogService>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
        appointments = moduleFixture.get(AppointmentsService);
        servicesRepo = moduleFixture.get(getRepositoryToken(CatalogService));
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('employee can create formula for their appointment', async () => {
        await servicesRepo.save(servicesRepo.create({ name: 'cut', duration: 30, price: 10 }));
        const client = await users.createUser('cf@test.com', 'secret', 'C', Role.Client);
        const employee = await users.createUser('ef@test.com', 'secret', 'E', Role.Employee);
        const appt = await appointments.create(client.id, employee.id, 1, '2025-07-01T10:00:00.000Z');

        const loginEmp = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'ef@test.com', password: 'secret' })
            .expect(201);
        const empToken = loginEmp.body.access_token;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/formulas`)
            .set('Authorization', `Bearer ${empToken}`)
            .send({ description: 'shade' })
            .expect(201);

        const loginClient = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'cf@test.com', password: 'secret' })
            .expect(201);
        const clientToken = loginClient.body.access_token;

        const res = await request(app.getHttpServer())
            .get(`/clients/${client.id}/formulas`)
            .set('Authorization', `Bearer ${clientToken}`)
            .expect(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0]).toHaveProperty('description', 'shade');
    });

    it('forbids other employees from adding formula', async () => {
        await servicesRepo.save(servicesRepo.create({ name: 'cut', duration: 30, price: 10 }));
        const client = await users.createUser('cf2@test.com', 'secret', 'C', Role.Client);
        const emp1 = await users.createUser('emp1@test.com', 'secret', 'E1', Role.Employee);
        const emp2 = await users.createUser('emp2@test.com', 'secret', 'E2', Role.Employee);
        const appt = await appointments.create(client.id, emp1.id, 1, '2025-07-01T10:00:00.000Z');

        const loginEmp2 = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'emp2@test.com', password: 'secret' })
            .expect(201);
        const tokenEmp2 = loginEmp2.body.access_token;

        await request(app.getHttpServer())
            .post(`/appointments/${appt.id}/formulas`)
            .set('Authorization', `Bearer ${tokenEmp2}`)
            .send({ description: 'bad' })
            .expect(403);
    });
});
