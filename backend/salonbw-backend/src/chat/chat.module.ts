import { Module } from '@nestjs/common';
import { WebSocketModule } from '@nestjs/websockets';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [WebSocketModule, AppointmentsModule],
    providers: [ChatGateway, ChatService, JwtService],
    exports: [ChatService],
})
export class ChatModule {}
