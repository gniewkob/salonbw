import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';

import { AuthModule } from '../src/auth/auth.module';
import { LogsModule } from '../src/logs/logs.module';
import { LogService } from '../src/logs/log.service';
import { Log, LogAction } from '../src/logs/log.entity';
import { User } from '../src/users/user.entity';
import { AuthFailureFilter } from '../src/logs/auth-failure.filter';

interface LogsResponse {
    data: Log[];
    total: number;
}

describe('LogsController (e2e)', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let logService: LogService;
    let userRepo: Repository<User>;
    let admin: User;
    let user: User;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({ isGlobal: true }),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [User, Log],
                    synchronize: true,
                }),
                AuthModule,
                LogsModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        logService = moduleFixture.get(LogService);
        app.useGlobalFilters(new AuthFailureFilter(logService));
        await app.init();
        server = app.getHttpServer() as Parameters<typeof request>[0];

        userRepo = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        admin = await userRepo.save({
            email: 'admin@example.com',
            password: 'pass',
            name: 'Admin',
            role: 'admin',
        });
        user = await userRepo.save({
            email: 'user@example.com',
            password: 'pass',
            name: 'User',
            role: 'client',
        });

        await logService.logAction(admin, LogAction.Login, {
            note: 'admin log',
        });
        await logService.logAction(user, LogAction.Login, { note: 'user log' });
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns logs for admin users', async () => {
        const adminToken: string = jwt.sign(
            { sub: admin.id, role: 'admin' },
            process.env.JWT_SECRET ?? '',
        );
        const res = await request(server)
            .get('/logs')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

        const body = res.body as LogsResponse;
        expect(body.total).toBe(2);
        expect(body.data).toHaveLength(2);
    });

    it('forbids access for non-admin and logs the attempt', async () => {
        const before = await logService.findAll({
            action: LogAction.AUTHORIZATION_FAIL,
        });

        const userToken: string = jwt.sign(
            { sub: user.id, role: 'client' },
            process.env.JWT_SECRET ?? '',
        );
        await request(server)
            .get('/logs')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);

        const after = await logService.findAll({
            action: LogAction.AUTHORIZATION_FAIL,
        });
        expect(after.total).toBe(before.total + 1);
    });
});
