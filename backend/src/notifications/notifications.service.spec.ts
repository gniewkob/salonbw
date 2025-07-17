import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

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
        // @ts-ignore
        delete global.fetch;
    });

    it('sendText posts to WhatsApp API', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: jest.fn() });
        // @ts-ignore
        global.fetch = fetchMock;
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';

        await service.sendText('48123456789', 'hello');

        expect(fetchMock).toHaveBeenCalledWith(
            'https://graph.facebook.com/v18.0/123/messages',
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer t',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: '48123456789',
                    type: 'text',
                    text: { body: 'hello' },
                }),
            },
        );
    });

    it('sendWhatsAppTemplate posts to WhatsApp API', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: jest.fn() });
        // @ts-ignore
        global.fetch = fetchMock;
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';
        process.env.WHATSAPP_TEMPLATE_LANG = 'pl';

        await service.sendWhatsAppTemplate('48123456789', 'template', ['X', 'Y']);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://graph.facebook.com/v18.0/123/messages',
            {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer t',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
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
                }),
            },
        );
    });
});
