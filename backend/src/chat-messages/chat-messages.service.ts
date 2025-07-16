import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class ChatMessagesService {
    constructor(
        @InjectRepository(ChatMessage)
        private readonly repo: Repository<ChatMessage>,
    ) {}

    create(appointmentId: number, senderId: number, message: string) {
        const chat = this.repo.create({
            appointment: { id: appointmentId } as any,
            sender: { id: senderId } as any,
            message,
        });
        return this.repo.save(chat);
    }

    findForAppointment(appointmentId: number) {
        return this.repo.find({
            where: { appointment: { id: appointmentId } },
            order: { id: 'ASC' },
        });
    }
}
