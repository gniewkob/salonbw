import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as nock from 'nock';
import { CalendarService } from './calendar.service';
import { GoogleCalendarAdapter } from './google-calendar.adapter';
import { OutlookCalendarAdapter } from './outlook-calendar.adapter';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';

describe('CalendarService', () => {
    let service: CalendarService;
    const repo = {
        findOne: jest.fn(),
    } as any;
    const logs = { create: jest.fn() } as any;

    beforeEach(async () => {
        nock.cleanAll();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarService,
                GoogleCalendarAdapter,
                OutlookCalendarAdapter,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();
        service = module.get(CalendarService);
    });

    it('creates google event', async () => {
        repo.findOne.mockResolvedValue({
            id: 1,
            startTime: new Date('2024-01-01T10:00:00Z'),
            service: { name: 'cut', duration: 60 },
            client: { name: 'c' },
        });
        const scope = nock('https://www.googleapis.com')
            .post('/calendar/v3/calendars/primary/events')
            .reply(200, { id: 'e1' });
        const result = await service.add(1, 'google', 'token');
        expect(result).toEqual({ eventId: 'e1' });
        expect(scope.isDone()).toBe(true);
    });

    it('returns ics', async () => {
        repo.findOne.mockResolvedValue({
            id: 1,
            startTime: new Date('2024-01-01T10:00:00Z'),
            service: { name: 'cut', duration: 60 },
            client: { name: 'c' },
        });
        const result = await service.add(1, 'ics');
        expect(result?.ics).toContain('BEGIN:VCALENDAR');
    });
});
