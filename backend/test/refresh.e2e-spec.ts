import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AuthController.refresh (e2e)', () => {
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

    // No user is seeded here so any refresh token should be invalid
    // and the endpoint must return Unauthorized (401).
    it('/auth/refresh (POST)', () => {
        return request(app.getHttpServer())
            .post('/auth/refresh')
            .send({ refresh_token: 'token' })
            .expect(401);
    });
});
