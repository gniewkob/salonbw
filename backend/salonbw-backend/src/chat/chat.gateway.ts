import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppointmentsService } from '../appointments/appointments.service';
import { ChatService } from './chat.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { MessageDto } from './dto/message.dto';

interface TokenPayload {
    sub: number;
    role: string;
}

interface ChatSocket extends Socket {
    data: {
        userId: number;
        role: string;
    };
}

const FRONTEND_URL = process.env.FRONTEND_URL;

@WebSocketGateway({ cors: { origin: FRONTEND_URL } })
@UsePipes(new ValidationPipe())
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly appointmentsService: AppointmentsService,
        private readonly chatService: ChatService,
    ) {}

    async handleConnection(client: ChatSocket) {
        const authHeader = client.handshake.headers.authorization;
        let token: string | undefined;
        if (
            typeof authHeader === 'string' &&
            authHeader.startsWith('Bearer ')
        ) {
            token = authHeader.slice(7);
        } else if (typeof client.handshake.query.token === 'string') {
            token = client.handshake.query.token;
        }
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            const payload = await this.jwtService.verifyAsync<TokenPayload>(
                token,
                {
                    secret: process.env.JWT_SECRET,
                },
            );
            client.data.userId = payload.sub;
            client.data.role = payload.role;
        } catch {
            client.disconnect();
        }
    }

    @SubscribeMessage('joinRoom')
    async joinRoom(client: ChatSocket, payload: JoinRoomDto) {
        const appointment = await this.appointmentsService.findOne(
            Number(payload.appointmentId),
        );
        const userId = client.data.userId;
        if (
            !appointment ||
            (appointment.client.id !== userId &&
                appointment.employee.id !== userId)
        ) {
            return { status: 'error' };
        }
        const roomName = `room-${payload.appointmentId}`;
        await client.join(roomName);
        return { status: 'ok' };
    }

    @SubscribeMessage('message')
    async handleMessage(client: ChatSocket, payload: MessageDto) {
        const roomName = `room-${payload.appointmentId}`;
        if (!client.rooms.has(roomName)) {
            return { status: 'error' };
        }
        const saved = await this.chatService.createMessage(
            client.data.userId,
            payload.appointmentId,
            payload.message,
        );
        this.server.to(roomName).emit('message', {
            id: saved.id,
            userId: saved.user.id,
            appointmentId: saved.appointment.id,
            content: saved.content,
            timestamp: saved.timestamp,
        });
        return { status: 'ok' };
    }
}
