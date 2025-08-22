import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
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
        private readonly config: ConfigService,
    ) {}

    @Cron('0 * * * *')
    async handleCron() {
        const hoursBefore = Number(
            this.config.get<string>('REMINDER_HOURS_BEFORE', '24'),
        );
        const now = new Date();
        const windowStart = new Date(
            now.getTime() + hoursBefore * 60 * 60 * 1000,
        );
        const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000 - 1);
        const appointments = await this.appointmentsRepository.find({
            where: {
                startTime: Between(windowStart, windowEnd),
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
