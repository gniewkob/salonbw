import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import {
    NotificationsService,
    NotificationType,
} from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly service: NotificationsService) {}

    @Get()
    @Public()
    list() {
        return this.service.findAll();
    }

    @Post('test')
    @Public()
    test(
        @Body() body: { to: string; message: string; type: NotificationType },
    ) {
        return this.service.sendNotification(body.to, body.message, body.type);
    }
}
