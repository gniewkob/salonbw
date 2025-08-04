import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly service: NotificationsService) {}

    @Get()
    @Public()
    list() {
        return this.service.findAll();
    }
}
