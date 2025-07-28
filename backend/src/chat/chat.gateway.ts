import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../messages/messages.service';
import { ChatMessagesService } from '../chat-messages/chat-messages.service';
import { AppointmentsService } from '../appointments/appointments.service';

interface SendMessageDto {
    recipientId: number;
    content: string;
}

interface AppointmentMessageDto {
    appointmentId: number;
    content: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly messages: MessagesService,
        private readonly appointments: AppointmentsService,
        private readonly chatMessages: ChatMessagesService,
    ) {}

    async handleConnection(client: Socket) {
        const token = this.extractToken(client);
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            const payload = this.jwtService.verify<{ sub: number }>(token, {
                secret: process.env.JWT_SECRET ?? 'secret',
            });
            client.data.userId = payload.sub;
            await client.join(
                this.roomForUser(client.data.userId as number),
            );
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        // nothing
    }

    @SubscribeMessage('joinRoom')
    async joinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { appointmentId: number },
    ) {
        const userId: number = client.data.userId;
        if (!userId) {
            return;
        }
        const appt = await this.appointments.findOne(data.appointmentId);
        if (
            !appt ||
            (appt.client.id !== userId && appt.employee.id !== userId)
        ) {
            client.emit('error', 'unauthorized');
            return;
        }
        await client.join(`chat-${data.appointmentId}`);
    }

    @SubscribeMessage('message')
    async handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: AppointmentMessageDto,
    ) {
        const userId: number = client.data.userId;
        if (!userId) {
            return;
        }
        const appt = await this.appointments.findOne(dto.appointmentId);
        if (
            !appt ||
            (appt.client.id !== userId && appt.employee.id !== userId)
        ) {
            client.emit('error', 'unauthorized');
            return;
        }
        const saved = await this.chatMessages.create(
            dto.appointmentId,
            userId,
            dto.content,
        );
        this.server.to(`chat-${dto.appointmentId}`).emit('message', saved);
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: SendMessageDto,
    ) {
        const senderId: number = client.data.userId;
        if (!senderId) {
            return;
        }
        const msg = await this.messages.create(
            senderId,
            dto.recipientId,
            dto.content,
        );
        this.server
            .to(this.roomForUser(dto.recipientId))
            .emit('newMessage', msg);
        this.server.to(this.roomForUser(senderId)).emit('newMessage', msg);
    }

    private roomForUser(id: number) {
        return `user-${id}`;
    }

    private extractToken(client: Socket): string | undefined {
        const auth = client.handshake.auth as any;
        if (auth && auth.token) {
            return auth.token as string;
        }
        const header = client.handshake.headers['authorization'];
        if (typeof header === 'string' && header.startsWith('Bearer ')) {
            return header.slice(7);
        }
        const query = client.handshake.query['token'];
        if (typeof query === 'string') {
            return query;
        }
        return undefined;
    }
}
