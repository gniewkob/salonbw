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

    it('creates log entry when sending test notification', async () => {
        await request(app.getHttpServer())
            .post('/notifications/test')
            .send({ to: '+111', message: 'hi', type: 'sms' })
            .expect(201);

        const res = await request(app.getHttpServer())
            .get('/notifications')
            .expect(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});
