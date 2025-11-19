import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { performance } from 'node:perf_hooks';
import { DataSource } from 'typeorm';
import { EmailsService } from './emails/emails.service';

type CheckStatus = 'ok' | 'error' | 'skipped';

export type DependencyStatus = {
    status: CheckStatus;
    latencyMs: number;
    message?: string;
};

export type HealthSummary = {
    status: 'ok' | 'error';
    timestamp: string;
    services: Record<string, DependencyStatus>;
};

@Injectable()
export class HealthService {
    private readonly instagramTimeoutMs: number;

    constructor(
        private readonly dataSource: DataSource,
        private readonly emailsService: EmailsService,
        private readonly config: ConfigService,
    ) {
        this.instagramTimeoutMs = Number(
            this.config.get<string>('INSTAGRAM_HEALTH_TIMEOUT_MS', '5000'),
        );
    }

    private async runCheck(
        fn: () => Promise<void>,
    ): Promise<Omit<DependencyStatus, 'status'>> {
        const start = performance.now();
        await fn();
        return { latencyMs: performance.now() - start };
    }

    private async checkDatabase(): Promise<DependencyStatus> {
        try {
            const result = await this.runCheck(async () => {
                await this.dataSource.query('SELECT 1');
            });
            return { status: 'ok', ...result };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: 0,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async checkSmtp(): Promise<DependencyStatus> {
        const smtpHost = this.config.get<string>('SMTP_HOST');
        if (!smtpHost) {
            return {
                status: 'skipped',
                latencyMs: 0,
                message: 'SMTP not configured',
            };
        }
        try {
            const result = await this.runCheck(async () => {
                await this.emailsService.verifyConnection();
            });
            return { status: 'ok', ...result };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: 0,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async checkInstagram(): Promise<DependencyStatus> {
        const token = this.config.get<string>('INSTAGRAM_ACCESS_TOKEN');
        if (!token) {
            return {
                status: 'skipped',
                latencyMs: 0,
                message: 'INSTAGRAM_ACCESS_TOKEN not set',
            };
        }
        const userId =
            this.config.get<string>('INSTAGRAM_HEALTH_USER_ID') ?? 'me';
        const params = new URLSearchParams({
            fields: 'id',
            access_token: token,
        });
        const url = `https://graph.instagram.com/${userId}?${params.toString()}`;
        try {
            const result = await this.runCheck(async () => {
                const controller = AbortSignal.timeout(this.instagramTimeoutMs);
                const resp = await fetch(url, { signal: controller });
                if (!resp.ok) {
                    throw new Error(`instagram_http_${resp.status}`);
                }
                const payload = (await resp.json()) as { id?: string };
                if (!payload?.id) {
                    throw new Error('instagram_invalid_payload');
                }
            });
            return { status: 'ok', ...result };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: 0,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async getHealthSummary(): Promise<HealthSummary> {
        const [database, smtp, instagram] = await Promise.all([
            this.checkDatabase(),
            this.checkSmtp(),
            this.checkInstagram(),
        ]);
        const services: Record<string, DependencyStatus> = {
            database,
            smtp,
            instagram,
        };
        const status = Object.values(services).every(
            (svc) => svc.status !== 'error',
        )
            ? 'ok'
            : 'error';
        return {
            status,
            timestamp: new Date().toISOString(),
            services,
        };
    }

    async assertDatabaseHealthy(): Promise<void> {
        const check = await this.checkDatabase();
        if (check.status === 'error') {
            const message = check.message
                ? `Database connection failed: ${check.message}`
                : 'Database connection failed';
            throw new ServiceUnavailableException(message);
        }
    }
}
