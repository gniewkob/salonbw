import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthService } from '../health.service';
import { UsersService } from '../users/users.service';
import { Role } from '../users/role.enum';
import { SystemStatusService } from './system-status.service';
import { SystemStatusController } from './system-status.controller';

function service(status: 'ok' | 'error' | 'skipped' = 'ok', release?: string) {
    return new SystemStatusService(
        {
            getHealthSummary: jest.fn().mockResolvedValue({
                status: 'ok',
                timestamp: '2026-10-25T10:00:00.000Z',
                services: {
                    database: { status: 'ok', latencyMs: 1 },
                    smtp: {
                        status,
                        latencyMs: 2,
                        message: 'PRIVATE_DIAGNOSTIC_MUST_NOT_LEAVE_SERVER',
                    },
                    instagram: { status: 'ok', latencyMs: 3 },
                },
            }),
        } as unknown as HealthService,
        { get: () => release } as unknown as ConfigService,
    );
}

describe('system status contract', () => {
    it('reports a dependency failure even when the public overall health is ok', async () => {
        const result = await service('error').getStatus();
        expect(result.status).toBe('degraded');
        expect(result.services.smtp.status).toBe('error');
        expect(JSON.stringify(result)).not.toContain('PRIVATE_DIAGNOSTIC');
        expect(result.notifications.deliveryVerification).toBe('unknown');
    });
    it('does not label an unconfigured dependency or unknown release as healthy', async () => {
        const result = await service('skipped', 'not-a-release').getStatus();
        expect(result.status).toBe('degraded');
        expect(result.api.revision).toBeNull();
    });
    it('uses only a valid immutable deployment SHA', async () => {
        expect(
            (await service('ok', 'a'.repeat(40)).getStatus()).api.revision,
        ).toBe('a'.repeat(40));
    });
    it.each([
        { role: Role.Admin, isSystemAdmin: false },
        { role: Role.Client, isSystemAdmin: true },
    ])(
        'denies technical status to an account without system-admin authority',
        async (user) => {
            const c = new SystemStatusController(
                {
                    findById: jest.fn().mockResolvedValue(user),
                } as unknown as UsersService,
                service(),
            );
            await expect(
                c.status({ userId: 1, role: user.role }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        },
    );
    it('permits a current system administrator', async () => {
        const c = new SystemStatusController(
            {
                findById: jest.fn().mockResolvedValue({
                    role: Role.Admin,
                    isSystemAdmin: true,
                }),
            } as unknown as UsersService,
            service(),
        );
        expect((await c.status({ userId: 1, role: Role.Admin })).status).toBe(
            'ok',
        );
    });
});
