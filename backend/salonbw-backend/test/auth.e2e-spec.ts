import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';

// Use require to ensure env variables are set before modules load
const { AuthModule } = require('../src/auth/auth.module');
const { User } = require('../src/users/user.entity');

@Module({
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
})
class TestAppModule {}

describe('Auth & Users (e2e)', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
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

        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
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

        expect(res.body.message).toBe('Email already exists');
    });

    it('logs in with valid credentials', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'password123' })
            .expect(201);

        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
    });

    it('fails to log in with invalid credentials', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email: 'john@example.com', password: 'wrongpass' })
            .expect(401);

        expect(res.body.message).toBe('Invalid credentials');
    });

    it('refreshes token and returns new access token', async () => {
        // Wait a moment to ensure new token has different timestamp
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await request(server)
            .post('/auth/refresh')
            .send({ refreshToken })
            .expect(200);

        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
        expect(res.body.access_token).not.toBe(accessToken);
        accessToken = res.body.access_token;
        refreshToken = res.body.refresh_token;
    });

    it('denies access to profile without token', async () => {
        await request(server).get('/users/profile').expect(401);
    });

    it('allows access to profile with valid token', async () => {
        const res = await request(server)
            .get('/users/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);
        expect(res.body.userId).toBe(1);
    });
});

