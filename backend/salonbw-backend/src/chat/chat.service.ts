import { Injectable } from '@nestjs/common';

export interface ChatMessage {
    userId: number;
    appointmentId: number;
    content: string;
}

@Injectable()
export class ChatService {
    async createMessage(
        userId: number,
        appointmentId: number,
        content: string,
    ): Promise<ChatMessage> {
        // Persist message in storage or database
        const message = { userId, appointmentId, content };
        await Promise.resolve();
        return message;
    }
}
