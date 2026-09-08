import { ConfigService } from '@nestjs/config';
import { Between, In, Repository } from 'typeorm';
import { AutomaticReminderService } from './automatic-reminder.service';
import { Appointment } from '../appointments/appointment.entity';
import { MessageTemplate } from '../sms/entities/message-template.entity';
import { ReminderSettings } from '../settings/entities/reminder-settings.entity';
import { SmsService } from '../sms/sms.service';
import { EmailsService } from '../emails/emails.service';

describe('AutomaticReminderService appointment eligibility', () => {
    const now = new Date('2026-09-06T10:00:00.000Z');
    let service: AutomaticReminderService;
    let appointments: {
        find: jest.Mock;
        count: jest.Mock;
        save: jest.Mock;
        update: jest.Mock;
        createQueryBuilder: jest.Mock;
    };
    let emails: { send: jest.Mock };
    let sms: { sendAppointmentReminder: jest.Mock };
    let claimExecute: jest.Mock;

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
        appointments = {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            save: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: jest.fn().mockReturnValue(claimBuilder),
        };
        emails = { send: jest.fn().mockResolvedValue(undefined) };
        sms = {
            sendAppointmentReminder: jest.fn().mockResolvedValue(null),
        };
        service = new AutomaticReminderService(
            appointments as unknown as Repository<Appointment>,
            {
                findOne: jest.fn().mockResolvedValue({
                    subject: 'Przypomnienie',
                    content: 'Termin: {{date}} {{time}}',
                }),
            } as unknown as Repository<MessageTemplate>,
            {
                find: jest.fn().mockResolvedValue([
                    {
                        id: 1,
                        active: true,
                        timingHours: 24,
                        preferredChannel: 'email',
                    },
                ]),
            } as unknown as Repository<ReminderSettings>,
            sms as unknown as SmsService,
            emails as unknown as EmailsService,
            new ConfigService({}),
        );
    });

    afterEach(() => jest.useRealTimers());

    // Online booking -> salon confirmation produces "confirmed". The
    // database query must include it alongside telephone bookings, while
    // excluding pending, cancelled, completed and already reminded visits.
    it('includes confirmed bookings in the hourly reminder query', async () => {
        await service.sendAppointmentReminders();

        expect(appointments.find).toHaveBeenCalledWith({
            where: {
                startTime: Between(now, new Date('2026-09-07T11:00:00.000Z')),
                status: In(['scheduled', 'confirmed']),
                reminderSent: false,
            },
            relations: ['client', 'service', 'employee'],
        });
    });

    it('includes confirmed bookings in manually triggered reminders', async () => {
        await service.sendRemindersForNextHours(12);

        expect(appointments.find).toHaveBeenCalledWith({
            where: {
                startTime: Between(now, new Date('2026-09-06T22:00:00.000Z')),
                status: In(['scheduled', 'confirmed']),
                reminderSent: false,
            },
            relations: ['client', 'service', 'employee'],
        });
    });

    it('counts confirmed bookings among upcoming reminders', async () => {
        await service.getReminderStats();

        expect(appointments.count).toHaveBeenCalledWith({
            where: {
                startTime: Between(now, new Date('2026-09-08T10:00:00.000Z')),
                status: In(['scheduled', 'confirmed']),
                reminderSent: false,
            },
        });
    });

    it('uses operational email preference independently of marketing consent', async () => {
        appointments.find.mockResolvedValue([
            {
                id: 7,
                startTime: new Date('2026-09-07T10:30:00.000Z'),
                client: Object.assign(
                    {
                        id: 1,
                        name: 'Klientka',
                        email: 'client@example.com',
                        receiveNotifications: true,
                        emailConsent: false,
                    },
                    { notifyEmail: true },
                ),
                service: { name: 'Usługa' },
                employee: { name: 'Salon' },
            },
        ]);

        await service.sendAppointmentReminders();

        expect(emails.send).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'client@example.com',
                recipientId: 1,
                data: expect.objectContaining({
                    date: '7 września 2026',
                    time: '12:30',
                }),
            }),
        );
    });

    it('retries an undelivered reminder on a later hourly run', async () => {
        const appointment = {
            id: 8,
            startTime: new Date('2026-09-07T10:30:00.000Z'),
            reminderSent: false,
            reminderAttemptCount: 0,
            reminderLastAttemptAt: null,
            client: {
                id: 2,
                name: 'Klientka',
                email: 'client@example.com',
                receiveNotifications: true,
                notifyEmail: true,
                notifySms: false,
            },
            service: { name: 'Usługa' },
            employee: { name: 'Salon' },
        };
        appointments.find.mockResolvedValue([appointment]);
        emails.send
            .mockRejectedValueOnce(new Error('smtp unavailable'))
            .mockResolvedValueOnce(undefined);

        await service.sendAppointmentReminders();
        jest.setSystemTime(new Date(now.getTime() + 60 * 60 * 1000));
        await service.sendAppointmentReminders();

        expect(emails.send).toHaveBeenCalledTimes(2);
        expect(claimExecute).toHaveBeenCalledTimes(2);
        expect(appointments.update).toHaveBeenCalledWith(8, {
            reminderSent: true,
            reminderSentAt: expect.any(Date),
        });
    });

    it('skips delivery when another worker already claimed the reminder', async () => {
        appointments.find.mockResolvedValue([
            {
                id: 9,
                startTime: new Date('2026-09-07T10:30:00.000Z'),
                reminderSent: false,
                client: {
                    id: 3,
                    name: 'Klientka',
                    email: 'client@example.com',
                    receiveNotifications: true,
                    notifyEmail: true,
                    notifySms: false,
                },
                service: { name: 'Usługa' },
                employee: { name: 'Salon' },
            },
        ]);
        claimExecute.mockResolvedValue({ affected: 0 });

        await service.sendAppointmentReminders();

        expect(emails.send).not.toHaveBeenCalled();
    });

    it('does not mark a failed SMS provider result as delivered', async () => {
        appointments.find.mockResolvedValue([
            {
                id: 10,
                startTime: new Date('2026-09-07T10:30:00.000Z'),
                reminderSent: false,
                client: {
                    id: 4,
                    name: 'Klientka',
                    phone: '+48000000000',
                    receiveNotifications: true,
                    notifyEmail: false,
                    notifySms: true,
                },
                service: { name: 'Usługa' },
                employee: { name: 'Salon' },
            },
        ]);
        sms.sendAppointmentReminder.mockResolvedValue({ status: 'failed' });

        await service.sendAppointmentReminders();

        expect(sms.sendAppointmentReminder).toHaveBeenCalledWith(10, null);
        expect(appointments.update).not.toHaveBeenCalled();
    });

    it('reports provider failure separately from a missing delivery channel', async () => {
        appointments.find.mockResolvedValue([
            {
                id: 12,
                startTime: new Date('2026-09-06T11:00:00.000Z'),
                reminderSent: false,
                client: {
                    id: 5,
                    name: 'Klientka',
                    email: 'client@example.com',
                    receiveNotifications: true,
                    notifyEmail: true,
                    notifySms: false,
                },
                service: { name: 'Usługa' },
                employee: { name: 'Salon' },
            },
        ]);
        emails.send.mockRejectedValue(new Error('smtp unavailable'));

        const [result] = await service.sendRemindersForNextHours(2);

        expect(result).toEqual(
            expect.objectContaining({
                smsSent: false,
                emailSent: false,
                error: 'All configured reminder channels failed',
            }),
        );
    });
});
