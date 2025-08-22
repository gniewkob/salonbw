import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { WhatsappService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';

describe('ReminderService', () => {
    let service: ReminderService;
    let whatsapp: WhatsappService;
    let repo: { find: jest.Mock };
    let sendReminder: jest.Mock;
    let config: { get: jest.Mock };

    beforeEach(async () => {
        repo = { find: jest.fn() };
        config = { get: jest.fn().mockReturnValue(24) };
        const whatsappMock = {
            sendReminder: jest
                .fn<Promise<void>, [string, string, string]>()
                .mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReminderService,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: WhatsappService, useValue: whatsappMock },
                { provide: ConfigService, useValue: config },
            ],
        }).compile();

        service = module.get<ReminderService>(ReminderService);
        whatsapp = module.get<WhatsappService>(WhatsappService);
        sendReminder = jest.spyOn(whatsapp, 'sendReminder');
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('sends reminders for appointments within the configured window', async () => {
        const now = new Date('2024-01-01T07:00:00Z');
        jest.useFakeTimers().setSystemTime(now);

        const appointment = {
            id: 1,
            startTime: new Date('2024-01-02T07:30:00Z'),
            endTime: new Date('2024-01-02T08:30:00Z'),
            status: AppointmentStatus.Scheduled,
            client: { phone: '1234567890' },
        } as unknown as Appointment;
        repo.find.mockResolvedValue([appointment]);

        await service.handleCron();

        const date = appointment.startTime.toISOString().split('T')[0];
        const time = appointment.startTime.toISOString().split('T')[1].slice(0, 5);
        expect(sendReminder).toHaveBeenCalledWith('1234567890', date, time);
    });
});
