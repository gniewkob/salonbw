import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { NotificationsService } from './notifications.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import { Notification, NotificationStatus } from './notification.entity';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let sms: { sendSms: jest.Mock };
    let whatsapp: { sendText: jest.Mock };
    let repo: Partial<Repository<Notification>>;
    let appts: { find: jest.Mock };

    beforeEach(async () => {
        sms = { sendSms: jest.fn() };
        whatsapp = { sendText: jest.fn() };
        repo = { create: jest.fn((x) => x), save: jest.fn() } as any;
        appts = { find: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: SmsService, useValue: sms },
                { provide: WhatsappService, useValue: whatsapp },
                { provide: getRepositoryToken(Notification), useValue: repo },
                { provide: getRepositoryToken(Appointment), useValue: appts },
            ],
        }).compile();
        service = module.get<NotificationsService>(NotificationsService);
    });

    it('uses SMS adapter when type sms', async () => {
        await service.sendNotification('1', 'msg', 'sms');
        expect(sms.sendSms).toHaveBeenCalledWith('1', 'msg');
        expect(whatsapp.sendText).not.toHaveBeenCalled();
    });

    it('uses WhatsApp adapter when type whatsapp', async () => {
        await service.sendNotification('1', 'msg', 'whatsapp');
        expect(whatsapp.sendText).toHaveBeenCalledWith('1', 'msg');
        expect(sms.sendSms).not.toHaveBeenCalled();
    });

    it('records failed status on error', async () => {
        whatsapp.sendText.mockRejectedValue(new Error('fail'));
        const notif = (await service.sendNotification(
            '1',
            'msg',
            'whatsapp',
        )) as Notification;
        expect(notif.status).toBe(NotificationStatus.Failed);
    });

    it('reminderCron notifies upcoming appointments', async () => {
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() + 1);
        appts.find.mockResolvedValue([
            {
                startTime: apptDate,
                status: AppointmentStatus.Scheduled,
                client: { phone: '123' },
            } as Appointment,
        ]);
        await service.reminderCron();
        expect(whatsapp.sendText).toHaveBeenCalled();
    });

    it('followUpCron notifies completed appointments', async () => {
        const apptDate = new Date();
        apptDate.setDate(apptDate.getDate() - 1);
        appts.find.mockResolvedValue([
            {
                startTime: apptDate,
                status: AppointmentStatus.Completed,
                client: { phone: '321' },
            } as Appointment,
        ]);
        await service.followUpCron();
        expect(whatsapp.sendText).toHaveBeenCalled();
    });
});
