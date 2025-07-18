import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('ServicesModule (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('rejects client creating a service', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'client@services.com',
                password: 'secret',
                name: 'Client',
            })
            .expect(201);

        const token = (register.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .post('/services')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'cut', duration: 30, price: 10 })
            .expect(403);
    });

    it('returns 404 when deleting missing service', async () => {
        await users.createUser(
            'admin@services.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@services.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .delete('/services/9999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('responds 404 for deleting a nonexistent service', async () => {
        await users.createUser(
            'otheradmin@services.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'otheradmin@services.com', password: 'secret' })
            .expect(201);

        const token = (login.body as { access_token: string }).access_token;

        await request(app.getHttpServer())
            .delete('/services/8888')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('rejects deleting service with appointments', async () => {
        const client = await users.createUser(
            'svcclient@test.com',
            'secret',
            'C',
            Role.Client,
        );
        const employee = await users.createUser(
            'svcemp@test.com',
            'secret',
            'E',
            Role.Employee,
        );
        await users.createUser(
            'svcadmin@test.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'svcadmin@test.com', password: 'secret' })
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
            .delete('/services/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });
});
