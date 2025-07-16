import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesModule } from '../messages/messages.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatMessagesModule } from '../chat-messages/chat-messages.module';
import { ChatGateway } from './chat.gateway';

@Module({
    imports: [
        MessagesModule,
        AppointmentsModule,
        ChatMessagesModule,
        JwtModule.register({ secret: process.env.JWT_SECRET ?? 'secret' }),
    ],
    providers: [ChatGateway],
})
export class ChatModule {}
