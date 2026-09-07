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
    let appointments: { find: jest.Mock; count: jest.Mock; save: jest.Mock };
    let emails: { send: jest.Mock };

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(now);
        appointments = {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(0),
            save: jest.fn().mockResolvedValue(undefined),
        };
        emails = { send: jest.fn().mockResolvedValue(undefined) };
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
            {} as SmsService,
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
                startTime: Between(
                    new Date('2026-09-07T10:00:00.000Z'),
                    new Date('2026-09-07T11:00:00.000Z'),
                ),
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
});
