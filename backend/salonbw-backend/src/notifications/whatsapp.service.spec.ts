import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import nock from 'nock';
import { CommunicationEligibilityService } from '../communication-consents/communication-eligibility.service';
import {
    CommunicationChannel,
    CommunicationType,
} from '../communication-consents/communication-consent.types';
import { WhatsappService } from './whatsapp.service';

interface WhatsAppTemplateRequest {
    to: string;
    template: {
        name: string;
        language: { code: string };
        components: { parameters: { text: string }[] }[];
    };
}

describe('WhatsappService', () => {
    let service: WhatsappService;
    let eligibility: { canSend: jest.Mock };

    beforeEach(async () => {
        eligibility = {
            canSend: jest.fn().mockResolvedValue({
                allowed: true,
                reason: 'OPERATIONAL_ALLOWED',
            }),
        };
        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule.register({ proxy: false })],
            providers: [
                WhatsappService,
                {
                    provide: CommunicationEligibilityService,
                    useValue: eligibility,
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: (key: string) => {
                            if (key === 'WHATSAPP_TOKEN') return 'token';
                            if (key === 'WHATSAPP_PHONE_ID') return '123456';
                            throw new Error(`Missing env ${key}`);
                        },
                        get: (key: string, defaultValue?: string) =>
                            key === 'WHATSAPP_LANG' ? 'pl' : defaultValue,
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

    it('checks the authenticated customer, type and exact target before provider dispatch', async () => {
        const scope = nock('https://graph.facebook.com')
            .matchHeader('content-type', 'application/json')
            .post('/v17.0/123456/messages', (body: WhatsAppTemplateRequest) => {
                expect(body.to).toBe('987654321');
                expect(body.template.name).toBe('booking_confirmation');
                expect(body.template.language.code).toBe('pl');
                expect(
                    body.template.components[0].parameters.map((p) => p.text),
                ).toEqual(['one', 'two']);
                return true;
            })
            .reply(200, {});

        await expect(
            service.sendBookingConfirmation('987654321', 'one', 'two', 7),
        ).resolves.toBe(true);
        expect(eligibility.canSend).toHaveBeenCalledWith({
            customerId: 7,
            communicationType: CommunicationType.BookingConfirmation,
            channel: CommunicationChannel.WhatsApp,
            recipientPhone: '987654321',
        });
        expect(scope.isDone()).toBe(true);
    });

    it('fails closed without evidence, and never calls the provider', async () => {
        eligibility.canSend.mockResolvedValueOnce({
            allowed: false,
            reason: 'WHATSAPP_OPT_IN_MISSING',
        });
        const scope = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages')
            .reply(200, {});

        await expect(
            service.sendBookingConfirmation('987654321', 'one', 'two', 7),
        ).resolves.toBe(false);
        expect(scope.isDone()).toBe(false);
    });

    it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
        'fails closed for invalid customer identity %s',
        async (customerId) => {
            await expect(
                service.sendBookingConfirmation(
                    '987654321',
                    'one',
                    'two',
                    customerId,
                ),
            ).resolves.toBe(false);
            expect(eligibility.canSend).not.toHaveBeenCalled();
        },
    );

    it('does not dispatch a review without a review-specific authorization', async () => {
        eligibility.canSend.mockResolvedValueOnce({
            allowed: false,
            reason: 'MARKETING_CONSENT_MISSING',
        });
        await expect(
            service.sendFollowUp('987654321', 'one', 'two', 7),
        ).resolves.toBe(false);
        expect(eligibility.canSend).toHaveBeenCalledWith({
            customerId: 7,
            communicationType: CommunicationType.PostVisitReview,
            channel: CommunicationChannel.WhatsApp,
            recipientPhone: '987654321',
        });
    });

    it('returns false after provider 401 and retries', async () => {
        const scope = nock('https://graph.facebook.com')
            .matchHeader('content-type', 'application/json')
            .post('/v17.0/123456/messages')
            .times(3)
            .reply(401, {});

        await expect(
            service.sendBookingConfirmation('987654321', 'one', 'two', 7),
        ).resolves.toBe(false);
        expect(scope.isDone()).toBe(true);
    });

    it('retries twice and returns accepted on the third attempt', async () => {
        let attempts = 0;
        const scope = nock('https://graph.facebook.com')
            .matchHeader('content-type', 'application/json')
            .post('/v17.0/123456/messages')
            .times(3)
            .reply(() => {
                attempts++;
                return attempts < 3 ? [500, {}] : [200, {}];
            });

        await expect(
            service.sendBookingConfirmation('987654321', 'one', 'two', 7),
        ).resolves.toBe(true);
        expect(attempts).toBe(3);
        expect(scope.isDone()).toBe(true);
    });

    it('rechecks eligibility before a retry and stops after withdrawal', async () => {
        eligibility.canSend
            .mockResolvedValueOnce({
                allowed: true,
                reason: 'OPERATIONAL_ALLOWED',
            })
            .mockResolvedValueOnce({
                allowed: false,
                reason: 'WHATSAPP_OPT_IN_WITHDRAWN',
            });

        const firstAttempt = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages')
            .reply(503, {});
        const forbiddenRetry = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages')
            .reply(200, {});

        await expect(
            service.sendBookingConfirmation('987654321', 'one', 'two', 7),
        ).resolves.toBe(false);
        expect(firstAttempt.isDone()).toBe(true);
        expect(forbiddenRetry.isDone()).toBe(false);
        expect(eligibility.canSend).toHaveBeenCalledTimes(2);
    });

    it('keeps an independent employee notification pathway', async () => {
        const scope = nock('https://graph.facebook.com')
            .post('/v17.0/123456/messages')
            .reply(200, {});

        await expect(
            service.sendNewBookingToEmployee(
                '987654321',
                'Test customer',
                'Haircut',
                '2099-01-01',
                '10:00',
            ),
        ).resolves.toBe(true);
        expect(eligibility.canSend).not.toHaveBeenCalled();
        expect(scope.isDone()).toBe(true);
    });
});
