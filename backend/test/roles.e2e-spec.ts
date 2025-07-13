import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('RolesGuard (e2e)', () => {
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

    it('rejects non-admin user creating a new user', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'client@test.com', password: 'secret', name: 'Client' })
            .expect(201);

        const token = register.body.access_token;

        return request(app.getHttpServer())
            .post('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'new@test.com', password: 'secret', name: 'New' })
            .expect(403);
    });
});
