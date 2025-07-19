import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
    constructor(private readonly service: CalendarService) {}

    @Get('add/:id')
    async add(
        @Param('id') id: number,
        @Query('provider') provider = 'ics',
        @Headers('authorization') auth?: string,
    ) {
        const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
        return this.service.add(Number(id), provider, token);
    }
}
