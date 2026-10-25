import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { HttpService } from '@nestjs/axios';
import { EmailsService } from './emails/emails.service';
import { MetricsService } from './observability/metrics.service';
import { EmailLog } from './emails/email-log.entity';
import { User } from './users/user.entity';
import { PushService } from './notifications/push.service';
import { PushSubscription } from './notifications/push-subscription.entity';
import { WhatsappService } from './notifications/whatsapp.service';
import { SmsService } from './sms/sms.service';
import { SmsLog, SmsStatus } from './sms/entities/sms-log.entity';
import { MessageTemplate } from './sms/entities/message-template.entity';
import { Appointment } from './appointments/appointment.entity';
import { LogService } from './logs/log.service';
import * as nodemailer from 'nodemailer';
import * as webPush from 'web-push';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));
jest.mock('web-push', () => ({
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
}));
const values: Record<string, unknown> = {
    NODE_ENV: 'production',
    SMTP_HOST: 'fixture.invalid',
    SMTP_PORT: '465',
    SMTP_USER: 'fixture',
    SMTP_PASSWORD: 'fixture',
    VAPID_PUBLIC_KEY: 'fixture',
    VAPID_PRIVATE_KEY: 'fixture',
    WHATSAPP_TOKEN: 'fixture',
    WHATSAPP_PHONE_ID: 'fixture',
    SMSAPI_ENABLED: true,
    SMSAPI_TOKEN: 'fixture',
};
const config = (extra: Record<string, unknown> = {}) =>
    ({
        get: (key: string, fallback?: unknown) =>
            key in extra ? extra[key] : (values[key] ?? fallback),
        getOrThrow: (key: string) => values[key],
    }) as ConfigService;

describe('outbound development policy at provider boundaries', () => {
    const original = process.env.APP_ENV;
    beforeEach(() => {
        process.env.APP_ENV = 'development';
        jest.clearAllMocks();
        jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected provider call'));
    });
    afterEach(() => {
        jest.restoreAllMocks();
        if (original === undefined) delete process.env.APP_ENV;
        else process.env.APP_ENV = original;
    });
    it('suppresses email before configuring transport or recording a sent message', async () => {
        const logs = { save: jest.fn(), create: jest.fn() };
        const logger = {
            setContext: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const service = new EmailsService(
            config(),
            {} as MetricsService,
            logger as unknown as PinoLogger,
            logs as unknown as Repository<EmailLog>,
            {} as Repository<User>,
        );
        await service.send({
            to: 'fixture@example.test',
            subject: 'Fixture',
            template: 'Fixture',
        });
        expect(nodemailer.createTransport).not.toHaveBeenCalled();
        expect(logs.save).not.toHaveBeenCalled();
    });
    it('does not initialize push or send WhatsApp even if provider credentials exist', async () => {
        const subscriptions = { find: jest.fn() };
        const push = new PushService(
            subscriptions as unknown as Repository<PushSubscription>,
            config(),
        );
        await push.sendNotification(1, { title: 'Fixture', body: 'Fixture' });
        expect(push.isEnabled()).toBe(false);
        expect(webPush.setVapidDetails).not.toHaveBeenCalled();
        expect(subscriptions.find).not.toHaveBeenCalled();
        const http = { post: jest.fn() };
        await new WhatsappService(
            http as unknown as HttpService,
            config(),
        ).sendTemplate('000000000', 'fixture', []);
        expect(http.post).not.toHaveBeenCalled();
    });
    it.each(['development', 'production'])(
        'does not report disabled SMS as sent in %s',
        async (environment) => {
            process.env.APP_ENV = environment;
            const logs = {
                create: jest.fn((data: Partial<SmsLog>) => ({
                    id: 1,
                    ...data,
                })),
                save: jest.fn(async (data: SmsLog) => data),
            };
            const service = new SmsService(
                {} as Repository<MessageTemplate>,
                logs as unknown as Repository<SmsLog>,
                {} as Repository<Appointment>,
                config({ SMSAPI_ENABLED: environment === 'development' ? 'true' : 'false' }),
                {} as LogService,
            );
            const result = await service.sendSms({
                recipient: '000000000',
                content: 'Fixture',
            });
            expect(global.fetch).not.toHaveBeenCalled();
            expect(result.status).toBe(SmsStatus.Failed);
            expect(result.sentAt).toBeFalsy();
            expect(result.errorMessage).toMatch(/disabled|not configured/i);
        },
    );
});
