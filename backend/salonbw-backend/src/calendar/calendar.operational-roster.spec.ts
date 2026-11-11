import { CalendarService } from './calendar.service';
import { CalendarView } from './dto/calendar-query.dto';
import { Role } from '../users/role.enum';
import type { User } from '../users/user.entity';

describe('CalendarService V18 operational staff boundary', () => {
    const candidate = {
        id: 8,
        name: 'Active owner',
        role: Role.Admin,
        isSystemAdmin: false,
    } as User;

    const makeService = () => {
        const query = {
            innerJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            distinct: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([candidate]),
        };
        const repository = {
            createQueryBuilder: jest.fn().mockReturnValue(query),
        };
        const service = Object.create(
            CalendarService.prototype,
        ) as CalendarService;
        Object.defineProperty(service, 'userRepository', {
            value: repository,
        });
        const getOperational = (
            service as unknown as {
                getActiveBookableEmployees: (ids?: number[]) => Promise<User[]>;
            }
        ).getActiveBookableEmployees.bind(service);
        return { query, repository, service, getOperational };
    };

    it('selects staff with active services and an active, current timetable', async () => {
        const { query, repository, getOperational } = makeService();
        expect(await getOperational()).toEqual([candidate]);
        expect(repository.createQueryBuilder).toHaveBeenCalledWith('staff');
        expect(query.innerJoin).toHaveBeenCalledTimes(3);
        const conditions = query.innerJoin.mock.calls.map((args) =>
            String(args[2]),
        );
        expect(conditions[0]).toContain('assignment.isActive = true');
        expect(conditions[1]).toContain('service.isActive = true');
        expect(conditions[2]).toContain('timetable.isActive = true');
        expect(query.where).toHaveBeenCalledWith(
            'staff.role IN (:...roles)',
            { roles: [Role.Employee, Role.Admin] },
        );
        expect(query.andWhere).toHaveBeenCalledWith(
            'staff.isSystemAdmin = false',
        );
        expect(query.andWhere).toHaveBeenCalledWith(
            'timetable.validFrom <= :today',
            expect.objectContaining({ today: expect.any(String) }),
        );
        expect(query.andWhere).toHaveBeenCalledWith(
            '(timetable.validTo IS NULL OR timetable.validTo >= :today)',
        );
        expect(query.distinct).toHaveBeenCalledWith(true);
    });

    it('filters by selected operational employee IDs rather than all roles', async () => {
        const { query, getOperational } = makeService();
        await getOperational([8, 15]);
        expect(query.andWhere).toHaveBeenCalledWith(
            'staff.id IN (:...employeeIds)',
            { employeeIds: [8, 15] },
        );
    });

    it('does not fetch the unfiltered calendar when no operational staff exist', async () => {
        const { service, query } = makeService();
        query.getMany.mockResolvedValue([]);
        const findAppointments = jest.fn().mockResolvedValue([]);
        const findBlocks = jest.fn().mockResolvedValue([]);
        Object.defineProperty(service, 'findAppointmentsOverlappingRange', {
            value: findAppointments,
        });
        Object.defineProperty(service, 'findTimeBlocksOverlappingRange', {
            value: findBlocks,
        });

        const response = await service.getCalendarData(
            new Date('2026-11-12T12:00:00.000Z'),
            CalendarView.Day,
            undefined,
            true,
        );
        expect(response.employees).toEqual([]);
        expect(response.events).toEqual([]);
        expect(findAppointments).not.toHaveBeenCalled();
        expect(findBlocks).not.toHaveBeenCalled();
    });

    it('fetches events only for real operational staff in the V18 opt-in', async () => {
        const { service } = makeService();
        const findAppointments = jest.fn().mockResolvedValue([]);
        const findBlocks = jest.fn().mockResolvedValue([]);
        Object.defineProperty(service, 'findAppointmentsOverlappingRange', {
            value: findAppointments,
        });
        Object.defineProperty(service, 'findTimeBlocksOverlappingRange', {
            value: findBlocks,
        });
        const response = await service.getCalendarData(
            new Date('2026-11-12T12:00:00.000Z'),
            CalendarView.Week,
            undefined,
            true,
        );
        expect(response.employees).toEqual([
            { id: 8, name: 'Active owner', color: undefined },
        ]);
        expect(findAppointments.mock.calls[0][2]).toEqual([8]);
        expect(findBlocks.mock.calls[0][2]).toEqual([8]);
    });
});
