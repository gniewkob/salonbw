import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly repo: Repository<Message>,
    ) {}

    create(senderId: number, recipientId: number, content: string) {
        const msg = this.repo.create({
            sender: { id: senderId } as any,
            recipient: { id: recipientId } as any,
            content,
        });
        return this.repo.save(msg);
    }

    findForUser(userId: number) {
        return this.repo.find({
            where: [{ sender: { id: userId } }, { recipient: { id: userId } }],
            order: { id: 'ASC' },
        });
    }
}
