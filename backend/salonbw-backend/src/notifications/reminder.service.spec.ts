import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { WhatsappService } from './whatsapp.service';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';

describe('ReminderService', () => {
    let service: ReminderService;
    let whatsapp: WhatsappService;
    let repo: { find: jest.Mock };
    let sendReminder: jest.Mock;

    beforeEach(async () => {
        repo = { find: jest.fn() };
        const whatsappMock = {
            sendReminder: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReminderService,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: WhatsappService, useValue: whatsappMock },
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

    it('sends reminders for appointments scheduled the next day', async () => {
        const now = new Date('2024-01-01T07:00:00Z');
        jest.useFakeTimers().setSystemTime(now);

        const appointment = {
            id: 1,
            startTime: new Date('2024-01-02T10:00:00Z'),
            endTime: new Date('2024-01-02T11:00:00Z'),
            status: AppointmentStatus.Scheduled,
            client: { phone: '1234567890' },
        } as unknown as Appointment;
        repo.find.mockResolvedValue([appointment]);

        await service.handleCron();

        expect(sendReminder).toHaveBeenCalledWith('1234567890', ['1']);
    });
});
