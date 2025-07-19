import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { EmailsService, EmailPayload } from './emails.service';

@Controller('emails')
export class EmailsController {
    constructor(private readonly service: EmailsService) {}

    @Get()
    @Public()
    list() {
        return this.service.findAll();
    }

    @Post('send')
    @Public()
    send(@Body() body: EmailPayload) {
        return this.service.sendEmail(body);
    }

    @Post('send-bulk')
    @Public()
    sendBulk(@Body() body: { emails: EmailPayload[] }) {
        return this.service.sendBulk(body.emails);
    }

    @Post('opt-out')
    @Public()
    optOut(@Body() body: { token?: string; email?: string }) {
        return this.service.optOut(body.token || body.email);
    }

    @Get('unsubscribe/:token')
    @Public()
    unsubscribe(@Param('token') token: string) {
        return this.service.optOut(token);
    }
}
