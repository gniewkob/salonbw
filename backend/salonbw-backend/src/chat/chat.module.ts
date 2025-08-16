import { Module } from '@nestjs/common';
import { WebSocketModule } from '@nestjs/websockets';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';

@Module({
    imports: [
        WebSocketModule,
        AppointmentsModule,
        TypeOrmModule.forFeature([ChatMessage]),
    ],
    providers: [ChatGateway, ChatService, JwtService],
    exports: [ChatService],
})
export class ChatModule {}
