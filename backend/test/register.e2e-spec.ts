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
        if (app) {
            await app.close();
        }
    });

    it('/auth/register (POST)', () => {
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'test@test.com',
                password: 'Secret123!',
                fullName: 'Test',
                phone: '+48123123123',
                consentRODO: true,
            })
            .expect(201)
            .expect((res) => {
                expect(res.body).toHaveProperty('access_token');
                expect(res.body).toHaveProperty('refresh_token');
            });
    });

    it('/auth/register (POST) invalid data', () => {
        return request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'bad',
                password: '123',
                fullName: 'T',
                phone: '123',
                consentRODO: false,
            })
            .expect(400);
    });

    it('/auth/register (POST) rejects duplicates', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'dup@test.com',
                password: 'Secret123!',
                fullName: 'One',
                phone: '+48123123124',
                consentRODO: true,
            })
            .expect(201);

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({
                email: 'dup@test.com',
                password: 'Other123!',
                fullName: 'Two',
                phone: '+48123123125',
                consentRODO: true,
            })
            .expect(400);
    });
});
