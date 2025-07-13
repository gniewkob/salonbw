import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppointmentsModule (e2e)', () => {
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

    it('client can list own appointments', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'client@test.com', password: 'secret', name: 'Client' })
            .expect(201);
        const token = register.body.access_token;
        await request(app.getHttpServer())
            .get('/appointments/client')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });

    it('client cannot access admin endpoints', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'client2@test.com', password: 'secret', name: 'Client' })
            .expect(201);
        const token = register.body.access_token;
        await request(app.getHttpServer())
            .get('/appointments/admin')
            .set('Authorization', `Bearer ${token}`)
            .expect(403);
    });
});
