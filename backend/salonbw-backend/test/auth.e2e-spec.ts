import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

interface ErrorResponse {
    message: string;
}

interface ProfileResponse {
    userId: number;
}

let AuthModule: typeof import('../src/auth/auth.module')['AuthModule'];
let User: typeof import('../src/users/user.entity')['User'];

describe('Auth & Users (e2e)', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';

        AuthModule = (await import('../src/auth/auth.module')).AuthModule;
        User = (await import('../src/users/user.entity')).User;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [User],
                    synchronize: true,
                }),
                AuthModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
        server = app.getHttpServer() as Parameters<typeof request>[0];
    });

    afterAll(async () => {
        await app.close();
    });

    it('registers a user successfully', async () => {
        const res = await request(server)
            .post('/auth/register')
            .send({
                email: 'john@example.com',
                password: 'password123',
                name: 'John',
            })
            .expect(201);
        const { access_token, refresh_token } = res.body as AuthTokens;

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();
        accessToken = access_token;
        refreshToken = refresh_token;
    });

    it('fails to register with duplicate email', async () => {
        const res = await request(server)
            .post('/auth/register')
            .send({
                email: 'john@example.com',
                password: 'password123',
                name: 'John',
            })
            .expect(400);
        const { message } = res.body as ErrorResponse;

        expect(message).toBe('Email already exists');
    });

    it('logs in with valid credentials', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'password123' })
            .expect(201);
        const { access_token, refresh_token } = res.body as AuthTokens;

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();
        accessToken = access_token;
        refreshToken = refresh_token;
    });

    it('fails to log in with invalid credentials', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'wrongpass' })
            .expect(401);
        const { message } = res.body as ErrorResponse;

        expect(message).toBe('Invalid credentials');
    });

    it('refreshes token and returns new access token', async () => {
        // Wait a moment to ensure new token has different timestamp
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await request(server)
            .post('/auth/refresh')
            .send({ refreshToken })
            .expect(200);
        const { access_token, refresh_token } = res.body as AuthTokens;

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();
        expect(access_token).not.toBe(accessToken);
        accessToken = access_token;
        refreshToken = refresh_token;
    });

    it('denies access to profile without token', async () => {
        await request(server).get('/users/profile').expect(401);
    });

    it('allows access to profile with valid token', async () => {
        const res = await request(server)
            .get('/users/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        const { userId } = res.body as ProfileResponse;

        expect(userId).toBe(1);
    });
});

