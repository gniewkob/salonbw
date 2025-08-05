import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import {
    Notification,
    NotificationStatus,
} from './notification.entity';
import { NotificationLog } from './notification-log.entity';
import { NotificationChannel } from './notification-channel.enum';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    constructor(
        private readonly sms: SmsService,
        private readonly whatsapp: WhatsappService,
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,
        @InjectRepository(NotificationLog)
        private readonly logs: Repository<NotificationLog>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
    ) {}

    async sendNotification(
        to: string,
        message: string,
        type: NotificationChannel,
    ) {
        if (process.env.NOTIFICATIONS_ENABLED === 'false') {
            const fake = this.repo.create({
                recipient: to,
                type,
                message,
                status: NotificationStatus.Skipped,
                sentAt: new Date(),
            });
            await this.repo.save(fake);
            await this.logs.save(
                this.logs.create({
                    recipient: to,
                    type,
                    status: NotificationStatus.Skipped,
                    notification: fake,
                }),
            );
            return fake;
        }
        const notif = this.repo.create({
            recipient: to,
            type,
            message,
            status: NotificationStatus.Pending,
        });
        await this.repo.save(notif);
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (type === NotificationChannel.Sms) {
                    await this.sms.sendSms(to, message);
                } else {
                    await this.whatsapp.sendText(to, message);
                }
                notif.status = NotificationStatus.Sent;
                notif.sentAt = new Date();
                await this.repo.save(notif);
                await this.logs.save(
                    this.logs.create({
                        recipient: to,
                        type,
                        status: NotificationStatus.Sent,
                        notification: notif,
                    }),
                );
                return notif;
            } catch (err) {
                await this.logs.save(
                    this.logs.create({
                        recipient: to,
                        type,
                        status: NotificationStatus.Failed,
                        error: err instanceof Error ? err.message : String(err),
                        notification: notif,
                    }),
                );
                this.logger.error(`Notification send failed: ${err}`);
                if (attempt === maxAttempts) {
                    notif.status = NotificationStatus.Failed;
                    notif.sentAt = new Date();
                    await this.repo.save(notif);
                    return notif;
                }
            }
        }
        return notif;
    }

    sendAppointmentConfirmation(to: string, when: Date) {
        const text = `Twoja wizyta została umówiona na ${when.toLocaleString()}`;
        return this.sendNotification(
            to,
            text,
            NotificationChannel.Whatsapp,
        );
    }

    sendAppointmentReminder(to: string, when: Date) {
        const text = `Przypomnienie: wizyta ${when.toLocaleString()}`;
        return this.sendNotification(
            to,
            text,
            NotificationChannel.Whatsapp,
        );
    }

    sendThankYou(to: string) {
        const text = 'Dziękujemy za wizytę!';
        return this.sendNotification(
            to,
            text,
            NotificationChannel.Whatsapp,
        );
    }

    @Cron('0 7 * * *')
    async reminderCron() {
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const appointments = await this.appointments.find({
            where: {
                startTime: Between(start, end),
                status: AppointmentStatus.Scheduled,
            },
        });

        const tasks = appointments.flatMap((appt) => {
            const phone = (appt.client as { phone?: string } | null)?.phone;
            if (!phone) {
                return [] as Promise<void>[];
            }
            return [
                this.sendAppointmentReminder(phone, appt.startTime).catch(
                    (err) => {
                        this.logger.error(
                            `Failed to send reminder to ${phone}: ${err}`,
                        );
                    },
                ),
            ];
        });

        await Promise.all(tasks);
    }

    @Cron('0 19 * * *')
    async followUpCron() {
        const start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);

        const appointments = await this.appointments.find({
            where: {
                startTime: Between(start, end),
                status: AppointmentStatus.Completed,
            },
        });

        const tasks = appointments.flatMap((appt) => {
            const phone = (appt.client as { phone?: string } | null)?.phone;
            if (!phone) {
                return [] as Promise<void>[];
            }
            return [
                this.sendThankYou(phone).catch((err) => {
                    this.logger.error(
                        `Failed to send follow-up to ${phone}: ${err}`,
                    );
                }),
            ];
        });

        await Promise.all(tasks);
    }

    findAll() {
        return this.repo.find();
    }
}
