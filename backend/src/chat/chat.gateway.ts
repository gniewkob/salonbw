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

interface SendMessageDto {
    recipientId: number;
    content: string;
}

@WebSocketGateway({ cors: true })
export class ChatGateway
    implements OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly messages: MessagesService,
    ) {}

    handleConnection(client: Socket) {
        const token = this.extractToken(client);
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            const payload: any = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET ?? 'secret',
            });
            client.data.userId = payload.sub;
            client.join(this.roomForUser(payload.sub));
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        // nothing
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
