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
import { normalizeSmsPhoneNumber } from './consent-evaluation';
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
    appointment: Partial<Appointment> | null = null,
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
            findOne: jest.fn().mockResolvedValue(appointment),
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

    it.each(['single', 'bulk'])(
        'treats free text with an operational template as marketing (%s)',
        async (mode) => {
            const canSend = jest.fn().mockResolvedValue(deny());
            const { service } = smsService(
                {
                    canSend,
                    resolveCustomerByPhone: jest.fn().mockResolvedValue(5),
                },
                { id: 3, type: TemplateType.AppointmentReminder },
            );
            const message = { content: 'Promocja', templateId: 3 };
            const logs =
                mode === 'single'
                    ? [
                          await service.sendSms({
                              ...message,
                              recipient: '600100200',
                          }),
                      ]
                    : await service.sendBulkSms({
                          ...message,
                          recipients: ['600100200'],
                      });
            expect(canSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    communicationType: CommunicationType.MassMarketing,
                }),
            );
            expect(logs[0].status).toBe(SmsStatus.Failed);
        },
    );

    it('treats free text associated with an appointment as marketing', async () => {
        const canSend = jest.fn().mockResolvedValue(deny());
        const { service } = smsService({ canSend }, undefined, undefined, {
            client: { id: 5 } as Appointment['client'],
        });
        const log = await service.sendSms({
            recipient: '600100200',
            recipientId: 5,
            appointmentId: 12,
            content: 'Promocja',
        });
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                communicationType: CommunicationType.MassMarketing,
            }),
        );
        expect(log.status).toBe(SmsStatus.Failed);
    });

    it('treats a manually rendered template with caller variables as marketing', async () => {
        const canSend = jest.fn().mockResolvedValue(deny());
        const { service } = smsService(
            { canSend, resolveCustomerByPhone: jest.fn().mockResolvedValue(5) },
            {
                id: 3,
                type: TemplateType.AppointmentReminder,
                isActive: true,
                content: '{{message}}',
            },
        );
        const log = await service.sendFromTemplate({
            templateId: 3,
            recipient: '600100200',
            variables: { message: 'Promocja' },
        });
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                communicationType: CommunicationType.MassMarketing,
            }),
        );
        expect(log.status).toBe(SmsStatus.Failed);
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

    it('denies an explicit recipientId if the international country code differs', async () => {
        const canSend = jest.fn().mockResolvedValue({ allowed: true });
        const { service, fetchSpy } = smsService(
            { canSend, resolveCustomerByPhone: jest.fn() },
            undefined,
            '+48 600 100 200',
        );
        const log = await service.sendSms({
            recipient: '+33 600 100 200',
            recipientId: 5,
            content: 'Przypomnienie',
        });
        expect(log.recipient).toBe('33600100200');
        expect(log.status).toBe(SmsStatus.Failed);
        expect(log.errorMessage).toContain('RECIPIENT_UNKNOWN');
        expect(canSend).not.toHaveBeenCalled();
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('preserves Polish nine-digit local phone compatibility for explicit IDs', async () => {
        const canSend = jest.fn().mockResolvedValue({ allowed: true });
        const { service } = smsService(
            { canSend },
            undefined,
            '+48 600 100 200',
        );
        const log = await service.sendSms({
            recipient: '600 100 200',
            recipientId: 5,
            content: 'Przypomnienie',
        });
        expect(log.recipient).toBe('48600100200');
        expect(canSend).toHaveBeenCalledWith(
            expect.objectContaining({
                customerId: 5,
                recipientPhone: '600 100 200',
            }),
        );
        expect(log.errorMessage).not.toContain('Zablokowano');
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

describe('SMS destination normalization and customer resolution', () => {
    it('uses the complete country code and defaults only 9-digit Polish numbers', () => {
        expect(normalizeSmsPhoneNumber('600 100 200')).toBe('48600100200');
        expect(normalizeSmsPhoneNumber('+48 600 100 200')).toBe('48600100200');
        expect(normalizeSmsPhoneNumber('+33 600 100 200')).toBe('33600100200');
        expect(normalizeSmsPhoneNumber('600100')).toBeNull();
        expect(normalizeSmsPhoneNumber('1234567890123456')).toBeNull();
    });

    it('queries the full canonical destination rather than a matching 9-digit suffix', async () => {
        const query = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([]),
        };
        const service = new CommunicationEligibilityService(
            {} as never,
            { createQueryBuilder: () => query } as never,
        );
        await expect(
            service.resolveCustomerByPhone('+33 600 100 200'),
        ).resolves.toBeNull();

        const [condition, parameters] = query.andWhere.mock.calls[0] as [
            string,
            { destination: string },
        ];
        expect(parameters).toEqual({ destination: '33600100200' });
        expect(condition).toContain('CASE WHEN length');
        expect(condition).toContain("THEN '48' ||");
        expect(condition).toContain('= :destination');
        expect(condition).not.toMatch(/right\s*\(/i);
        expect(query.limit).toHaveBeenCalledWith(2);
    });

    it('rejects invalid-length bulk recipient numbers before looking up consent', async () => {
        const canSend = jest.fn();
        const resolveCustomerByPhone = jest.fn();
        const { service } = smsService({ canSend, resolveCustomerByPhone });
        const [log] = await service.sendBulkSms({
            recipients: ['1234'],
            content: 'Oferta',
        });
        expect(log.status).toBe(SmsStatus.Failed);
        expect(canSend).not.toHaveBeenCalled();
        expect(resolveCustomerByPhone).not.toHaveBeenCalled();
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

    it('refuses staff e-mail when eligibility is unavailable', async () => {
        const { service, internal } = emails(undefined as never);
        await expect(
            service.sendAsUser(
                { to: 'a@b.pl', subject: 's', template: 't' },
                1,
            ),
        ).rejects.toThrow('niedostępna');
        expect(internal).not.toHaveBeenCalled();
    });

    it('allows staff e-mail to an address absent from the customer database', async () => {
        const { service, internal } = emails({
            resolveCustomerByEmail: jest.fn().mockResolvedValue(null),
        });
        await service.sendAsUser(
            { to: 'a@b.pl', subject: 's', template: 't' },
            1,
        );
        expect(internal).toHaveBeenCalledTimes(1);
    });

    it('refuses ambiguous case-insensitive customer e-mail matches', async () => {
        const query = {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
        };
        const eligibility = new CommunicationEligibilityService(
            {} as never,
            { createQueryBuilder: () => query } as never,
        );
        const { service, internal } = emails(eligibility);
        await expect(
            service.sendAsUser(
                { to: 'a@b.pl', subject: 's', template: 't' },
                1,
            ),
        ).rejects.toThrow('Niejednoznaczny');
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
