import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let appointments: { findOne: jest.Mock };
    let chatMessages: { create: jest.Mock };
    let server: any;
    let socket: any;

    beforeEach(() => {
        appointments = { findOne: jest.fn() };
        chatMessages = { create: jest.fn() };
        gateway = new ChatGateway(
            {} as any,
            {} as any,
            appointments as any,
            chatMessages as any,
        );
        server = { to: jest.fn(() => ({ emit: jest.fn() })) } as any;
        gateway.server = server;
        socket = {
            data: { userId: 1 },
            join: jest.fn(),
            emit: jest.fn(),
        } as any;
    });

    it('joins room for valid appointment participant', async () => {
        appointments.findOne.mockResolvedValue({
            client: { id: 1 },
            employee: { id: 2 },
        });
        await gateway.joinRoom(socket, { appointmentId: 5 });
        expect(socket.join).toHaveBeenCalledWith('chat-5');
    });

    it('rejects join when user not participant', async () => {
        appointments.findOne.mockResolvedValue({
            client: { id: 3 },
            employee: { id: 2 },
        });
        await gateway.joinRoom(socket, { appointmentId: 5 });
        expect(socket.join).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('error', 'unauthorized');
    });

    it('broadcasts message to room for valid user', async () => {
        const emitMock = jest.fn();
        server.to = jest.fn(() => ({ emit: emitMock }));
        chatMessages.create.mockResolvedValue({ id: 1, message: 'hi' });
        appointments.findOne.mockResolvedValue({
            client: { id: 1 },
            employee: { id: 2 },
        });
        await gateway.handleChatMessage(socket, {
            appointmentId: 5,
            content: 'hi',
        });
        expect(server.to).toHaveBeenCalledWith('chat-5');
        expect(chatMessages.create).toHaveBeenCalledWith(5, 1, 'hi');
        expect(emitMock).toHaveBeenCalledWith('message', {
            id: 1,
            message: 'hi',
        });
    });

    it('rejects message from non-member', async () => {
        appointments.findOne.mockResolvedValue({
            client: { id: 3 },
            employee: { id: 2 },
        });
        await gateway.handleChatMessage(socket, {
            appointmentId: 5,
            content: 'hi',
        });
        expect(chatMessages.create).not.toHaveBeenCalled();
        expect(socket.emit).toHaveBeenCalledWith('error', 'unauthorized');
    });
});
