import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { SendEmailDto } from './dto/send-email.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailLog } from './email-log.entity';
import { EmailHistoryFilterDto } from './dto/email-history.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

@Controller('emails')
export class EmailsController {
    constructor(
        private readonly emailsService: EmailsService,
        @InjectRepository(EmailLog)
        private readonly emailLogs: Repository<EmailLog>,
    ) {}

    @Post('send')
    async send(@Body() dto: SendEmailDto): Promise<{ status: string }> {
        await this.emailsService.send(dto);
        return { status: 'ok' };
    }

    // Authenticated send endpoint for internal usage (panel/admin).
    // Public contact form must continue to use POST /emails/send.
    @Post('send-auth')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin, Role.Receptionist)
    async sendAuth(
        @Body() dto: SendEmailDto,
        @CurrentUser() user: User,
    ): Promise<{ status: string }> {
        await this.emailsService.sendAsUser(dto, user.id);
        return { status: 'ok' };
    }

    @Post('send-bulk')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    async sendBulk(
        @Body() dto: SendBulkEmailDto,
        @CurrentUser() user: User,
    ): Promise<{ status: string; total: number }> {
        for (const to of dto.recipients) {
            await this.emailsService.sendAsUser(
                {
                    to,
                    subject: dto.subject,
                    template: dto.template,
                    data: dto.data,
                },
                user.id,
            );
        }
        return { status: 'ok', total: dto.recipients.length };
    }

    @Get('history')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.Admin)
    async history(@Query() filter: EmailHistoryFilterDto) {
        const page = filter.page ?? 1;
        const limit = filter.limit ?? 20;
        const skip = (page - 1) * limit;

        const qb = this.emailLogs
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.recipientUser', 'recipientUser')
            .leftJoinAndSelect('log.sentBy', 'sentBy')
            .orderBy('log.createdAt', 'DESC');

        if (filter.recipientId) {
            qb.andWhere('log.recipientId = :recipientId', {
                recipientId: filter.recipientId,
            });
        }
        if (filter.status) {
            qb.andWhere('log.status = :status', { status: filter.status });
        }
        if (filter.from) {
            qb.andWhere('log.createdAt >= :from', {
                from: new Date(filter.from),
            });
        }
        if (filter.to) {
            qb.andWhere('log.createdAt <= :to', { to: new Date(filter.to) });
        }

        const [items, total] = await qb
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        return { items, total, page, limit };
    }
}
