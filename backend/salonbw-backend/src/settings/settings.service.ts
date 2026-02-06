import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchSettings } from './entities/branch-settings.entity';
import { CalendarSettings } from './entities/calendar-settings.entity';
import { OnlineBookingSettings } from './entities/online-booking-settings.entity';
import {
    UpdateBranchSettingsDto,
    UpdateCalendarSettingsDto,
    UpdateOnlineBookingSettingsDto,
} from './dto/settings.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class SettingsService {
    private readonly logger = new Logger(SettingsService.name);

    constructor(
        @InjectRepository(BranchSettings)
        private readonly branchSettingsRepo: Repository<BranchSettings>,
        @InjectRepository(CalendarSettings)
        private readonly calendarSettingsRepo: Repository<CalendarSettings>,
        @InjectRepository(OnlineBookingSettings)
        private readonly onlineBookingSettingsRepo: Repository<OnlineBookingSettings>,
        private readonly logService: LogService,
    ) {}

    // Branch Settings
    async getBranchSettings(): Promise<BranchSettings> {
        let settings = await this.branchSettingsRepo.findOne({
            where: { isActive: true },
        });

        if (!settings) {
            settings = this.branchSettingsRepo.create({
                companyName: 'Salon Beauty & Wellness',
                isActive: true,
            });
            await this.branchSettingsRepo.save(settings);
            this.logger.log('Created default branch settings');
        }

        return settings;
    }

    async updateBranchSettings(
        dto: UpdateBranchSettingsDto,
        actorId: number,
    ): Promise<BranchSettings> {
        const settings = await this.getBranchSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.branchSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.SETTINGS_BRANCH_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        this.logger.log(`Branch settings updated by user ${actorId}`);
        return updated;
    }

    // Calendar Settings
    async getCalendarSettings(): Promise<CalendarSettings> {
        let settings = await this.calendarSettingsRepo.findOne({
            where: {},
            order: { id: 'ASC' },
        });

        if (!settings) {
            settings = this.calendarSettingsRepo.create({});
            await this.calendarSettingsRepo.save(settings);
            this.logger.log('Created default calendar settings');
        }

        return settings;
    }

    async updateCalendarSettings(
        dto: UpdateCalendarSettingsDto,
        actorId: number,
    ): Promise<CalendarSettings> {
        const settings = await this.getCalendarSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.calendarSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.SETTINGS_CALENDAR_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        this.logger.log(`Calendar settings updated by user ${actorId}`);
        return updated;
    }

    // Online Booking Settings
    async getOnlineBookingSettings(): Promise<OnlineBookingSettings> {
        let settings = await this.onlineBookingSettingsRepo.findOne({
            where: {},
            order: { id: 'ASC' },
        });

        if (!settings) {
            settings = this.onlineBookingSettingsRepo.create({});
            await this.onlineBookingSettingsRepo.save(settings);
            this.logger.log('Created default online booking settings');
        }

        return settings;
    }

    async updateOnlineBookingSettings(
        dto: UpdateOnlineBookingSettingsDto,
        actorId: number,
    ): Promise<OnlineBookingSettings> {
        const settings = await this.getOnlineBookingSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.onlineBookingSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as any,
            LogAction.SETTINGS_ONLINE_BOOKING_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        this.logger.log(`Online booking settings updated by user ${actorId}`);
        return updated;
    }

    // Get all settings at once
    async getAllSettings() {
        const [branch, calendar, onlineBooking] = await Promise.all([
            this.getBranchSettings(),
            this.getCalendarSettings(),
            this.getOnlineBookingSettings(),
        ]);

        return { branch, calendar, onlineBooking };
    }

    // Helper to convert entity to record
    private toRecord(entity: object): Record<string, unknown> {
        return JSON.parse(JSON.stringify(entity));
    }

    // Helper to get changes for logging
    private getChanges(
        oldValues: Record<string, unknown>,
        newValues: Record<string, unknown>,
    ): Record<string, { from: unknown; to: unknown }> {
        const changes: Record<string, { from: unknown; to: unknown }> = {};

        for (const key of Object.keys(newValues)) {
            if (
                key !== 'updatedAt' &&
                key !== 'createdAt' &&
                JSON.stringify(oldValues[key]) !==
                    JSON.stringify(newValues[key])
            ) {
                changes[key] = {
                    from: oldValues[key],
                    to: newValues[key],
                };
            }
        }

        return changes;
    }
}
