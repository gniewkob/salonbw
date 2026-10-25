import {
    ExecutionContext,
    INestApplication,
    UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import request from 'supertest';
import { SystemStatusController } from './system-status.controller';
import { SystemStatusService } from './system-status.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { HealthService } from '../health.service';
import { ConfigService } from '@nestjs/config';

// HTTP contract with deterministic authentication, without real account tokens/data.
const accounts: Record<
    string,
    { userId: number; role: Role; isSystemAdmin: boolean }
> = {
    'Bearer salon-admin': { userId: 1, role: Role.Admin, isSystemAdmin: false },
    'Bearer system-admin': { userId: 2, role: Role.Admin, isSystemAdmin: true },
    'Bearer client': { userId: 3, role: Role.Client, isSystemAdmin: false },
};
describe('GET /system/status access boundary', () => {
    let app: INestApplication;
    beforeAll(async () => {
        const module = await Test.createTestingModule({
            controllers: [SystemStatusController],
            providers: [
                {
                    provide: UsersService,
                    useValue: {
                        findById: (id: number) =>
                            Object.values(accounts).find(
                                (a) => a.userId === id,
                            ),
                    },
                },
                SystemStatusService,
                {
                    provide: HealthService,
                    useValue: {
                        getHealthSummary: () => ({
                            timestamp: '2026-10-25T10:00:00.000Z',
                            services: {
                                database: { status: 'ok', latencyMs: 1 },
                                smtp: {
                                    status: 'error',
                                    latencyMs: 2,
                                    message: 'PRIVATE_DIAGNOSTIC',
                                },
                            },
                        }),
                    },
                },
                { provide: ConfigService, useValue: { get: () => undefined } },
            ],
        })
            .overrideGuard(AuthGuard('jwt'))
            .useValue({
                canActivate: (ctx: ExecutionContext) => {
                    const req = ctx.switchToHttp().getRequest<{
                        headers: { authorization?: string };
                        user?: unknown;
                    }>();
                    const actor = accounts[req.headers.authorization ?? ''];
                    if (!actor) throw new UnauthorizedException();
                    req.user = actor;
                    return true;
                },
            })
            .compile();
        app = module.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('requires authentication', async () => {
        await request(app.getHttpServer()).get('/system/status').expect(401);
    });
    it.each(['salon-admin', 'client'])('denies %s', async (actor) => {
        await request(app.getHttpServer())
            .get('/system/status')
            .set('Authorization', `Bearer ${actor}`)
            .expect(403);
    });
    it('allows a system administrator and forbids caching', async () => {
        const response = await request(app.getHttpServer())
            .get('/system/status')
            .set('Authorization', 'Bearer system-admin')
            .expect(200);
        expect(response.headers['cache-control']).toBe('no-store');
        expect(response.body.notifications.deliveryVerification).toBe(
            'unknown',
        );
    });
});
