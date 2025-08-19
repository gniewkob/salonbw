import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReminderService } from './reminder.service';
import { WhatsappService } from './whatsapp.service';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';

describe('ReminderService', () => {
    let service: ReminderService;
    let whatsapp: WhatsappService;
    let repo: { find: jest.Mock };

    beforeEach(async () => {
        repo = { find: jest.fn() };
        const whatsappMock = { sendReminder: jest.fn() };
        jest.spyOn(whatsappMock, 'sendReminder').mockResolvedValue();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReminderService,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: WhatsappService, useValue: whatsappMock },
                { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('24') } },
            ],
        }).compile();

        service = module.get<ReminderService>(ReminderService);
        whatsapp = module.get<WhatsappService>(WhatsappService);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('sends reminders for appointments 24 hours ahead', async () => {
        const now = new Date('2024-01-01T07:00:00Z');
        jest.useFakeTimers().setSystemTime(now);

        const appointment = {
            id: 1,
            startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            endTime: new Date(now.getTime() + 25 * 60 * 60 * 1000),
            status: AppointmentStatus.Scheduled,
            client: { phone: '1234567890' },
        } as unknown as Appointment;
        repo.find.mockResolvedValue([appointment]);

        await service.handleCron();

        expect(whatsapp.sendReminder).toHaveBeenCalledWith('1234567890', ['1']);
    });
});

