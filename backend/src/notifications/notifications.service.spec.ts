import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import axios from 'axios';

describe('NotificationsService', () => {
    let service: NotificationsService;

    beforeEach(async () => {
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsService],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('sendText posts to WhatsApp API', async () => {
        const postMock = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} } as any);
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';

        await service.sendText('48123456789', 'hello');

        expect(postMock).toHaveBeenCalledWith(
            'https://graph.facebook.com/v18.0/123/messages',
            {
                messaging_product: 'whatsapp',
                to: '48123456789',
                type: 'text',
                text: { body: 'hello' },
            },
            {
                headers: {
                    Authorization: 'Bearer t',
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('sendWhatsAppTemplate posts to WhatsApp API', async () => {
        const postMock = jest.spyOn(axios, 'post').mockResolvedValue({ data: {} } as any);
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';
        process.env.WHATSAPP_TEMPLATE_LANG = 'pl';

        await service.sendWhatsAppTemplate('48123456789', 'template', ['X', 'Y']);

        expect(postMock).toHaveBeenCalledWith(
            'https://graph.facebook.com/v18.0/123/messages',
            {
                messaging_product: 'whatsapp',
                to: '48123456789',
                type: 'template',
                template: {
                    name: 'template',
                    language: { code: 'pl' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: 'X' },
                                { type: 'text', text: 'Y' },
                            ],
                        },
                    ],
                },
            },
            {
                headers: {
                    Authorization: 'Bearer t',
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('does nothing when notifications are disabled', async () => {
        const postMock = jest.spyOn(axios, 'post');
        process.env.NOTIFICATIONS_ENABLED = 'false';
        await service.sendText('48123456789', 'hello');
        expect(postMock).not.toHaveBeenCalled();
        delete process.env.NOTIFICATIONS_ENABLED;
    });
});
