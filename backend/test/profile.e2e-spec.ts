import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
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

    it('rejects unauthenticated requests', () => {
        return request(app.getHttpServer()).get('/users/profile').expect(401);
    });

    it('returns profile for authenticated user', async () => {
        const register = await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'test@test.com',
                password: 'Secret123!',
                fullName: 'Test',
                phone: '+48123123130',
                consentRODO: true,
            })
            .expect(201);

        const token = register.body.access_token;

        return request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect((res) => {
                expect(res.body).toHaveProperty('id');
                expect(res.body).toMatchObject({
                    email: 'test@test.com',
                    name: 'Test',
                    role: 'client',
                });
            });
    });

    it('returns profile for user logged in via /auth/login', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'test@test.com',
                password: 'Secret123!',
                fullName: 'Test',
                phone: '+48123123130',
                consentRODO: true,
            })
            .expect(201);

        const login = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'test@test.com', password: 'Secret123!' })
            .expect(201);

        const token = login.body.access_token;

        return request(app.getHttpServer())
            .get('/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
    });
});
