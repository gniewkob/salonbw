import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { EmailsService } from './emails/emails.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
    const originalFetch = global.fetch;
    afterEach(() => {
        global.fetch = originalFetch;
    });

    const buildService = ({
        dbOk = true,
        smtpHost = undefined as string | undefined,
        igToken = undefined as string | undefined,
    } = {}) => {
        const dataSource = {
            query: jest
                .fn()
                .mockImplementation(() =>
                    dbOk
                        ? Promise.resolve([1])
                        : Promise.reject(new Error('db')),
                ),
        } as unknown as DataSource;
        const emailsService = {
            verifyConnection: jest.fn().mockResolvedValue(undefined),
        };
        const config = {
            get: jest.fn((key: string, fallback?: string) => {
                if (key === 'SMTP_HOST') return smtpHost;
                if (key === 'INSTAGRAM_ACCESS_TOKEN') return igToken;
                if (key === 'INSTAGRAM_HEALTH_USER_ID') return 'me';
                if (key === 'INSTAGRAM_HEALTH_TIMEOUT_MS') {
                    return fallback ?? '5000';
                }
                return undefined;
            }),
        };
        return new HealthService(
            dataSource,
            emailsService as unknown as EmailsService,
            config as unknown as ConfigService,
        );
    };

    it('returns ok summary when dependencies healthy or skipped', async () => {
        (global as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: '123' }),
        });
        const service = buildService({
            smtpHost: 'mail0.mydevil.net',
            igToken: 'token',
        });
        const summary = await service.getHealthSummary();
        expect(summary.status).toBe('ok');
        expect(summary.services.database.status).toBe('ok');
        expect(summary.services.smtp.status).toBe('ok');
        expect(summary.services.instagram.status).toBe('ok');
    });

    it('marks instagram check as skipped when token missing', async () => {
        const service = buildService();
        const summary = await service.getHealthSummary();
        expect(summary.services.instagram.status).toBe('skipped');
    });

    it('throws from assertDatabaseHealthy when db fails', async () => {
        const service = buildService({ dbOk: false });
        await expect(service.assertDatabaseHealthy()).rejects.toThrow(
            'Database connection failed',
        );
    });
});
