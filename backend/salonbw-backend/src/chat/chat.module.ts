import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [
        AppointmentsModule,
        TypeOrmModule.forFeature([ChatMessage, Appointment, User]),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    controllers: [ChatController],
    providers: [ChatGateway, ChatService],
    exports: [ChatService],
})
export class ChatModule {}
