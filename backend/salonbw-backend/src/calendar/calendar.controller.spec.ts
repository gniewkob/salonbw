import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarQueryDto, CalendarView } from './dto/calendar-query.dto';
import { Role } from '../users/role.enum';

describe('CalendarController employee read scope', () => {
    const getCalendarData = jest.fn();
    const getTimeBlocks = jest.fn();
    const checkConflicts = jest.fn();
    const listBookableEmployees = jest.fn();
    const controller = new CalendarController({
        getCalendarData,
        getTimeBlocks,
        checkConflicts,
        listBookableEmployees,
    } as unknown as CalendarService);

    beforeEach(() => {
        getCalendarData.mockReset();
        getTimeBlocks.mockReset();
        checkConflicts.mockReset();
        listBookableEmployees.mockReset();
        listBookableEmployees.mockResolvedValue([{ id: 7, name: 'Ola' }]);
        getCalendarData.mockResolvedValue({
            events: [],
            employees: [],
            dateRange: { start: new Date(), end: new Date() },
        });
    });

    it('returns only active performers to the salon administrator', async () => {
        await expect(
            controller.listPerformers({ userId: 1, role: Role.Admin }),
        ).resolves.toEqual([{ id: 7, name: 'Ola' }]);
        expect(listBookableEmployees).toHaveBeenCalledWith(undefined);
    });

    it('scopes the bookable performer selector to an employee own ID', async () => {
        await controller.listPerformers({
            userId: 7,
            role: Role.Employee,
        });
        expect(listBookableEmployees).toHaveBeenCalledWith([7]);
    });

    it('forces an employee calendar query to the authenticated employee id', async () => {
        const query = {
            date: '2026-09-09',
            view: CalendarView.Day,
            employeeIds: [99],
        } as CalendarQueryDto;
        const getEvents = controller.getEvents.bind(controller) as unknown as (
            query: CalendarQueryDto,
            user: { userId: number; role: Role },
        ) => Promise<unknown>;

        await getEvents(query, { userId: 7, role: Role.Employee });

        expect(getCalendarData).toHaveBeenCalledWith(
            new Date('2026-09-09'),
            CalendarView.Day,
            [7],
        );
    });

    it('preserves an admin employee filter', async () => {
        const query = {
            date: '2026-09-09',
            view: CalendarView.Week,
            employeeIds: [7, 99],
        } as CalendarQueryDto;

        await controller.getEvents(query, {
            userId: 1,
            role: Role.Admin,
        });

        expect(getCalendarData).toHaveBeenCalledWith(
            new Date('2026-09-09'),
            CalendarView.Week,
            [7, 99],
        );
    });

    it('forces an employee time-block query to their own id', async () => {
        getTimeBlocks.mockResolvedValue([]);

        await controller.getTimeBlocks(
            {
                from: '2026-09-09',
                to: '2026-09-10',
                employeeId: 99,
            },
            { userId: 7, role: Role.Employee },
        );

        expect(getTimeBlocks).toHaveBeenCalledWith(
            new Date('2026-09-09'),
            new Date('2026-09-10'),
            7,
        );
    });

    it('forces employee conflict checks to their own id', async () => {
        checkConflicts.mockResolvedValue({ hasConflict: false });

        await controller.checkConflicts(
            99,
            '2026-09-09T09:00:00.000Z',
            '2026-09-09T10:00:00.000Z',
            { userId: 7, role: Role.Employee },
            undefined,
        );

        expect(checkConflicts).toHaveBeenCalledWith(
            7,
            new Date('2026-09-09T09:00:00.000Z'),
            new Date('2026-09-09T10:00:00.000Z'),
            undefined,
        );
    });
});
