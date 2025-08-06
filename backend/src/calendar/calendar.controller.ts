import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { CalendarService } from './calendar.service';

@ApiTags('Calendar')
@Controller('calendar')
export class CalendarController {
    constructor(private readonly service: CalendarService) {}

    @Get('add/:id')
    @Public()
    @ApiOperation({ summary: 'Add event to calendar' })
    @ApiResponse({ status: 200 })
    @ApiErrorResponses()
    async add(
        @Param('id') id: number,
        @Query('provider') provider = 'ics',
        @Headers('authorization') auth?: string,
    ) {
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
        return this.service.add(Number(id), provider, token);
    }
}
