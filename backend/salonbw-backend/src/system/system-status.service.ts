import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthService } from '../health.service';

@Injectable()
export class SystemStatusService {
    constructor(
        private readonly health: HealthService,
        private readonly config: ConfigService,
    ) {}

    async getStatus() {
        const summary = await this.health.getHealthSummary();
        const services = Object.fromEntries(
            Object.entries(summary.services).map(([key, value]) => [
                key,
                {
                    status: value.status,
                    latencyMs: value.latencyMs,
                },
            ]),
        );
        const release = this.config.get<string>('APP_RELEASE');
        return {
            checkedAt: summary.timestamp,
            status: Object.values(services).every((s) => s.status === 'ok')
                ? ('ok' as const)
                : ('degraded' as const),
            api: {
                status: 'ok' as const,
                uptimeSeconds: Math.floor(process.uptime()),
                revision:
                    release && /^[a-f0-9]{40}$/.test(release) ? release : null,
            },
            services,
            notifications: { deliveryVerification: 'unknown' as const },
        };
    }
}
