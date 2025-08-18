import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { WhatsappService } from './whatsapp.service';

@Injectable()
export class ReminderService {
    private readonly hoursBefore: number;

    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
        private readonly whatsapp: WhatsappService,
        private readonly config: ConfigService,
    ) {
        this.hoursBefore = this.config.get<number>('REMINDER_HOURS_BEFORE', 24);
    }

    @Cron('0 7 * * *')
    async handleCron() {
        const now = new Date();
        const upcoming = new Date(
            now.getTime() + this.hoursBefore * 60 * 60 * 1000,
        );
        const appointments = await this.appointmentsRepository.find({
            where: {
                startTime: Between(now, upcoming),
                status: AppointmentStatus.Scheduled,
            },
        });
        for (const appointment of appointments) {
            const phone = appointment.client?.phone;
            if (!phone) {
                continue;
            }
            try {
                await this.whatsapp.sendReminder(phone, [
                    appointment.id.toString(),
                ]);
            } catch (error) {
                console.error('Failed to send reminder', error);
            }
        }
    }
}
