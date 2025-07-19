import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsappService } from './whatsapp.service';
import { SmsService } from './sms.service';
import { Notification } from './notification.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    controllers: [NotificationsController],
    providers: [WhatsappService, SmsService, NotificationsService],
    exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
