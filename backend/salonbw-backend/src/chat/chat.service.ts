import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {
    async createMessage(userId: number, appointmentId: number, content: string) {
        // Persist message in storage or database
        return { userId, appointmentId, content };
    }
}
