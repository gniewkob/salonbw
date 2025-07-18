import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('RolesGuard (e2e)', () => {
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

    it('rejects non-admin user creating a new user', async () => {
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

        return request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'new@test.com', password: 'secret', name: 'New' })
            .expect(403);
    });

    it('allows admin user to create a new user', async () => {
        await usersService.createUser(
            'admin@test.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@test.com', password: 'secret' })
            .expect(201);

        const { access_token: token } = login.body as { access_token: string };

        await request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                email: 'client2@test.com',
                password: 'secret',
                name: 'Client2',
            })
            .expect(201);
    });
});
