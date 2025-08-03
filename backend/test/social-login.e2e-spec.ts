import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
import { UsersService } from './../src/users/users.service';
import { Role } from './../src/users/role.enum';

describe('AuthController.socialLogin (e2e)', () => {
    let app: INestApplication<App>;
    let users: UsersService;
    let getSpy: jest.SpyInstance;

    beforeEach(async () => {
        getSpy = jest.spyOn(mockedAxios, 'get').mockImplementation((url: string, cfg?: any) => {
            const token = cfg?.params?.id_token ?? new URL(url).searchParams.get('id_token');
            if (token === 'good') {
                return Promise.resolve({ data: { email: 'g@test.com', name: 'G User' } });
            }
            if (token === 'exist') {
                return Promise.resolve({ data: { email: 'log@test.com', name: 'Existing' } });
            }
            if (token === 'dup') {
                return Promise.resolve({ data: { email: 'dup@test.com', name: 'Dup' } });
            }
            return Promise.reject(new Error('bad token'));
        });
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
        users = moduleFixture.get(UsersService);
    });

    afterEach(async () => {
        getSpy.mockRestore();
        if (app) {
            await app.close();
        }
    });

    it('registers new user via Google', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/social-login')
            .send({ provider: 'google', token: 'good', marketingConsent: true })
            .expect(201);
        expect(res.body).toHaveProperty('access_token');
        expect(res.body).toHaveProperty('refresh_token');
        expect(res.body.user.email).toBe('g@test.com');
        expect(res.body.user.role).toBe('client');
    });

    it('logs in existing social user', async () => {
        await users.createSocialUser('log@test.com', 'Existing', 'User');
        await request(app.getHttpServer())
            .post('/auth/social-login')
            .send({ provider: 'google', token: 'exist' })
            .expect(200);
    });

    it('rejects invalid token', async () => {
        await request(app.getHttpServer())
            .post('/auth/social-login')
            .send({ provider: 'google', token: 'bad' })
            .expect(401);
    });

    it('conflict when email used by password account', async () => {
        await users.createUser('dup@test.com', 'secret', 'Dup', Role.Client);
        await request(app.getHttpServer())
            .post('/auth/social-login')
            .send({ provider: 'google', token: 'dup' })
            .expect(400);
    });
});
