import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReminderService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
        private readonly notifications: NotificationsService,
    ) {}

    @Cron('0 7 * * *')
    async handleCron() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const appointments = await this.repo.find({
            where: {
                startTime: Between(tomorrow, dayAfter),
                status: AppointmentStatus.Scheduled,
            },
        });

        for (const appt of appointments) {
            const phone = (appt.client as { phone?: string } | null)?.phone;
            if (phone) {
                await this.notifications.sendAppointmentReminder(
                    phone,
                    appt.startTime,
                );
            }
        }
    }
}
