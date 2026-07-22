import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { performance } from 'node:perf_hooks';
import { DataSource } from 'typeorm';
import { EmailsService } from './emails/emails.service';

type CheckStatus = 'ok' | 'error' | 'skipped';

type InstagramErrorPayload = {
    error?: {
        type?: unknown;
        code?: unknown;
        error_subcode?: unknown;
    };
};

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

    private async runDependencyCheck(
        fn: () => Promise<void>,
    ): Promise<DependencyStatus> {
        const start = performance.now();
        try {
            await fn();
            return { status: 'ok', latencyMs: performance.now() - start };
        } catch (error) {
            return {
                status: 'error',
                latencyMs: performance.now() - start,
                message: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async checkDatabase(): Promise<DependencyStatus> {
        return this.runDependencyCheck(async () => {
            await this.dataSource.query('SELECT 1');
        });
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
        return this.runDependencyCheck(async () => {
            await this.emailsService.verifyConnection();
        });
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
        return this.runDependencyCheck(async () => {
            const controller = AbortSignal.timeout(this.instagramTimeoutMs);
            const resp = await fetch(url, { signal: controller });
            if (!resp.ok) {
                throw new Error(await this.formatInstagramHttpError(resp));
            }
            const payload = (await resp.json()) as { id?: string };
            if (!payload?.id) {
                throw new Error('instagram_invalid_payload');
            }
        });
    }

    private async formatInstagramHttpError(resp: Response): Promise<string> {
        const fragments = [`instagram_http_${resp.status}`];
        try {
            const payload = (await resp.json()) as InstagramErrorPayload;
            const error = payload.error;
            if (!error) return fragments.join('_');

            if (typeof error.type === 'string') {
                fragments.push(error.type.toLowerCase());
            }
            if (
                typeof error.code === 'string' ||
                typeof error.code === 'number'
            ) {
                fragments.push(String(error.code));
            }
            if (
                typeof error.error_subcode === 'string' ||
                typeof error.error_subcode === 'number'
            ) {
                fragments.push(String(error.error_subcode));
            }
        } catch {
            // Keep the health response secret-safe and deterministic even when
            // Instagram returns a non-JSON error body.
        }
        return fragments.join('_');
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
        // Only the database check is critical for overall health.
        // SMTP and Instagram may fail without making the service unavailable.
        const status = database.status === 'ok' ? 'ok' : 'error';
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
