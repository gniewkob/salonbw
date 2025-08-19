import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import nock from 'nock';
import { WhatsappService } from './whatsapp.service';

interface WhatsAppTemplateRequest {
    to: string;
    template: {
        name: string;
        components: { parameters: { text: string }[] }[];
    };
}

describe('WhatsappService', () => {
    let service: WhatsappService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule.register({ proxy: false })],
            providers: [
                WhatsappService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: (key: string) => {
                            if (key === 'WHATSAPP_TOKEN') return 'token';
                            if (key === 'WHATSAPP_PHONE_ID') return '123456';
                            return null;
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<WhatsappService>(WhatsappService);
    });

    afterEach(() => {
        nock.cleanAll();
        jest.restoreAllMocks();
    });

    it('should post template with correct body', async () => {
        const scope = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages', (body: WhatsAppTemplateRequest) => {
                expect(body.to).toBe('987654321');
                expect(body.template.name).toBe('test_template');
                expect(
                    body.template.components[0].parameters.map((p) => p.text),
                ).toEqual(['one', 'two']);
                return true;
            })
            .reply(200, {});

        await service.sendTemplate('987654321', 'test_template', ['one', 'two']);
        expect(scope.isDone()).toBe(true);
    });

    it('should log error on 401 and not throw', async () => {
        const consoleSpy = jest
            .spyOn(console, 'error')
            .mockImplementation(() => {});
        const scope = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages')
            .reply(401, {});

        await expect(
            service.sendTemplate('987654321', 'test_template', ['x']),
        ).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalled();
        expect(scope.isDone()).toBe(true);
    });
});
