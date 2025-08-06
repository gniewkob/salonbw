import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly service: NotificationsService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'List notifications' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }
}
