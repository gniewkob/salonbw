import { Body, Controller, Post } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller('emails')
export class EmailsController {
    constructor(private readonly emailsService: EmailsService) {}

    @Post('send')
    async send(@Body() dto: SendEmailDto): Promise<{ status: string }> {
        await this.emailsService.send(dto);
        return { status: 'ok' };
    }
}

