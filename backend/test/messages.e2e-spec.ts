import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('MessagesModule (e2e)', () => {
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

    it('allows sending and listing messages', async () => {
        const client = await usersService.createUser(
            'client@msg.com',
            'secret',
            'Client',
            Role.Client,
        );
        const employee = await usersService.createUser(
            'emp@msg.com',
            'secret',
            'Emp',
            Role.Employee,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'client@msg.com', password: 'secret' })
            .expect(201);

        const token = login.body.access_token;

        await request(app.getHttpServer())
            .post('/messages')
            .set('Authorization', `Bearer ${token}`)
            .send({ recipientId: employee.id, content: 'hello' })
            .expect(201);

        await request(app.getHttpServer())
            .get('/messages')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('forbids admin from accessing messages endpoints', async () => {
        await usersService.createUser(
            'admin@msg.com',
            'secret',
            'Admin',
            Role.Admin,
        );

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@msg.com', password: 'secret' })
            .expect(201);

        const token = login.body.access_token;

        await request(app.getHttpServer())
            .get('/messages')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });
});
