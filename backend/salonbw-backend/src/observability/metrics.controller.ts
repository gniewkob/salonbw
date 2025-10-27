import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) {}

    @Get('metrics')
    @Header('Cache-Control', 'no-store, max-age=0')
    async getMetrics(
        @Res({ passthrough: true }) response: Response,
    ): Promise<string> {
        response.type(this.metricsService.contentType);
        return this.metricsService.getMetrics();
    }
}
