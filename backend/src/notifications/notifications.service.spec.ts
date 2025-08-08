import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import {
    Notification,
    NotificationStatus,
} from './notification.entity';
import { NotificationChannel } from './notification-channel.enum';
import { NotificationLog } from './notification-log.entity';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let sms: { sendSms: jest.Mock };
    let whatsapp: { sendText: jest.Mock };
    let repo: Partial<Repository<Notification>>;
    let logRepo: Partial<Repository<NotificationLog>>;
    let appts: { find: jest.Mock };
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(async () => {
        sms = { sendSms: jest.fn() };
        whatsapp = { sendText: jest.fn() };
        repo = {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => x),
        } as any;
        logRepo = {
            create: jest.fn((x) => x),
            save: jest.fn(async (x) => x),
        } as any;
        appts = { find: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: SmsService, useValue: sms },
                { provide: WhatsappService, useValue: whatsapp },
                { provide: getRepositoryToken(Notification), useValue: repo },
                { provide: getRepositoryToken(NotificationLog), useValue: logRepo },
                { provide: getRepositoryToken(Appointment), useValue: appts },
            ],
        }).compile();
        service = module.get<NotificationsService>(NotificationsService);
        loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
    });

    it('uses SMS adapter when type sms', async () => {
        await service.sendNotification('1', 'msg', NotificationChannel.Sms);
        expect(sms.sendSms).toHaveBeenCalledWith('1', 'msg');
        expect(whatsapp.sendText).not.toHaveBeenCalled();
    });

    it('uses WhatsApp adapter when type whatsapp', async () => {
        await service.sendNotification(
            '1',
            'msg',
            NotificationChannel.Whatsapp,
        );
        expect(whatsapp.sendText).toHaveBeenCalledWith('1', 'msg');
        expect(sms.sendSms).not.toHaveBeenCalled();
    });

    it('records failed status on error', async () => {
        whatsapp.sendText.mockRejectedValue(new Error('fail'));
        const notif = (await service.sendNotification(
            '1',
            'msg',
            NotificationChannel.Whatsapp,
        )) as Notification;
        expect(notif.status).toBe(NotificationStatus.Failed);
    });

    it('records skipped status when notifications are disabled', async () => {
        process.env.NOTIFICATIONS_ENABLED = 'false';
        const notif = (await service.sendNotification(
            '1',
            'msg',
            NotificationChannel.Sms,
        )) as Notification;
        expect(notif.status).toBe(NotificationStatus.Skipped);
        delete process.env.NOTIFICATIONS_ENABLED;
    });

    it('creates log for successful sends', async () => {
        await service.sendNotification('1', 'msg', NotificationChannel.Whatsapp);
        expect(logRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: NotificationStatus.Sent,
                recipient: '1',
                type: NotificationChannel.Whatsapp,
            }),
        );
    });

    it('creates log with error on failure', async () => {
        whatsapp.sendText.mockRejectedValue(new Error('fail'));
        await service.sendNotification('1', 'msg', NotificationChannel.Whatsapp);
        expect(logRepo.save).toHaveBeenCalledTimes(2);
        expect(logRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: NotificationStatus.Failed,
                error: 'fail',
            }),
        );
    });

    it('logs retry attempts', async () => {
        whatsapp.sendText
            .mockRejectedValueOnce(new Error('nope'))
            .mockResolvedValueOnce(undefined);
        await service.sendNotification('1', 'msg', NotificationChannel.Whatsapp);
        expect(logRepo.save).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
                status: NotificationStatus.Failed,
                error: 'nope',
            }),
        );
        expect(logRepo.save).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ status: NotificationStatus.Sent }),
        );
    });

    it('reminderCron dispatches reminders concurrently', async () => {
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() + 1);
        appts.find.mockResolvedValue([
            {
                startTime: apptDate,
                status: AppointmentStatus.Scheduled,
                client: { phone: '123' },
            } as Appointment,
            {
                startTime: apptDate,
                status: AppointmentStatus.Scheduled,
                client: { phone: '456' },
            } as Appointment,
        ]);
        let inFlight = 0;
        let maxInFlight = 0;
        whatsapp.sendText.mockImplementation(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((res) => setTimeout(res, 10));
            inFlight--;
        });
        await service.reminderCron();
        expect(whatsapp.sendText).toHaveBeenCalledTimes(2);
        expect(maxInFlight).toBeGreaterThan(1);
    });

    it('followUpCron dispatches follow-ups concurrently', async () => {
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() - 1);
        appts.find.mockResolvedValue([
            {
                startTime: apptDate,
                status: AppointmentStatus.Completed,
                client: { phone: '321' },
            } as Appointment,
            {
                startTime: apptDate,
                status: AppointmentStatus.Completed,
                client: { phone: '654' },
            } as Appointment,
        ]);
        let inFlight = 0;
        let maxInFlight = 0;
        whatsapp.sendText.mockImplementation(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((res) => setTimeout(res, 10));
            inFlight--;
        });
        await service.followUpCron();
        expect(whatsapp.sendText).toHaveBeenCalledTimes(2);
        expect(maxInFlight).toBeGreaterThan(1);
    });

    it('followUpCron logs failures for individual appointments', async () => {
        // Restore the default error spy to actually test error logging
        loggerErrorSpy.mockRestore();
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() - 1);
        appts.find.mockResolvedValue([
            {
                startTime: apptDate,
                status: AppointmentStatus.Completed,
                client: { phone: '111' },
            } as Appointment,
            {
                startTime: apptDate,
                status: AppointmentStatus.Completed,
                client: { phone: '222' },
            } as Appointment,
        ]);
        const errorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
        const thankSpy = jest
            .spyOn(service, 'sendThankYou')
            .mockRejectedValueOnce(new Error('fail1'))
            .mockResolvedValueOnce(undefined as any);
        await service.followUpCron();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(service.sendThankYou).toHaveBeenCalledTimes(2);
        thankSpy.mockRestore();
        errorSpy.mockRestore();
        // Re-establish the mocked logger for other tests
        loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
    });

    it('sendAppointmentConfirmation sends WhatsApp message', async () => {
        const when = new Date('2025-01-01T10:00:00Z');
        await service.sendAppointmentConfirmation('123', when);
        expect(whatsapp.sendText).toHaveBeenCalledWith(
            '123',
            `Twoja wizyta została umówiona na ${when.toLocaleString()}`,
        );
    });

    it('sendAppointmentReminder sends WhatsApp message', async () => {
        const when = new Date('2025-01-02T15:00:00Z');
        await service.sendAppointmentReminder('456', when);
        expect(whatsapp.sendText).toHaveBeenCalledWith(
            '456',
            `Przypomnienie: wizyta ${when.toLocaleString()}`,
        );
    });

    it('sendThankYou sends WhatsApp message', async () => {
        await service.sendThankYou('789');
        expect(whatsapp.sendText).toHaveBeenCalledWith(
            '789',
            'Dziękujemy za wizytę!',
        );
    });
});
