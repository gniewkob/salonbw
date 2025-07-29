import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsappService } from './whatsapp.service';
import { SmsService } from './sms.service';
import { Notification } from './notification.entity';
import { Appointment } from '../appointments/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Notification, Appointment])],
    controllers: [NotificationsController],
    providers: [WhatsappService, SmsService, NotificationsService],
    exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
