import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/user.entity';
import { Log } from '../src/logs/log.entity';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

// Typed response bodies for request assertions
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

describe('Auth & Users (e2e)', () => {
    let app: INestApplication;
    let server: Parameters<typeof request>[0];
    let accessToken: string;
    let refreshToken: string;
    let adminAccessToken: string;
    let moduleFixture: TestingModule;

    beforeAll(async () => {
        process.env.JWT_SECRET = 'test-secret';
        process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

        moduleFixture = await Test.createTestingModule({
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
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.use(cookieParser());
        await app.init();
        const userRepo = moduleFixture.get<Repository<User>>(
            getRepositoryToken(User),
        );
        const adminPassword = await bcrypt.hash('adminpass', 10);
        await userRepo.save({
            email: 'admin@example.com',
            password: adminPassword,
            name: 'Admin',
            role: 'admin',
            commissionBase: 0,
        });
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
        const accessPayload = jwt.verify(
            access_token,
            process.env.JWT_SECRET as string,
        ) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(2);
        expect(accessPayload.role).toBe('client');
        const refreshPayload = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET as string,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(2);
        expect(refreshPayload.role).toBe('client');
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
            .expect(200);
        const { access_token, refresh_token } = res.body as AuthTokens;

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();
        const accessPayload = jwt.verify(
            access_token,
            process.env.JWT_SECRET as string,
        ) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(2);
        expect(accessPayload.role).toBe('client');
        const refreshPayload = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET as string,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(2);
        expect(refreshPayload.role).toBe('client');
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
        const accessPayload = jwt.verify(
            access_token,
            process.env.JWT_SECRET as string,
        ) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(2);
        expect(accessPayload.role).toBe('client');
        const refreshPayload = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET as string,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(2);
        expect(refreshPayload.role).toBe('client');
        accessToken = access_token;
        refreshToken = refresh_token;
    });

    it('refreshes token using cookie when body token is missing', async () => {
        // Wait to ensure new token differs from previous one
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await request(server)
            .post('/auth/refresh')
            .set('Cookie', `refreshToken=${refreshToken}`)
            .send({})
            .expect(200);
        const { access_token, refresh_token } = res.body as AuthTokens;

        expect(access_token).toBeDefined();
        expect(refresh_token).toBeDefined();
        expect(access_token).not.toBe(accessToken);
        const accessPayload = jwt.verify(
            access_token,
            process.env.JWT_SECRET as string,
        ) as jwt.JwtPayload;
        expect(accessPayload.sub).toBe(2);
        expect(accessPayload.role).toBe('client');
        const refreshPayload = jwt.verify(
            refresh_token,
            process.env.JWT_REFRESH_SECRET as string,
        ) as jwt.JwtPayload;
        expect(refreshPayload.sub).toBe(2);
        expect(refreshPayload.role).toBe('client');
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

        expect(userId).toBe(2);
    });

    it('denies access to admin endpoint for client', async () => {
        await request(server)
            .get('/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(403);
    });

    it('denies client from creating a user', async () => {
        await request(server)
            .post('/users')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                email: 'clientcreate@example.com',
                password: 'password123',
                name: 'ClientCreate',
            })
            .expect(403);
    });

    it('logs in admin user', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email: 'admin@example.com', password: 'adminpass' })
            .expect(200);
        const { access_token } = res.body as AuthTokens;
        adminAccessToken = access_token;
    });

    it('allows access to admin endpoint for admin', async () => {
        const res = await request(server)
            .get('/users')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .expect(200);
        const users = res.body as unknown[];
        expect(users.length).toBeGreaterThanOrEqual(1);
    });

    it('allows admin to create a user', async () => {
        await request(server)
            .post('/users')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .send({
                email: 'newuser@example.com',
                password: 'password123',
                name: 'New User',
            })
            .expect(201);
    });

    it('allows admin to access client endpoint', async () => {
        await request(server)
            .get('/users/profile')
            .set('Authorization', `Bearer ${adminAccessToken}`)
            .expect(200);
    });
});
