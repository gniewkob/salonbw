import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { MetricsService } from './metrics.service';

interface PoolStats {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
}

@Injectable()
export class DatabaseMetricsService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseMetricsService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly metricsService: MetricsService,
    ) {}

    onModuleInit() {
        // Collect initial metrics
        this.collectPoolMetrics();
    }

    /**
     * Collect database connection pool metrics every 10 seconds
     */
    @Interval(10000)
    collectPoolMetrics(): void {
        try {
            const driver = this.dataSource.driver;

            // TypeORM uses node-postgres (pg) driver for PostgreSQL
            // Access the underlying pool through the driver
            if ('master' in driver && driver.master) {
                const pool = driver.master as unknown as {
                    totalCount?: number;
                    idleCount?: number;
                    waitingCount?: number;
                };

                const stats: PoolStats = {
                    totalCount: pool.totalCount ?? 0,
                    idleCount: pool.idleCount ?? 0,
                    waitingCount: pool.waitingCount ?? 0,
                };

                const activeCount = stats.totalCount - stats.idleCount;

                this.metricsService.setDbConnectionsTotal(stats.totalCount);
                this.metricsService.setDbConnectionsIdle(stats.idleCount);
                this.metricsService.setDbConnectionsActive(activeCount);

                this.logger.debug(
                    `Database pool: ${activeCount} active, ${stats.idleCount} idle, ${stats.totalCount} total`,
                );
            }
        } catch (error) {
            this.logger.warn(
                'Failed to collect database pool metrics',
                error instanceof Error ? error.message : String(error),
            );
        }
    }
}
