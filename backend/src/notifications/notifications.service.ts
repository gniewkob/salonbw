import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import { Notification, NotificationStatus } from './notification.entity';

export type NotificationType = 'sms' | 'whatsapp';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    constructor(
        private readonly sms: SmsService,
        private readonly whatsapp: WhatsappService,
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,
    ) {}

    async sendNotification(
        to: string,
        message: string,
        type: NotificationType,
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
            if (type === 'sms') {
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
        return this.sendNotification(to, text, 'whatsapp');
    }

    sendAppointmentReminder(to: string, when: Date) {
        const text = `Przypomnienie: wizyta ${when.toLocaleString()}`;
        return this.sendNotification(to, text, 'whatsapp');
    }

    sendThankYou(to: string) {
        const text = 'Dziękujemy za wizytę!';
        return this.sendNotification(to, text, 'whatsapp');
    }

    findAll() {
        return this.repo.find();
    }
}
