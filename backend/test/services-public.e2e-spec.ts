import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('ServicesController (public) (e2e)', () => {
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

    it('/services (GET) allows anonymous access', () => {
        return request(app.getHttpServer()).get('/services').expect(200);
    });

    it('/services/:id (GET) returns single service', async () => {
        const res = await request(app.getHttpServer())
            .get('/services/1')
            .expect(200);
        expect(res.body.name).toBeDefined();
    });

    it('/services/:id (GET) returns 404 for missing', () => {
        return request(app.getHttpServer()).get('/services/9999').expect(404);
    });
});

