import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Service } from '../services/service.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { CalendarService } from './calendar.service';
import { TimeBlock, TimeBlockType } from './entities/time-block.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import {
    TimetableException,
    ExceptionType,
} from '../timetables/entities/timetable-exception.entity';

function createCountQueryBuilder(count: number) {
    return {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(count),
    };
}

describe('CalendarService time blocks', () => {
    let service: CalendarService;
    let timeBlockRepository: jest.Mocked<Repository<TimeBlock>>;
    let appointmentRepository: jest.Mocked<Repository<Appointment>>;
    let userRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        timeBlockRepository = {
            create: jest.fn((payload) => payload as TimeBlock),
            save: jest.fn(async (entity) => ({ id: 1, ...entity }) as TimeBlock),
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<TimeBlock>>;
        appointmentRepository = {
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<Appointment>>;
        userRepository = {
            findOne: jest.fn(),
        } as unknown as jest.Mocked<Repository<User>>;

        service = new CalendarService(
            timeBlockRepository,
            appointmentRepository,
            userRepository,
            {} as Repository<Service>,
            {} as Repository<EmployeeService>,
            {} as Repository<Branch>,
            {} as Repository<Timetable>,
            {} as Repository<TimetableException>,
        );
    });

    it('rejects time blocks whose end is not after start', async () => {
        userRepository.findOne.mockResolvedValue({
            id: 7,
            role: Role.Employee,
        } as User);

        await expect(
            service.createTimeBlock(
                {
                    employeeId: 7,
                    startTime: '2026-06-08T11:00:00.000Z',
                    endTime: '2026-06-08T10:00:00.000Z',
                    type: TimeBlockType.Break,
                },
                { id: 1 } as User,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(timeBlockRepository.save).not.toHaveBeenCalled();
    });

    it('rejects time blocks assigned to non-employees', async () => {
        userRepository.findOne.mockResolvedValue({
            id: 9,
            role: Role.Client,
        } as User);

        await expect(
            service.createTimeBlock(
                {
                    employeeId: 9,
                    startTime: '2026-06-08T10:00:00.000Z',
                    endTime: '2026-06-08T11:00:00.000Z',
                    type: TimeBlockType.Break,
                },
                { id: 1 } as User,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(timeBlockRepository.save).not.toHaveBeenCalled();
    });

    it('rejects time blocks overlapping an existing appointment', async () => {
        userRepository.findOne.mockResolvedValue({
            id: 7,
            role: Role.Employee,
        } as User);
        (
            appointmentRepository as unknown as { createQueryBuilder: jest.Mock }
        ).createQueryBuilder.mockReturnValue(createCountQueryBuilder(1));
        (
            timeBlockRepository as unknown as { createQueryBuilder: jest.Mock }
        ).createQueryBuilder.mockReturnValue(createCountQueryBuilder(0));

        await expect(
            service.createTimeBlock(
                {
                    employeeId: 7,
                    startTime: '2026-06-08T10:00:00.000Z',
                    endTime: '2026-06-08T11:00:00.000Z',
                    type: TimeBlockType.Break,
                },
                { id: 1 } as User,
            ),
        ).rejects.toBeInstanceOf(ConflictException);

        expect(timeBlockRepository.save).not.toHaveBeenCalled();
    });
});

describe('CalendarService nearest slot (public teaser)', () => {
    function buildService(overrides: {
        service?: Partial<Service> | null;
        slots?: Array<{ time: string }>;
    }) {
        const serviceRepository = {
            findOne: jest.fn().mockResolvedValue(
                overrides.service === null
                    ? null
                    : ({ id: 1, duration: 30, isActive: true, ...overrides.service } as Service),
            ),
        } as unknown as Repository<Service>;

        const calendarService = new CalendarService(
            {} as Repository<TimeBlock>,
            {} as Repository<Appointment>,
            {} as Repository<User>,
            serviceRepository,
            {} as Repository<EmployeeService>,
            {} as Repository<Branch>,
            {} as Repository<Timetable>,
            {} as Repository<TimetableException>,
        );

        jest.spyOn(calendarService, 'getAvailableSlots').mockResolvedValue(
            (overrides.slots ?? []).map((s) => ({
                employeeId: 1,
                employeeName: 'X',
                time: s.time,
            })),
        );
        return calendarService;
    }

    it('returns null when no active service exists', async () => {
        const svc = buildService({ service: null, slots: [] });
        await expect(svc.getNearestSlot()).resolves.toEqual({ slot: null });
    });

    it('returns the earliest slot at least 1h in the future', async () => {
        const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const later = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
        const evenLater = new Date(
            Date.now() + 5 * 60 * 60 * 1000,
        ).toISOString();
        const svc = buildService({ slots: [{ time: evenLater }, { time: soon }, { time: later }] });

        const result = await svc.getNearestSlot();
        expect(result.slot).toBe(later);
    });

    it('caches the result between calls', async () => {
        const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const svc = buildService({ slots: [{ time: later }] });

        await svc.getNearestSlot();
        await svc.getNearestSlot();
        expect(
            (svc.getAvailableSlots as jest.Mock).mock.calls.length,
        ).toBe(1);
    });
});

describe('CalendarService working hours in available slots (L1)', () => {
    function emptyOverlapQueryBuilder() {
        return {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            leftJoin: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
        };
    }

    function buildHarness(options: {
        branch?: Partial<Branch> | null;
        timetable?: Partial<Timetable> | null;
        exception?: Partial<TimetableException> | null;
    }) {
        const serviceRepository = {
            findOne: jest
                .fn()
                .mockResolvedValue({ id: 1, duration: 60 } as Service),
        } as unknown as Repository<Service>;

        const employeeServiceRepository = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([
                    { employee: { id: 7, name: 'Aleksandra' } },
                ]),
            })),
        } as unknown as Repository<EmployeeService>;

        const appointmentRepository = {
            createQueryBuilder: jest.fn(emptyOverlapQueryBuilder),
        } as unknown as Repository<Appointment>;
        const timeBlockRepository = {
            createQueryBuilder: jest.fn(emptyOverlapQueryBuilder),
        } as unknown as Repository<TimeBlock>;

        const branchRepository = {
            findOne: jest
                .fn()
                .mockResolvedValue(
                    options.branch === null ? null : (options.branch as Branch),
                ),
        } as unknown as Repository<Branch>;

        const timetableRepository = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getOne: jest
                    .fn()
                    .mockResolvedValue(options.timetable ?? null),
            })),
        } as unknown as Repository<Timetable>;

        const timetableExceptionRepository = {
            findOne: jest.fn().mockResolvedValue(options.exception ?? null),
        } as unknown as Repository<TimetableException>;

        return new CalendarService(
            timeBlockRepository,
            appointmentRepository,
            {} as Repository<User>,
            serviceRepository,
            employeeServiceRepository,
            branchRepository,
            timetableRepository,
            timetableExceptionRepository,
        );
    }

    const branchMonSat = {
        id: 1,
        workingHours: {
            mon: { open: '10:00', close: '19:00' },
            tue: { open: '10:00', close: '19:00' },
            wed: { open: '10:00', close: '19:00' },
            thu: { open: '10:00', close: '19:00' },
            fri: { open: '10:00', close: '19:00' },
            sat: { open: '09:00', close: '15:00' },
            sun: null,
        },
    } as unknown as Branch;

    it('offers no slots on Sunday (salon closed)', async () => {
        const svc = buildHarness({ branch: branchMonSat });
        // 2026-06-14 is a Sunday
        const slots = await svc.getAvailableSlots(1, '2026-06-14');
        expect(slots).toEqual([]);
    });

    it('cuts Saturday to salon closing time', async () => {
        const svc = buildHarness({ branch: branchMonSat });
        // 2026-06-13 is a Saturday; hours 09:00-15:00, 60-min service
        const slots = await svc.getAvailableSlots(1, '2026-06-13');
        expect(slots.length).toBeGreaterThan(0);
        const first = new Date(slots[0].time);
        const last = new Date(slots[slots.length - 1].time);
        expect(first.getHours()).toBe(9);
        // last START must allow the service to END by 15:00
        expect(last.getHours() * 60 + last.getMinutes()).toBeLessThanOrEqual(
            14 * 60,
        );
    });

    it('offers no slots on a vacation exception day', async () => {
        const svc = buildHarness({
            branch: branchMonSat,
            timetable: { id: 5, slots: [] } as unknown as Timetable,
            exception: {
                type: ExceptionType.Vacation,
            } as TimetableException,
        });
        // 2026-06-12 is a Friday — salon open, employee on vacation
        const slots = await svc.getAvailableSlots(1, '2026-06-12');
        expect(slots).toEqual([]);
    });

    it('falls back to Mon-Sat 9-19 when no branch is configured (Sunday still closed)', async () => {
        const svc = buildHarness({ branch: null });
        const sunday = await svc.getAvailableSlots(1, '2026-06-14');
        expect(sunday).toEqual([]);
        const friday = await svc.getAvailableSlots(1, '2026-06-12');
        expect(friday.length).toBeGreaterThan(0);
        expect(new Date(friday[0].time).getHours()).toBe(9);
    });

    it('intersects employee timetable with salon hours', async () => {
        const svc = buildHarness({
            branch: branchMonSat,
            timetable: {
                id: 5,
                slots: [
                    {
                        // Friday = ISO index 4; employee works 12:00-16:00
                        dayOfWeek: 4,
                        startTime: '12:00',
                        endTime: '16:00',
                        isBreak: false,
                    },
                ],
            } as unknown as Timetable,
        });
        const slots = await svc.getAvailableSlots(1, '2026-06-12');
        expect(slots.length).toBeGreaterThan(0);
        const hours = slots.map((s) => new Date(s.time).getHours());
        expect(Math.min(...hours)).toBeGreaterThanOrEqual(12);
        const last = new Date(slots[slots.length - 1].time);
        expect(last.getHours() * 60 + last.getMinutes()).toBeLessThanOrEqual(
            15 * 60,
        );
    });
});
