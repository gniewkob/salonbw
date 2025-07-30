import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController.login (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
        await app.init();
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('/auth/login (POST) authenticates seeded user', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'test@test.com',
                password: 'Secret123!',
                fullName: 'Test',
                phone: '+48123123123',
                consentRODO: true,
            })
            .expect(201);

        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'test@test.com', password: 'Secret123!' })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('access_token');
                expect(res.body).toHaveProperty('refresh_token');
            });
    });

    it('/auth/login (POST) rejects wrong password', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'test@test.com',
                password: 'Secret123!',
                fullName: 'Test',
                phone: '+48123123123',
                consentRODO: true,
            })
            .expect(201);

        return request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'test@test.com', password: 'invalid' })
            .expect(401);
    });
});
