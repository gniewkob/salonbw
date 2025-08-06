import { ApiErrorResponses } from './common/decorators/api-error-responses.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @Public()
    @ApiOperation({ summary: 'Health check' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    getHealth() {
        return { status: 'ok' };
    }
}
