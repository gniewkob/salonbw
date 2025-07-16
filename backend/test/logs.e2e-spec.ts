import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from './../src/users/users.service';
import { LogsService } from './../src/logs/logs.service';
import { Role } from './../src/users/role.enum';
import { LogAction } from './../src/logs/action.enum';

describe('LogsModule (e2e)', () => {
    let app: INestApplication<App>;
    let usersService: UsersService;
    let logsService: LogsService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        usersService = moduleFixture.get(UsersService);
        logsService = moduleFixture.get(LogsService);
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('admin can fetch logs with filters', async () => {
        const admin = await usersService.createUser(
            'admin@logs.com',
            'secret',
            'Admin',
            Role.Admin,
        );
        const other = await usersService.createUser(
            'other@logs.com',
            'secret',
            'Other',
            Role.Client,
        );

        const log = await logsService.create(
            LogAction.LoginSuccess,
            'admin logged in',
            admin.id,
        );
        await logsService.create(LogAction.LoginFail, 'other fail', other.id);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'admin@logs.com', password: 'secret' })
            .expect(201);
        const token = login.body.access_token;

        const res = await request(app.getHttpServer())
            .get('/logs')
            .set('Authorization', `Bearer ${token}`)
            .query({ userId: admin.id, action: LogAction.LoginSuccess })
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(log.id);
    });
});
