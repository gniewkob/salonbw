import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(ChatMessage)
        private readonly chatMessageRepository: Repository<ChatMessage>,
    ) {}

    async saveMessage(
        userId: number,
        appointmentId: number,
        text: string,
    ): Promise<ChatMessage> {
        const message = this.chatMessageRepository.create({
            user: { id: userId } as User,
            appointment: { id: appointmentId } as Appointment,
            text,
        });
        const saved = await this.chatMessageRepository.save(message);
        return this.chatMessageRepository.findOneOrFail({
            where: { id: saved.id },
        });
    }

    async findMessages(appointmentId: number): Promise<ChatMessage[]> {
        return this.chatMessageRepository.find({
            where: { appointment: { id: appointmentId } },
            order: { timestamp: 'ASC' },
        });
    }
}
