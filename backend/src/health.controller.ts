import { ApiErrorResponses } from './common/decorators/api-error-responses.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Get()
    @Public()
    @ApiOperation({ summary: 'Health check' })
    @ApiOkResponse({
        description: 'Service is up and running',
        schema: {
            example: { status: 'ok' },
        },
    })
    @ApiErrorResponses()
    getHealth(): { status: string } {
        return { status: 'ok' };
    }
}
