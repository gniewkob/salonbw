import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';

@Module({
    imports: [
        MessagesModule,
        JwtModule.register({ secret: process.env.JWT_SECRET ?? 'secret' }),
    ],
    providers: [ChatGateway],
})
export class ChatModule {}
