import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SmsService } from '../sms/sms.service';
import {
    MessageTemplate,
    TemplateType,
} from '../sms/entities/message-template.entity';
import { SmsLog, SmsStatus } from '../sms/entities/sms-log.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { EmailsService } from '../emails/emails.service';
import { CommunicationEligibilityService } from './communication-eligibility.service';
import {
    CommunicationChannel,
    CommunicationType,
    EligibilityReason,
} from './communication-consent.types';

const deny = (reason = EligibilityReason.MarketingConsentMissing) => ({
    allowed: false,
    reason,
});

function smsService(
    eligibility: Partial<CommunicationEligibilityService>,
    template?: Partial<MessageTemplate>,
    customerPhone = '+48 600 100 200',
) {
    const logs = {
        create: jest.fn((v: Partial<SmsLog>) => ({ ...v })),
        save: jest.fn(async (v: Partial<SmsLog>) => v),
    };
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as never;
    const service = new SmsService(
        {
            findOne: jest.fn().mockResolvedValue(template ?? null),
        } as unknown as Repository<MessageTemplate>,
        logs as unknown as Repository<SmsLog>,
        {
            findOne: jest.fn().mockResolvedValue(null),
            manager: {
                getRepository: () => ({
                    findOne: jest
                        .fn()
                        .mockResolvedValue({ id: 5, phone: customerPhone }),
                }),
            },
        } as unknown as Repository<Appointment>,
        new ConfigService({ SMSAPI_ENABLED: 'false' }),
        {} as LogService,
        eligibility as CommunicationEligibilityService,
    );
    return { service, fetchSpy };
}

describe('SMS delivery enforcement', () => {
    it('blocks a free-text staff SMS as marketing without consent', async () => {
        const canSend = jest.fn().mockResolvedValue(deny());
        const { service, fetchSpy } = smsService({
            canSend,
            resolveCustomerByPhone: jest.fn().mockResolvedValue(5),
        });
        const log = await service.sendSms({
            recipient: '600100200',
            content: 'Promocja -20%',
        });
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: 5,
                communicationType: CommunicationType.MassMarketing,
                channel: CommunicationChannel.Sms,
            }),
        );
        expect(log.status).toBe(SmsStatus.Failed);
        expect(log.errorMessage).toContain('MARKETING_CONSENT_MISSING');
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('classifies by template type on the server, not by the caller', async () => {
        const canSend = jest.fn().mockResolvedValue(deny());
        const { service } = smsService(
            {
                canSend,
                resolveCustomerByPhone: jest.fn().mockResolvedValue(5),
            },
            { id: 3, type: TemplateType.BirthdayWish },
        );
        await service.sendSms({
            recipient: '600100200',
            content: 'Wszystkiego najlepszego',
            templateId: 3,
        });
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                communicationType: CommunicationType.BirthdayWishes,
            }),
        );
    });

    it('denies a bulk/manual number that does not resolve to one customer', async () => {
        const canSend = jest.fn();
        const { service } = smsService({
            canSend,
            resolveCustomerByPhone: jest.fn().mockResolvedValue(null),
        });
        canSend.mockResolvedValue(deny(EligibilityReason.RecipientUnknown));
        const [log] = await service.sendBulkSms({
            recipients: ['700700700'],
            content: 'Oferta',
        });
        expect(log.status).toBe(SmsStatus.Failed);
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({ customerId: null }),
        );
    });

    it('rejects a recipientId whose phone differs from the target number', async () => {
        const canSend = jest.fn();
        const { service } = smsService(
            { canSend, resolveCustomerByPhone: jest.fn() },
            undefined,
            '+48 511 000 000',
        );
        const log = await service.sendSms({
            recipient: '600100200',
            content: 'x',
            recipientId: 5,
        });
        expect(canSend).not.toHaveBeenCalled();
        expect(log.errorMessage).toContain('RECIPIENT_UNKNOWN');
    });

    it('lets operational reminders through when eligibility allows', async () => {
        const canSend = jest.fn().mockResolvedValue({
            allowed: true,
            reason: EligibilityReason.OperationalAllowed,
        });
        const { service } = smsService({ canSend });
        const log = await service.sendSms(
            { recipient: '600100200', content: 'Jutro 10:00', recipientId: 5 },
            null,
            { communicationType: CommunicationType.AppointmentReminder },
        );
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                communicationType: CommunicationType.AppointmentReminder,
            }),
        );
        // Provider disabled in tests → Failed, but not blocked by consent.
        expect(log.errorMessage).not.toContain('Zablokowano');
    });
});

describe('Email delivery enforcement', () => {
    function emails(eligibility: Partial<CommunicationEligibilityService>) {
        const service = Object.create(EmailsService.prototype) as EmailsService;
        const internal = jest.fn().mockResolvedValue(undefined);
        Object.assign(service, {
            eligibility,
            logger: { info: jest.fn() },
            sendInternal: internal,
        });
        return { service, internal };
    }

    it('refuses staff e-mail to a customer without e-mail marketing consent', async () => {
        const { service, internal } = emails({
            resolveCustomerByEmail: jest.fn().mockResolvedValue(9),
            canSend: jest.fn().mockResolvedValue(deny()),
        });
        await expect(
            service.sendAsUser(
                { to: 'a@b.pl', subject: 's', template: 't' },
                1,
            ),
        ).rejects.toThrow('zgody');
        expect(internal).not.toHaveBeenCalled();
    });

    it('does not send a customer communication when denied', async () => {
        const { service, internal } = emails({
            resolveCustomerByEmail: jest.fn().mockResolvedValue(9),
            canSend: jest.fn().mockResolvedValue(deny()),
        });
        const delivered = await service.sendCustomerCommunication(
            { to: 'a@b.pl', subject: 's', template: 't' },
            CommunicationType.AppointmentReminder,
        );
        expect(delivered).toBe(false);
        expect(internal).not.toHaveBeenCalled();
    });

    it('fails closed when the eligibility service is missing', async () => {
        const { service, internal } = emails(
            undefined as unknown as Partial<CommunicationEligibilityService>,
        );
        expect(
            await service.sendCustomerCommunication(
                { to: 'a@b.pl', subject: 's', template: 't', recipientId: 9 },
                CommunicationType.AppointmentReminder,
            ),
        ).toBe(false);
        expect(internal).not.toHaveBeenCalled();
    });
});
