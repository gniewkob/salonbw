import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { WhatsappService } from './whatsapp.service';
import { ReminderService } from './reminder.service';
import { AutomaticReminderService } from './automatic-reminder.service';
import { WhatsappServiceMock } from './whatsapp.mock';
import { SmsModule } from '../sms/sms.module';
import { MessageTemplate } from '../sms/entities/message-template.entity';
import { EmailsModule } from '../emails/emails.module';
import { PushSubscription } from './push-subscription.entity';
import { PushService } from './push.service';
import { PushController } from './push.controller';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Appointment, MessageTemplate, PushSubscription]),
        forwardRef(() => SmsModule),
        EmailsModule,
    ],
    providers: [
        process.env.NODE_ENV === 'test'
            ? { provide: WhatsappService, useClass: WhatsappServiceMock }
            : WhatsappService,
        ReminderService,
        AutomaticReminderService,
        PushService,
    ],
    controllers: [PushController],
    exports: [WhatsappService, AutomaticReminderService, PushService],
})
export class NotificationsModule {}
