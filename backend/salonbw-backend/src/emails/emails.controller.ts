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
