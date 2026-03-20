import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { SettingsService } from './settings.service';
import {
    CreateCalendarViewDto,
    UpdateBranchSettingsDto,
    UpdateCalendarSettingsDto,
    UpdateCalendarViewDto,
    UpdateOnlineBookingSettingsDto,
    UpdateSmsSettingsDto,
    UpdateReminderSettingsDto,
    UpdatePaymentConfigurationDto,
    UpdateDataProtectionDto,
    UpdateDataProtectionEmployeeLimitDto,
} from './dto/settings.dto';

@Controller('settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    // Get all settings at once
    @Get()
    @Roles(Role.Admin)
    async getAllSettings() {
        return this.settingsService.getAllSettings();
    }

    // Branch Settings
    @Get('branch')
    @Roles(Role.Admin)
    async getBranchSettings() {
        return this.settingsService.getBranchSettings();
    }

    @Put('branch')
    @Roles(Role.Admin)
    async updateBranchSettings(
        @Body() dto: UpdateBranchSettingsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateBranchSettings(dto, req.user.id);
    }

    // Calendar Settings
    @Get('calendar')
    @Roles(Role.Admin)
    async getCalendarSettings() {
        return this.settingsService.getCalendarSettings();
    }

    @Put('calendar')
    @Roles(Role.Admin)
    async updateCalendarSettings(
        @Body() dto: UpdateCalendarSettingsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateCalendarSettings(dto, req.user.id);
    }

    @Get('calendar-views')
    @Roles(Role.Admin)
    async getCalendarViews() {
        return this.settingsService.getCalendarViews();
    }

    @Post('calendar-views')
    @Roles(Role.Admin)
    async createCalendarView(
        @Body() dto: CreateCalendarViewDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.createCalendarView(dto, req.user.id);
    }

    @Put('calendar-views/:id')
    @Roles(Role.Admin)
    async updateCalendarView(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCalendarViewDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateCalendarView(id, dto, req.user.id);
    }

    @Delete('calendar-views/:id')
    @Roles(Role.Admin)
    async deleteCalendarView(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.deleteCalendarView(id, req.user.id);
    }

    // Online Booking Settings
    @Get('online-booking')
    @Roles(Role.Admin)
    async getOnlineBookingSettings() {
        return this.settingsService.getOnlineBookingSettings();
    }

    @Put('online-booking')
    @Roles(Role.Admin)
    async updateOnlineBookingSettings(
        @Body() dto: UpdateOnlineBookingSettingsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateOnlineBookingSettings(
            dto,
            req.user.id,
        );
    }

    @Get('sms')
    @Roles(Role.Admin)
    async getSmsSettings() {
        return this.settingsService.getSmsSettings();
    }

    @Put('sms')
    @Roles(Role.Admin)
    async updateSmsSettings(
        @Body() dto: UpdateSmsSettingsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateSmsSettings(dto, req.user.id);
    }

    // Payment Configuration
    @Get('payment-configuration')
    @Roles(Role.Admin)
    async getPaymentConfiguration() {
        return this.settingsService.getPaymentConfiguration();
    }

    @Put('payment-configuration')
    @Roles(Role.Admin)
    async updatePaymentConfiguration(
        @Body() dto: UpdatePaymentConfigurationDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updatePaymentConfiguration(
            dto,
            req.user.id,
        );
    }

    // Data Protection
    @Get('data-protection')
    @Roles(Role.Admin)
    async getDataProtection() {
        return this.settingsService.getDataProtection();
    }

    @Put('data-protection')
    @Roles(Role.Admin)
    async updateDataProtection(
        @Body() dto: UpdateDataProtectionDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateDataProtection(dto, req.user.id);
    }

    @Get('data-protection/employee-limits')
    @Roles(Role.Admin)
    async getDataProtectionEmployeeLimits() {
        return this.settingsService.getDataProtectionEmployeeLimits();
    }

    @Put('data-protection/employee-limits/:id')
    @Roles(Role.Admin)
    async updateDataProtectionEmployeeLimit(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDataProtectionEmployeeLimitDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateDataProtectionEmployeeLimit(
            id,
            dto,
            req.user.id,
        );
    }

    // Reminder Settings
    @Get('reminders')
    @Roles(Role.Admin)
    async getReminderSettings() {
        return this.settingsService.getReminderSettings();
    }

    @Put('reminders')
    @Roles(Role.Admin)
    async updateReminderSettings(
        @Body() dto: UpdateReminderSettingsDto,
        @Request() req: { user: { id: number } },
    ) {
        return this.settingsService.updateReminderSettings(dto, req.user.id);
    }
}
