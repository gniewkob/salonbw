import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import * as nock from 'nock';

describe('NotificationsService with nock', () => {
    let service: NotificationsService;
    const httpProxy = process.env.http_proxy;
    const httpsProxy = process.env.https_proxy;
    const HTTPProxy = process.env.HTTP_PROXY;
    const HTTPSProxy = process.env.HTTPS_PROXY;
    const npmHttpProxy = process.env.npm_config_http_proxy;
    const npmHttpsProxy = process.env.npm_config_https_proxy;
    const yarnHttpProxy = process.env.YARN_HTTP_PROXY;
    const yarnHttpsProxy = process.env.YARN_HTTPS_PROXY;
    const globalProxy = process.env.GLOBAL_AGENT_HTTP_PROXY;

    beforeEach(async () => {
        process.env.WHATSAPP_TOKEN = 't';
        process.env.WHATSAPP_PHONE_ID = '123';
        process.env.WHATSAPP_TEMPLATE_LANG = 'pl';
        delete process.env.http_proxy;
        delete process.env.https_proxy;
        delete process.env.HTTP_PROXY;
        delete process.env.HTTPS_PROXY;
        delete process.env.npm_config_http_proxy;
        delete process.env.npm_config_https_proxy;
        delete process.env.YARN_HTTP_PROXY;
        delete process.env.YARN_HTTPS_PROXY;
        delete process.env.GLOBAL_AGENT_HTTP_PROXY;
        const module: TestingModule = await Test.createTestingModule({
            providers: [NotificationsService],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    afterEach(() => {
        delete process.env.WHATSAPP_TOKEN;
        delete process.env.WHATSAPP_PHONE_ID;
        delete process.env.WHATSAPP_TEMPLATE_LANG;
        if (httpProxy) process.env.http_proxy = httpProxy; else delete process.env.http_proxy;
        if (httpsProxy) process.env.https_proxy = httpsProxy; else delete process.env.https_proxy;
        if (HTTPProxy) process.env.HTTP_PROXY = HTTPProxy; else delete process.env.HTTP_PROXY;
        if (HTTPSProxy) process.env.HTTPS_PROXY = HTTPSProxy; else delete process.env.HTTPS_PROXY;
        if (npmHttpProxy) process.env.npm_config_http_proxy = npmHttpProxy; else delete process.env.npm_config_http_proxy;
        if (npmHttpsProxy) process.env.npm_config_https_proxy = npmHttpsProxy; else delete process.env.npm_config_https_proxy;
        if (yarnHttpProxy) process.env.YARN_HTTP_PROXY = yarnHttpProxy; else delete process.env.YARN_HTTP_PROXY;
        if (yarnHttpsProxy) process.env.YARN_HTTPS_PROXY = yarnHttpsProxy; else delete process.env.YARN_HTTPS_PROXY;
        if (globalProxy) process.env.GLOBAL_AGENT_HTTP_PROXY = globalProxy; else delete process.env.GLOBAL_AGENT_HTTP_PROXY;
        nock.cleanAll();
    });

    it('sendWhatsAppTemplate posts to WhatsApp API', async () => {
        const expectedBody = {
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
        };

        let received: any = null;
        nock('https://graph.facebook.com')
            .post(`/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`, (body) => {
                received = body;
                return true;
            })
            .reply(200, {});

        await service.sendWhatsAppTemplate('48123456789', 'template', ['X', 'Y']);

        expect(received).toEqual(expectedBody);
        expect(nock.isDone()).toBe(true);
    });
});
