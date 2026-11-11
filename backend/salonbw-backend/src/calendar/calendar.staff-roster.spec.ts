import type { ObjectLiteral, Repository } from 'typeorm';
import { CalendarService } from './calendar.service';
import { CalendarView } from './dto/calendar-query.dto';
import { TimeBlock } from './entities/time-block.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Service } from '../services/service.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { TimetableException } from '../timetables/entities/timetable-exception.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';

const repo = <T extends ObjectLiteral>(value: unknown): Repository<T> =>
    value as Repository<T>;

function emptyCalendarQuery() {
    return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
    };
}

describe('CalendarService effective active staff roster', () => {
    const owner = {
        id: 9,
        name: 'Ola (DEV)',
        role: Role.Admin,
        isSystemAdmin: false,
    } as User;
    const anotherStylist = {
        id: 10,
        name: 'New stylist',
        role: Role.Employee,
        isSystemAdmin: false,
    } as User;

    function harness(activeIds: number[], staff: User[]) {
        const staffAssignments = {
            innerJoin: jest.fn().mockReturnThis(),
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            distinct: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getRawMany: jest
                .fn()
                .mockResolvedValue(activeIds.map((id) => ({ employeeId: id }))),
            getMany: jest.fn().mockResolvedValue([]),
        };
        const appointmentsQuery = emptyCalendarQuery();
        const blocksQuery = emptyCalendarQuery();
        const userRepository = {
            find: jest.fn().mockResolvedValue(staff),
        };
        const serviceRepository = {
            findOne: jest.fn().mockResolvedValue({
                id: 17,
                isActive: true,
                onlineBooking: true,
                duration: 45,
                variants: [],
            }),
        };
        const appointmentRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(appointmentsQuery),
        };
        const timeBlockRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(blocksQuery),
        };
        const employeeServiceRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(staffAssignments),
        };
        const service = new CalendarService(
            repo<TimeBlock>(timeBlockRepository),
            repo<Appointment>(appointmentRepository),
            repo<User>(userRepository),
            repo<Service>(serviceRepository),
            repo<EmployeeService>(employeeServiceRepository),
            repo<Branch>({}),
            repo<Timetable>({}),
            repo<TimetableException>({}),
        );
        return {
            service,
            userRepository,
            serviceRepository,
            appointmentRepository,
            timeBlockRepository,
            appointmentsQuery,
            blocksQuery,
            staffAssignments,
        };
    }

    it('returns a single active provider instead of QA or technical users', async () => {
        const ctx = harness([9], [owner]);
        const result = await ctx.service.getCalendarData(
            new Date('2026-11-12T10:00:00Z'),
            CalendarView.Day,
        );
        expect(result.employees.map((user) => user.id)).toEqual([9]);
        expect(ctx.staffAssignments.innerJoin).toHaveBeenCalledWith(
            'assignment.service',
            'service',
        );
        expect(ctx.staffAssignments.andWhere).toHaveBeenCalledWith(
            'service.isActive = true',
        );
        expect(ctx.appointmentsQuery.andWhere).toHaveBeenCalledWith(
            'employee.id IN (:...employeeIds)',
            { employeeIds: [9] },
        );
        expect(ctx.blocksQuery.andWhere).toHaveBeenCalledWith(
            'employee.id IN (:...employeeIds)',
            { employeeIds: [9] },
        );
    });

    it('shows multi-employee controls only once another real provider is assigned', async () => {
        const ctx = harness([9, 10], [owner, anotherStylist]);
        const result = await ctx.service.getCalendarData(
            new Date('2026-11-12T10:00:00Z'),
            CalendarView.Day,
        );
        expect(result.employees).toHaveLength(2);
    });

    it('never offers appointment slots for a service with no active provider assignment', async () => {
        const ctx = harness([9], [owner, anotherStylist]);
        const result = await ctx.service.getAvailableSlots(17, '2026-11-12');

        expect(result).toEqual([]);
        expect(ctx.staffAssignments.getMany).toHaveBeenCalledTimes(1);
        expect(ctx.staffAssignments.andWhere).toHaveBeenCalledWith(
            'es.isActive = true',
        );
        // The old fallback returned every employee (including QA staff),
        // even though these employees did not provide the chosen service.
        expect(ctx.userRepository.find).not.toHaveBeenCalled();
        expect(ctx.appointmentRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('never returns slots for technical admins or client-role assignment anomalies', async () => {
        const ctx = harness([9], [owner]);
        ctx.staffAssignments.getMany.mockResolvedValue([
            {
                employee: {
                    id: 55,
                    role: Role.Admin,
                    isSystemAdmin: true,
                    name: 'Technical',
                },
            },
            {
                employee: {
                    id: 56,
                    role: Role.Client,
                    isSystemAdmin: false,
                    name: 'Invalid assignment',
                },
            },
        ]);

        const result = await ctx.service.getAvailableSlots(17, '2026-11-12');
        expect(result).toEqual([]);
        expect(ctx.userRepository.find).not.toHaveBeenCalled();
    });

    it('never falls back to all employees when no active service assignments exist', async () => {
        const ctx = harness([], []);
        const result = await ctx.service.getCalendarData(
            new Date('2026-11-12T10:00:00Z'),
            CalendarView.Day,
        );
        expect(result.events).toEqual([]);
        expect(result.employees).toEqual([]);
        expect(
            ctx.appointmentRepository.createQueryBuilder,
        ).not.toHaveBeenCalled();
        expect(
            ctx.timeBlockRepository.createQueryBuilder,
        ).not.toHaveBeenCalled();
        expect(ctx.userRepository.find).not.toHaveBeenCalled();
    });
});
