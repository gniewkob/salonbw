import { Module } from '@nestjs/common';
import { DatabaseMetricsService } from './database-metrics.service';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
    controllers: [MetricsController],
    providers: [MetricsService, HttpMetricsInterceptor, DatabaseMetricsService],
    exports: [MetricsService, HttpMetricsInterceptor],
})
export class ObservabilityModule {}
