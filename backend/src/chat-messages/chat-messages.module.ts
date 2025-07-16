import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatMessagesService } from './chat-messages.service';
import { AppointmentChatController } from './appointment-chat.controller';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([ChatMessage]),
        forwardRef(() => AppointmentsModule),
    ],
    controllers: [AppointmentChatController],
    providers: [ChatMessagesService],
    exports: [ChatMessagesService, TypeOrmModule],
})
export class ChatMessagesModule {}
