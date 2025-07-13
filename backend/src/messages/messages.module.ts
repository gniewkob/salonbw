import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Message])],
    controllers: [MessagesController],
    providers: [MessagesService],
})
export class MessagesModule {}
