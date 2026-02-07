import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { SmsService } from '../sms/sms.service';
import {
    TemplateType,
    MessageChannel,
} from '../sms/entities/message-template.entity';

interface ReminderResult {
    appointmentId: number;
    clientName: string;
    phone?: string;
    email?: string;
    smsSent: boolean;
    emailSent: boolean;
    error?: string;
}

@Injectable()
export class AutomaticReminderService {
    private readonly logger = new Logger(AutomaticReminderService.name);

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        private readonly smsService: SmsService,
        private readonly config: ConfigService,
    ) {}

    /**
     * Run every hour at minute 0
     * Sends reminders for appointments in ~24 hours
     */
    @Cron(CronExpression.EVERY_HOUR)
    async sendAppointmentReminders(): Promise<void> {
        const hoursBefore = Number(
            this.config.get<string>('REMINDER_HOURS_BEFORE', '24'),
        );
        const enabled = this.config.get<boolean>('REMINDER_ENABLED', true);

        if (!enabled) {
            this.logger.log('Automatic reminders are disabled');
            return;
        }

        const now = new Date();
        // Look for appointments exactly hoursBefore from now (with 1-hour window)
        const windowStart = new Date(
            now.getTime() + hoursBefore * 60 * 60 * 1000,
        );
        const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);

        this.logger.log(
            `Checking for appointments between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
        );

        const appointments = await this.appointmentsRepository.find({
            where: {
                startTime: Between(windowStart, windowEnd),
                status: AppointmentStatus.Scheduled,
                reminderSent: false, // Only send if not already sent
            },
            relations: ['client', 'service', 'employee'],
        });

        this.logger.log(
            `Found ${appointments.length} appointments needing reminders`,
        );

        const results: ReminderResult[] = [];

        for (const appointment of appointments) {
            const result = await this.processAppointmentReminder(appointment);
            results.push(result);
        }

        // Log summary
        const successful = results.filter(
            (r) => r.smsSent || r.emailSent,
        ).length;
        const failed = results.filter(
            (r) => !r.smsSent && !r.emailSent && !r.error,
        ).length;
        const errors = results.filter((r) => r.error).length;

        this.logger.log(
            `Reminder batch complete: ${successful} sent, ${failed} skipped, ${errors} errors`,
        );
    }

    /**
     * Process reminder for a single appointment
     */
    private async processAppointmentReminder(
        appointment: Appointment,
    ): Promise<ReminderResult> {
        const client = appointment.client;
        const result: ReminderResult = {
            appointmentId: appointment.id,
            clientName: client?.name || 'Unknown',
            phone: client?.phone || undefined,
            email: client?.email || undefined,
            smsSent: false,
            emailSent: false,
        };

        if (!client) {
            result.error = 'No client associated with appointment';
            this.logger.warn(`Appointment ${appointment.id} has no client`);
            return result;
        }

        // Check consent
        const smsConsent = client.smsConsent !== false; // Default to true if not set
        const emailConsent = client.emailConsent !== false;

        try {
            // Send SMS reminder
            if (result.phone && smsConsent) {
                const smsResult = await this.sendSmsReminder(appointment);
                if (smsResult) {
                    result.smsSent = true;
                }
            }

            // TODO: Send Email reminder (when email service is ready)
            // if (result.email && emailConsent) {
            //     result.emailSent = await this.sendEmailReminder(appointment);
            // }

            // Mark as sent if at least one channel succeeded
            if (result.smsSent || result.emailSent) {
                await this.markReminderSent(appointment);
            }
        } catch (error) {
            result.error =
                error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
                `Failed to send reminder for appointment ${appointment.id}:`,
                error,
            );
        }

        return result;
    }

    /**
     * Send SMS reminder using template system
     */
    private async sendSmsReminder(appointment: Appointment): Promise<boolean> {
        try {
            const log = await this.smsService.sendAppointmentReminder(
                appointment.id,
                null, // System user (no actor for automatic reminders)
            );
            return log !== null;
        } catch (error) {
            this.logger.error(
                `SMS reminder failed for appointment ${appointment.id}:`,
                error,
            );
            return false;
        }
    }

    /**
     * Mark appointment reminder as sent
     */
    private async markReminderSent(appointment: Appointment): Promise<void> {
        appointment.reminderSent = true;
        appointment.reminderSentAt = new Date();
        await this.appointmentsRepository.save(appointment);
        this.logger.log(
            `Marked reminder as sent for appointment ${appointment.id}`,
        );
    }

    /**
     * Manual trigger for testing - sends reminders for appointments in next N hours
     */
    async sendRemindersForNextHours(hours: number): Promise<ReminderResult[]> {
        const now = new Date();
        const windowStart = now;
        const windowEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);

        const appointments = await this.appointmentsRepository.find({
            where: {
                startTime: Between(windowStart, windowEnd),
                status: AppointmentStatus.Scheduled,
                reminderSent: false,
            },
            relations: ['client', 'service', 'employee'],
        });

        this.logger.log(
            `Manual trigger: Found ${appointments.length} appointments in next ${hours} hours`,
        );

        const results: ReminderResult[] = [];
        for (const appointment of appointments) {
            const result = await this.processAppointmentReminder(appointment);
            results.push(result);
        }

        return results;
    }

    /**
     * Get reminder statistics for dashboard
     */
    async getReminderStats(days: number = 7): Promise<{
        total: number;
        sent: number;
        failed: number;
        upcoming: number;
    }> {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [total, sent, upcoming] = await Promise.all([
            this.appointmentsRepository.count({
                where: {
                    startTime: LessThan(new Date()),
                    createdAt: { $gte: since } as any, // TypeORM workaround
                },
            }),
            this.appointmentsRepository.count({
                where: {
                    reminderSent: true,
                    reminderSentAt: { $gte: since } as any,
                },
            }),
            this.appointmentsRepository.count({
                where: {
                    startTime: Between(
                        new Date(),
                        new Date(Date.now() + 48 * 60 * 60 * 1000),
                    ),
                    status: AppointmentStatus.Scheduled,
                    reminderSent: false,
                },
            }),
        ]);

        return {
            total,
            sent,
            failed: total - sent,
            upcoming,
        };
    }
}
