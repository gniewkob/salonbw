import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../users/role.enum';
import { SettingsService } from './settings.service';
import {
    UpdateBranchSettingsDto,
    UpdateCalendarSettingsDto,
    UpdateOnlineBookingSettingsDto,
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
}
