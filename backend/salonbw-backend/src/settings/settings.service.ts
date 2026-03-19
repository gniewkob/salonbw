import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchSettings } from './entities/branch-settings.entity';
import { CalendarSettings } from './entities/calendar-settings.entity';
import { OnlineBookingSettings } from './entities/online-booking-settings.entity';
import { SmsSettings } from './entities/sms-settings.entity';
import { ReminderSettings } from './entities/reminder-settings.entity';
import {
    UpdateBranchSettingsDto,
    UpdateCalendarSettingsDto,
    UpdateOnlineBookingSettingsDto,
    UpdateSmsSettingsDto,
    UpdateReminderSettingsDto,
    UpdatePaymentConfigurationDto,
    UpdateDataProtectionDto,
    UpdateDataProtectionEmployeeLimitDto,
} from './dto/settings.dto';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

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
        @InjectRepository(SmsSettings)
        private readonly smsSettingsRepo: Repository<SmsSettings>,
        @InjectRepository(ReminderSettings)
        private readonly reminderSettingsRepo: Repository<ReminderSettings>,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
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
            { id: actorId } as User,
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
            { id: actorId } as User,
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
            { id: actorId } as User,
            LogAction.SETTINGS_ONLINE_BOOKING_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        this.logger.log(`Online booking settings updated by user ${actorId}`);
        return updated;
    }

    async getSmsSettings(): Promise<SmsSettings> {
        let settings = await this.smsSettingsRepo.findOne({
            where: {},
            order: { id: 'ASC' },
        });

        if (!settings) {
            settings = this.smsSettingsRepo.create({});
            await this.smsSettingsRepo.save(settings);
            this.logger.log('Created default sms settings');
        }

        return settings;
    }

    async updateSmsSettings(
        dto: UpdateSmsSettingsDto,
        actorId: number,
    ): Promise<SmsSettings> {
        const settings = await this.getSmsSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.smsSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as User,
            LogAction.SETTINGS_SMS_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        this.logger.log(`Sms settings updated by user ${actorId}`);
        return updated;
    }

    // Payment Configuration (subset of OnlineBookingSettings)
    async getPaymentConfiguration() {
        const settings = await this.getOnlineBookingSettings();
        return {
            requirePrepayment: settings.requirePrepayment,
            prepaymentPercentage: settings.prepaymentPercentage,
            acceptOnlinePayments: settings.acceptOnlinePayments,
        };
    }

    async updatePaymentConfiguration(
        dto: UpdatePaymentConfigurationDto,
        actorId: number,
    ) {
        const settings = await this.getOnlineBookingSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.onlineBookingSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as User,
            LogAction.SETTINGS_ONLINE_BOOKING_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        return {
            requirePrepayment: updated.requirePrepayment,
            prepaymentPercentage: updated.prepaymentPercentage,
            acceptOnlinePayments: updated.acceptOnlinePayments,
        };
    }

    // Data Protection (paranoia mode — subset of BranchSettings)
    async getDataProtection() {
        const settings = await this.getBranchSettings();
        return {
            paranoiaMode: settings.paranoiaMode,
            paranoiaLimit: settings.paranoiaLimit,
            paranoiaEmail: settings.paranoiaEmail,
        };
    }

    async getDataProtectionEmployeeLimits() {
        const users = await this.usersRepo.find({
            where: [
                { role: Role.Admin },
                { role: Role.Employee },
                { role: Role.Receptionist },
            ],
            order: { name: 'ASC' },
        });

        return users.map((user) => ({
            id: user.id,
            name: user.name,
            role: user.role,
            paranoiaLimitOverride: user.paranoiaLimitOverride,
        }));
    }

    async updateDataProtection(dto: UpdateDataProtectionDto, actorId: number) {
        const settings = await this.getBranchSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.branchSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: actorId } as User,
            LogAction.SETTINGS_BRANCH_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        return {
            paranoiaMode: updated.paranoiaMode,
            paranoiaLimit: updated.paranoiaLimit,
            paranoiaEmail: updated.paranoiaEmail,
        };
    }

    async updateDataProtectionEmployeeLimit(
        userId: number,
        dto: UpdateDataProtectionEmployeeLimitDto,
        actorId: number,
    ) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (
            !user ||
            (user.role !== Role.Employee && user.role !== Role.Receptionist)
        ) {
            throw new NotFoundException(
                'Employee data protection limit target not found',
            );
        }

        user.paranoiaLimitOverride = dto.paranoiaLimit;
        const updated = await this.usersRepo.save(user);

        await this.logService.logAction(
            { id: actorId } as User,
            LogAction.EMPLOYEE_UPDATED,
            {
                employeeId: updated.id,
                employeeName: updated.name,
                paranoiaLimitOverride: updated.paranoiaLimitOverride,
            },
        );

        return {
            id: updated.id,
            name: updated.name,
            role: updated.role,
            paranoiaLimitOverride: updated.paranoiaLimitOverride,
        };
    }

    // Get all settings at once
    async getAllSettings() {
        const [branch, calendar, onlineBooking, sms] = await Promise.all([
            this.getBranchSettings(),
            this.getCalendarSettings(),
            this.getOnlineBookingSettings(),
            this.getSmsSettings(),
        ]);

        return { branch, calendar, onlineBooking, sms };
    }

    // Reminder Settings
    async getReminderSettings(): Promise<ReminderSettings> {
        let settings = await this.reminderSettingsRepo.findOne({
            order: { id: 'ASC' },
        });

        if (!settings) {
            settings = this.reminderSettingsRepo.create({});
            await this.reminderSettingsRepo.save(settings);
            this.logger.log('Created default reminder settings');
        }

        return settings;
    }

    async updateReminderSettings(
        dto: UpdateReminderSettingsDto,
        userId: number,
    ): Promise<ReminderSettings> {
        const settings = await this.getReminderSettings();
        const oldValues = this.toRecord(settings);

        Object.assign(settings, dto);
        const updated = await this.reminderSettingsRepo.save(settings);

        await this.logService.logAction(
            { id: userId } as User,
            LogAction.SETTINGS_REMINDERS_UPDATED,
            {
                settingsId: settings.id,
                changes: this.getChanges(oldValues, this.toRecord(updated)),
            },
        );

        return updated;
    }

    // Helper to convert entity to record
    private toRecord(entity: object): Record<string, unknown> {
        return JSON.parse(JSON.stringify(entity)) as Record<string, unknown>;
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
