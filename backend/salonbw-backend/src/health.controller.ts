import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get('health')
    @ApiOperation({ summary: 'Health check' })
    @ApiResponse({ status: 200, description: 'Service is up' })
    getHealth() {
        return { status: 'ok' };
    }

    @Get('healthz')
    @ApiOperation({ summary: 'Health check with dependencies' })
    @ApiResponse({
        status: 200,
        description: 'Service and dependencies are up',
    })
    async getDeepHealth() {
        return this.healthService.getHealthSummary();
    }
}
