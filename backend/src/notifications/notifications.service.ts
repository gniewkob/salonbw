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
import { NotificationChannel } from './notification-channel.enum';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    constructor(
        private readonly sms: SmsService,
        private readonly whatsapp: WhatsappService,
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,
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
                status: NotificationStatus.Sent,
                sentAt: new Date(),
            });
            return this.repo.save(fake);
        }
        const notif = this.repo.create({
            recipient: to,
            type,
            message,
            status: NotificationStatus.Pending,
        });
        await this.repo.save(notif);
        try {
            if (type === NotificationChannel.Sms) {
                await this.sms.sendSms(to, message);
            } else {
                await this.whatsapp.sendText(to, message);
            }
            notif.status = NotificationStatus.Sent;
        } catch (err) {
            notif.status = NotificationStatus.Failed;
            this.logger.error(`Notification send failed: ${err}`);
        }
        notif.sentAt = new Date();
        await this.repo.save(notif);
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

        for (const appt of appointments) {
            const phone = (appt.client as { phone?: string } | null)?.phone;
            if (phone) {

                await this.sendAppointmentReminder(phone, appt.startTime);
            }
        }
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

        for (const appt of appointments) {
            const phone = (appt.client as { phone?: string } | null)?.phone;
            if (phone) {

                await this.sendThankYou(phone);
            }
        }
    }

    findAll() {
        return this.repo.find();
    }
}
