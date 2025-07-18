import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('User deletion (e2e)', () => {
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

    it('rejects deleting customer with appointments', async () => {
        await usersService.createUser(
            'deladmin@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const employee = await usersService.createUser(
            'delemployee@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'delclient@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const login: Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'deladmin@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: future,
            })
            .expect(201);

        await request(app.getHttpServer())
            .delete(`/users/customers/${client.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    it('rejects deleting employee with appointments', async () => {
        await usersService.createUser(
            'empadmin@test.com',
            'secret',
            'A',
            Role.Admin,
        );
        const employee = await usersService.createUser(
            'empdel@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        const client = await usersService.createUser(
            'empclient@test.com',
            'secret',
            'C',
            Role.Client,
        );

        const login: Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'empadmin@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await request(app.getHttpServer())
            .post('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .send({
                clientId: client.id,
                employeeId: employee.id,
                serviceId: 1,
                startTime: future,
            })
            .expect(201);

        await request(app.getHttpServer())
            .delete(`/users/employees/${employee.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    it('prevents admin from deleting self', async () => {
        const admin = await usersService.createUser(
            'self@test.com',
            'secret',
            'Self',
            Role.Admin,
        );
        const login: Response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'self@test.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .delete(`/users/employees/${admin.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
});
