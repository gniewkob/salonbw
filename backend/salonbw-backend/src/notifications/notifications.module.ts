import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { WhatsappService } from './whatsapp.service';
import { ReminderService } from './reminder.service';
import { AutomaticReminderService } from './automatic-reminder.service';
import { WhatsappServiceMock } from './whatsapp.mock';
import { SmsModule } from '../sms/sms.module';

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([Appointment]),
        forwardRef(() => SmsModule),
    ],
    providers: [
        process.env.NODE_ENV === 'test'
            ? { provide: WhatsappService, useClass: WhatsappServiceMock }
            : WhatsappService,
        ReminderService,
        AutomaticReminderService,
    ],
    exports: [WhatsappService, AutomaticReminderService],
})
export class NotificationsModule {}
