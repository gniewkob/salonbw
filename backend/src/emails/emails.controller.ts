import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { EmailsService, EmailPayload } from './emails.service';

@ApiTags('Emails')
@Controller('emails')
export class EmailsController {
    constructor(private readonly service: EmailsService) {}

    @Get()
    @Public()
    @ApiOperation({ summary: 'List emails' })
    @ApiResponse({ status: 200 })
    list() {
        return this.service.findAll();
    }

    @Post('send')
    @Public()
    @ApiOperation({ summary: 'Send email' })
    @ApiResponse({ status: 200 })
    send(@Body() body: EmailPayload) {
        return this.service.sendEmail(body);
    }

    @Post('send-bulk')
    @Public()
    @ApiOperation({ summary: 'Send bulk emails' })
    @ApiResponse({ status: 200 })
    sendBulk(@Body() body: { emails: EmailPayload[] }) {
        return this.service.sendBulk(body.emails);
    }

    @Post('opt-out')
    @Public()
    @ApiOperation({ summary: 'Opt out email' })
    @ApiResponse({ status: 200 })
    optOut(@Body() body: { token?: string; email?: string }) {
        const tokenOrEmail = body.token || body.email;
        if (!tokenOrEmail) {
            throw new BadRequestException('token or email is required');
        }
        return this.service.optOut(tokenOrEmail);
    }

    @Get('unsubscribe/:token')
    @Public()
    @ApiOperation({ summary: 'Unsubscribe email' })
    @ApiResponse({ status: 200 })
    unsubscribe(@Param('token') token: string) {
        return this.service.optOut(token);
    }
}
