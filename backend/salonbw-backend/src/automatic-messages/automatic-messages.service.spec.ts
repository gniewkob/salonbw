import { Between, In, Repository } from 'typeorm';
import { AutomaticMessagesService } from './automatic-messages.service';
import {
    AutomaticMessageRule,
    AutomaticMessageTrigger,
    MessageChannel,
} from './entities/automatic-message-rule.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { SmsService } from '../sms/sms.service';

describe('AutomaticMessagesService appointment reminders', () => {
    const now = new Date('2026-09-08T10:00:00.000Z');
    let rules: { save: jest.Mock };
    let appointments: {
        find: jest.Mock;
        save: jest.Mock;
        update: jest.Mock;
        createQueryBuilder: jest.Mock;
    };
    let sms: { sendSms: jest.Mock };
    let claimExecute: jest.Mock;
    let service: AutomaticMessagesService;

    const rule = (): AutomaticMessageRule =>
        ({
            id: 1,
            name: 'Reminder',
            trigger: AutomaticMessageTrigger.AppointmentReminder,
            channel: MessageChannel.Sms,
            offsetHours: -24,
            sendWindowStart: '00:00:00',
            sendWindowEnd: '23:59:59',
            content: 'Termin {{appointment_date}}',
            templateId: null,
            serviceIds: null,
            employeeIds: null,
            requireSmsConsent: false,
            requireEmailConsent: false,
            sentCount: 0,
            lastSentAt: null,
        }) as AutomaticMessageRule;

    const appointment = (): Appointment =>
        ({
            id: 11,
            startTime: new Date('2026-09-09T10:30:00.000Z'),
            reminderSent: false,
            client: {
                id: 3,
                name: 'Klientka',
                phone: '+48000000000',
                receiveNotifications: true,
                notifySms: true,
            },
            service: { id: 4, name: 'Usługa' },
            employee: { id: 5, name: 'Salon' },
        }) as Appointment;

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(now);
        claimExecute = jest.fn().mockResolvedValue({ affected: 1 });
        const claimBuilder = {
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            execute: claimExecute,
        };
        rules = { save: jest.fn().mockResolvedValue(undefined) };
        appointments = {
            find: jest.fn().mockResolvedValue([]),
            save: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn().mockReturnValue(claimBuilder),
        };
        sms = {
            sendSms: jest.fn().mockResolvedValue({ status: 'sent' }),
        };
        service = new AutomaticMessagesService(
            rules as unknown as Repository<AutomaticMessageRule>,
            appointments as unknown as Repository<Appointment>,
            {} as Repository<User>,
            sms as unknown as SmsService,
        );
    });

    afterEach(() => jest.useRealTimers());

    it('includes confirmed and previously failed appointments in its catch-up window', async () => {
        await service.processRule(rule());

        expect(appointments.find).toHaveBeenCalledWith({
            where: {
                startTime: Between(now, new Date('2026-09-09T11:00:00.000Z')),
                status: In(['scheduled', 'confirmed']),
                reminderSent: false,
            },
            relations: ['client', 'employee', 'service'],
        });
    });

    it('does not close a reminder when the SMS provider reports failure', async () => {
        appointments.find.mockResolvedValue([appointment()]);
        sms.sendSms.mockResolvedValue({ status: 'failed' });

        const result = await service.processRule(rule());

        expect(result.sent).toBe(0);
        expect(result.errors).toBe(1);
        expect(appointments.update).not.toHaveBeenCalled();
    });

    it('does not duplicate a reminder claimed by the hourly worker', async () => {
        appointments.find.mockResolvedValue([appointment()]);
        claimExecute.mockResolvedValue({ affected: 0 });

        const result = await service.processRule(rule());

        expect(sms.sendSms).not.toHaveBeenCalled();
        expect(result.skipped).toBe(1);
    });
});
