import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Notifications (e2e)', () => {
    let app: INestApplication<App>;

    beforeEach(async () => {
        process.env.NOTIFICATIONS_ENABLED = 'false';
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
        delete process.env.NOTIFICATIONS_ENABLED;
    });

    it('returns list of notifications', async () => {
        const res = await request(app.getHttpServer())
            .get('/notifications')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });
});
