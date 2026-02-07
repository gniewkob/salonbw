import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MessageTemplate } from './entities/message-template.entity';
import { SmsLog } from './entities/sms-log.entity';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { LogsModule } from '../logs/logs.module';
import { Appointment } from '../appointments/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MessageTemplate, SmsLog, Appointment]),
        ConfigModule,
        LogsModule,
        forwardRef(() => NotificationsModule),
    ],
    controllers: [SmsController],
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}
