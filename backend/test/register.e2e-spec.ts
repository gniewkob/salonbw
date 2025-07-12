import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
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
        await app.close();
    });

    it('/auth/register (POST)', () => {
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'test@test.com', password: 'secret', name: 'Test' })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('access_token');
                expect(res.body).toHaveProperty('refresh_token');
            });
    });

    it('/auth/register (POST) invalid data', () => {
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'bad', password: '123', name: 'T' })
            .expect(400);
    });
});
