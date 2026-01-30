import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomaticMessageRule } from './entities/automatic-message-rule.entity';
import { AutomaticMessagesService } from './automatic-messages.service';
import { AutomaticMessagesController } from './automatic-messages.controller';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { SmsModule } from '../sms/sms.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([AutomaticMessageRule, Appointment, User]),
        SmsModule,
    ],
    controllers: [AutomaticMessagesController],
    providers: [AutomaticMessagesService],
    exports: [AutomaticMessagesService],
})
export class AutomaticMessagesModule {}
