import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { SmsService } from '../sms/sms.service';
import {
    TemplateType,
    MessageChannel,
    MessageTemplate,
} from '../sms/entities/message-template.entity';
import { EmailsService } from '../emails/emails.service';
import {
    ReminderChannel,
    ReminderSettings,
} from '../settings/entities/reminder-settings.entity';

/**
 * Effective reminder configuration. The `reminder_settings` row is the
 * source of truth (that is what the owner edits in the panel); env vars
 * are only a fallback for a fresh database with no row yet.
 */
export interface EffectiveReminderConfig {
    enabled: boolean;
    hoursBefore: number;
    channel: ReminderChannel;
}

/**
 * Pure so it is directly unit-testable.
 *
 * Until now the sender read REMINDER_ENABLED/REMINDER_HOURS_BEFORE from the
 * environment and ignored `reminder_settings` entirely — the whole reminder
 * settings page in the panel was decorative, and `preferred_channel` was
 * stored but never read by anything.
 */
export function resolveReminderConfig(
    settings: ReminderSettings | null,
    envEnabled: boolean,
    envHoursBefore: number,
): EffectiveReminderConfig {
    if (!settings) {
        return {
            enabled: envEnabled,
            hoursBefore: envHoursBefore,
            channel: ReminderChannel.Both,
        };
    }
    const hours = Number(settings.timingHours);
    return {
        enabled: settings.active,
        hoursBefore:
            Number.isFinite(hours) && hours > 0 ? hours : envHoursBefore,
        channel: settings.preferredChannel ?? ReminderChannel.Both,
    };
}

export interface ReminderChannelPlan {
    /** Channels to attempt, preferred first. */
    order: Array<'sms' | 'email'>;
    /** `both` sends on every channel; a specific choice stops at first success. */
    sendAll: boolean;
}

/**
 * Which channels to attempt, in what order.
 *
 * A specific preference sends on that channel and keeps the other one as a
 * FALLBACK rather than dropping it — otherwise reach would silently shrink
 * whenever the preferred channel is unconfigured, which is exactly today's
 * situation (preferred = SMS, but SMSAPI has no token).
 */
export function reminderChannelPlan(
    channel: ReminderChannel,
): ReminderChannelPlan {
    switch (channel) {
        case ReminderChannel.Sms:
            return { order: ['sms', 'email'], sendAll: false };
        case ReminderChannel.Email:
            return { order: ['email', 'sms'], sendAll: false };
        default:
            return { order: ['sms', 'email'], sendAll: true };
    }
}

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
    private readonly reminderConcurrency: number;
    /** Channel resolved for the current run; set before appointments are processed. */
    private activeChannel: ReminderChannel = ReminderChannel.Both;

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        @InjectRepository(MessageTemplate)
        private readonly templatesRepository: Repository<MessageTemplate>,
        @InjectRepository(ReminderSettings)
        private readonly reminderSettingsRepository: Repository<ReminderSettings>,
        private readonly smsService: SmsService,
        private readonly emailsService: EmailsService,
        private readonly config: ConfigService,
    ) {
        const configured = Number(
            this.config.get<string>('REMINDER_CONCURRENCY', '5'),
        );
        this.reminderConcurrency =
            Number.isFinite(configured) && configured > 0
                ? Math.floor(configured)
                : 5;
    }

    /**
     * Run every hour at minute 0
     * Sends reminders for appointments in ~24 hours
     */
    @Cron(CronExpression.EVERY_HOUR)
    async sendAppointmentReminders(): Promise<void> {
        // The panel's reminder settings row wins over env; env is only the
        // fallback for a database that has no row yet.
        // Jawne sortowanie: bez niego `take: 1` zwraca dowolny wiersz, gdyby
        // tabela kiedykolwiek miała więcej niż jeden — przypomnienia
        // chodziłyby wtedy raz wg jednych, raz wg drugich ustawień.
        const settingsRow = await this.reminderSettingsRepository
            .find({ order: { id: 'ASC' }, take: 1 })
            .then((rows) => rows[0] ?? null)
            .catch(() => null);

        const { enabled, hoursBefore, channel } = resolveReminderConfig(
            settingsRow,
            this.config.get<boolean>('REMINDER_ENABLED', true),
            Number(this.config.get<string>('REMINDER_HOURS_BEFORE', '24')),
        );
        this.activeChannel = channel;

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

        const results = await this.mapWithConcurrency(
            appointments,
            this.reminderConcurrency,
            (appointment) => this.processAppointmentReminder(appointment),
        );

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
            const { order, sendAll } = reminderChannelPlan(this.activeChannel);

            for (const channel of order) {
                if (channel === 'sms') {
                    if (!result.phone || !smsConsent) continue;
                    result.smsSent = await this.sendSmsReminder(appointment);
                } else {
                    if (!result.email || !emailConsent) continue;
                    result.emailSent = await this.sendEmailReminder(appointment);
                }

                // With an explicit preference the second channel is only a
                // fallback, so stop as soon as one actually got through.
                if (!sendAll && (result.smsSent || result.emailSent)) break;
            }

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

    private getAppointmentVariables(
        appointment: Appointment,
    ): Record<string, string> {
        const startTime = new Date(appointment.startTime);
        return {
            client_name: appointment.client?.name ?? '',
            service_name: appointment.service?.name ?? '',
            employee_name: appointment.employee?.name ?? '',
            date: startTime.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
            time: startTime.toLocaleTimeString('pl-PL', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            salon_name: this.config.get<string>('SALON_NAME', 'SalonBW'),
            salon_phone: this.config.get<string>('SALON_PHONE', ''),
        };
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

    private async sendEmailReminder(
        appointment: Appointment,
    ): Promise<boolean> {
        try {
            const client = appointment.client;
            if (!client?.email) return false;

            const template = await this.templatesRepository.findOne({
                where: {
                    type: TemplateType.AppointmentReminder,
                    channel: MessageChannel.Email,
                    isDefault: true,
                    isActive: true,
                },
            });

            if (!template) {
                this.logger.warn('No default email reminder template found');
                return false;
            }

            const vars = this.getAppointmentVariables(appointment);
            const subject =
                template.subject?.trim() ||
                `Przypomnienie o wizycie: ${vars.date}, ${vars.time}`;

            await this.emailsService.send({
                to: client.email,
                subject,
                template: template.content,
                data: vars,
                recipientId: client.id,
            });

            return true;
        } catch (error) {
            this.logger.error(
                `Email reminder failed for appointment ${appointment.id}:`,
                error,
            );
            return false;
        }
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

        return this.mapWithConcurrency(
            appointments,
            this.reminderConcurrency,
            (appointment) => this.processAppointmentReminder(appointment),
        );
    }

    private async mapWithConcurrency<TInput, TResult>(
        items: TInput[],
        concurrency: number,
        mapper: (item: TInput) => Promise<TResult>,
    ): Promise<TResult[]> {
        if (items.length === 0) {
            return [];
        }

        const safeConcurrency = Math.max(
            1,
            Math.min(concurrency, items.length),
        );
        const results = new Array<TResult>(items.length);
        let cursor = 0;

        const worker = async (): Promise<void> => {
            while (cursor < items.length) {
                const index = cursor++;
                results[index] = await mapper(items[index]);
            }
        };

        await Promise.all(
            Array.from({ length: safeConcurrency }, () => worker()),
        );
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
                    createdAt: MoreThanOrEqual(since),
                },
            }),
            this.appointmentsRepository.count({
                where: {
                    reminderSent: true,
                    reminderSentAt: MoreThanOrEqual(since),
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
