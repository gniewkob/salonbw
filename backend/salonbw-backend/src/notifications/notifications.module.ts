import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { WhatsappService } from './whatsapp.service';
import { ReminderService } from './reminder.service';
import { WhatsappServiceMock } from './whatsapp.mock';

@Module({
    imports: [HttpModule, TypeOrmModule.forFeature([Appointment])],
    providers: [
        process.env.NODE_ENV === 'test'
            ? { provide: WhatsappService, useClass: WhatsappServiceMock }
            : WhatsappService,
        ReminderService,
    ],
    exports: [WhatsappService],
})
export class NotificationsModule {}
