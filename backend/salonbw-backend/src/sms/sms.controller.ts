import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';
import { SmsService } from './sms.service';
import { AutomaticReminderService } from '../notifications/automatic-reminder.service';
import {
    TemplateType,
    MessageChannel,
} from './entities/message-template.entity';
import { SmsStatus } from './entities/sms-log.entity';
import {
    CreateTemplateDto,
    UpdateTemplateDto,
    SendSmsDto,
    SendBulkSmsDto,
    SendFromTemplateDto,
    SmsHistoryFilterDto,
} from './dto/sms.dto';

@Controller('sms')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SmsController {
    constructor(
        private readonly smsService: SmsService,
        private readonly reminderService: AutomaticReminderService,
    ) {}

    // Template endpoints
    @Get('templates')
    @Roles(Role.Admin, Role.Receptionist)
    async getTemplates(
        @Query('type') type?: TemplateType,
        @Query('channel') channel?: MessageChannel,
        @Query('isActive') isActive?: string,
    ) {
        return this.smsService.findAllTemplates({
            type,
            channel,
            isActive: isActive === undefined ? undefined : isActive === 'true',
        });
    }

    @Get('templates/:id')
    @Roles(Role.Admin, Role.Receptionist)
    async getTemplate(@Param('id', ParseIntPipe) id: number) {
        return this.smsService.findTemplateById(id);
    }

    @Post('templates')
    @Roles(Role.Admin)
    async createTemplate(
        @Body() dto: CreateTemplateDto,
        @CurrentUser() user: User,
    ) {
        return this.smsService.createTemplate(dto, user);
    }

    @Put('templates/:id')
    @Roles(Role.Admin)
    async updateTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTemplateDto,
        @CurrentUser() user: User,
    ) {
        return this.smsService.updateTemplate(id, dto, user);
    }

    @Delete('templates/:id')
    @Roles(Role.Admin)
    async deleteTemplate(
        @Param('id', ParseIntPipe) id: number,
        @CurrentUser() user: User,
    ) {
        await this.smsService.deleteTemplate(id, user);
        return { success: true };
    }

    // Sending endpoints
    @Post('send')
    @Roles(Role.Admin, Role.Receptionist)
    async sendSms(@Body() dto: SendSmsDto, @CurrentUser() user: User) {
        return this.smsService.sendSms(dto, user);
    }

    @Post('send-bulk')
    @Roles(Role.Admin)
    async sendBulkSms(@Body() dto: SendBulkSmsDto, @CurrentUser() user: User) {
        const logs = await this.smsService.sendBulkSms(dto, user);
        const success = logs.filter(
            (l) =>
                l.status === SmsStatus.Sent || l.status === SmsStatus.Delivered,
        ).length;
        const failed = logs.filter((l) => l.status === SmsStatus.Failed).length;
        return { success, failed, total: logs.length };
    }

    @Post('send-from-template')
    @Roles(Role.Admin, Role.Receptionist)
    async sendFromTemplate(
        @Body() dto: SendFromTemplateDto,
        @CurrentUser() user: User,
    ) {
        return this.smsService.sendFromTemplate(dto, user);
    }

    @Post('appointments/:id/reminder')
    @Roles(Role.Admin, Role.Receptionist, Role.Employee)
    async sendAppointmentReminder(
        @Param('id', ParseIntPipe) appointmentId: number,
        @CurrentUser() user: User,
    ) {
        const result = await this.smsService.sendAppointmentReminder(
            appointmentId,
            user,
        );
        if (!result) {
            return {
                success: false,
                message: 'Nie można wysłać przypomnienia',
            };
        }
        return { success: true, log: result };
    }

    // History endpoints
    @Get('history')
    @Roles(Role.Admin)
    async getHistory(@Query() filter: SmsHistoryFilterDto) {
        return this.smsService.getHistory(filter);
    }

    @Get('stats')
    @Roles(Role.Admin)
    async getStats(@Query('from') from: string, @Query('to') to: string) {
        const fromDate = from
            ? new Date(from)
            : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const toDate = to ? new Date(to) : new Date();
        return this.smsService.getStats(fromDate, toDate);
    }

    // Automatic reminders endpoints
    @Get('reminders/stats')
    @Roles(Role.Admin)
    async getReminderStats(@Query('days') days?: string) {
        const daysNum = days ? parseInt(days, 10) : 7;
        return this.reminderService.getReminderStats(daysNum);
    }

    @Post('reminders/trigger')
    @Roles(Role.Admin)
    async triggerReminders(@Body('hours') hours?: number) {
        const hoursNum = hours || 24;
        const results =
            await this.reminderService.sendRemindersForNextHours(hoursNum);
        return {
            success: true,
            count: results.length,
            results: results.map((r) => ({
                appointmentId: r.appointmentId,
                clientName: r.clientName,
                smsSent: r.smsSent,
                emailSent: r.emailSent,
                error: r.error,
            })),
        };
    }
}
