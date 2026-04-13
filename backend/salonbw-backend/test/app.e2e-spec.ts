import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/health.controller';
import { HealthService } from '../src/health.service';

@Module({
    controllers: [HealthController],
    providers: [
        {
            provide: HealthService,
            useValue: {
                getHealthSummary: async () => ({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    services: {},
                }),
            },
        },
    ],
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

        app = moduleFixture.createNestApplication({ bodyParser: false });
        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('/health (GET)', () => {
        const server = app.getHttpServer() as Parameters<typeof request>[0];
        return request(server)
            .get('/health')
            .expect(200)
            .expect({ status: 'ok' });
    });
});
