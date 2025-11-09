import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseSlowQueryService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseSlowQueryService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {}

    async onModuleInit(): Promise<void> {
        const thresholdRaw = this.configService.get<string>(
            'DB_SLOW_QUERY_MS',
            '1000',
        );
        const thresholdMs = Number(thresholdRaw);
        if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
            this.logger.log('Slow query logging disabled (invalid threshold)');
            return;
        }

        try {
            await this.dataSource.query(
                `SET log_min_duration_statement = ${Math.floor(thresholdMs)}`,
            );
            this.logger.log(
                `Configured PostgreSQL slow query logging at ${Math.floor(thresholdMs)} ms`,
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            this.logger.warn(
                `Unable to configure slow query logging: ${message}`,
            );
        }
    }
}
