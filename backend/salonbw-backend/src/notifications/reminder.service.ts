import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class ReminderService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        private readonly whatsapp: WhatsappService,
    ) {}

    @Cron('0 7 * * *')
    async handleCron() {
        const now = new Date();
        const nextDayStart = new Date(now);
        nextDayStart.setDate(now.getDate() + 1);
        nextDayStart.setHours(0, 0, 0, 0);
        const nextDayEnd = new Date(nextDayStart);
        nextDayEnd.setHours(23, 59, 59, 999);
        const appointments = await this.appointmentsRepository.find({
            where: {
                startTime: Between(nextDayStart, nextDayEnd),
                status: AppointmentStatus.Scheduled,
            },
        });
        for (const appointment of appointments) {
            const phone = appointment.client?.phone;
            if (!phone) {
                continue;
            }
            try {
                const date = appointment.startTime
                    .toISOString()
                    .split('T')[0];
                const time = appointment.startTime
                    .toISOString()
                    .split('T')[1]
                    .slice(0, 5);
                await this.whatsapp.sendReminder(phone, date, time);
            } catch (error) {
                console.error('Failed to send reminder', error);
            }
        }
    }
}
