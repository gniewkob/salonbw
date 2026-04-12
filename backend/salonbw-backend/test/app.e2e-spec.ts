import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health.controller';

@Module({
    controllers: [HealthController],
})
class TestAppModule {}

const SKIP = process.env.SKIP_BIND_TESTS === '1';
const d = SKIP ? describe.skip : describe;

d('Health (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestAppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/health (GET)', () => {
        const server = app.getHttpServer() as Parameters<typeof request>[0];
        return request(server)
            .get('/health')
            .expect(200)
            .expect({ status: 'ok' });
    });
});
