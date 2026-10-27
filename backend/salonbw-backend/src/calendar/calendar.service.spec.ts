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

/** Test wall-clock hours in the salon zone; never rely on the CI runner's TZ. */
function warsawWallMinutes(instant: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(instant);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value);
    return hour * 60 + minute;
}

describe('CalendarService time blocks', () => {
    let service: CalendarService;
    let timeBlockRepository: jest.Mocked<Repository<TimeBlock>>;
    let appointmentRepository: jest.Mocked<Repository<Appointment>>;
    let userRepository: jest.Mocked<Repository<User>>;

    beforeEach(() => {
        timeBlockRepository = {
            create: jest.fn((payload) => payload as TimeBlock),
            save: jest.fn(
                async (entity) => ({ id: 1, ...entity }) as TimeBlock,
            ),
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<TimeBlock>>;
        appointmentRepository = {
            createQueryBuilder: jest.fn(),
        } as unknown as jest.Mocked<Repository<Appointment>>;
        userRepository = {
            findOne: jest.fn(),
        } as unknown as jest.Mocked<Repository<User>>;

        // Repository operations inside a live transaction use the transaction
        // manager, not the normal repositories. Mirror that on the unit harness.
        const txManager = {
            connection: { options: { type: 'postgres' } },
            query: jest.fn().mockResolvedValue([{ id: 7 }]),
            getRepository: jest.fn((entity: unknown) => {
                if (entity === TimeBlock) return timeBlockRepository;
                if (entity === Appointment) return appointmentRepository;
                throw new Error('Unexpected transaction repository');
            }),
        };
        Object.defineProperty(timeBlockRepository, 'manager', {
            value: {
                transaction: jest.fn(
                    async (callback: (manager: typeof txManager) => Promise<unknown>) =>
                        callback(txManager),
                ),
            },
        });

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

    it('rejects a technical administrator as a time-block target', async () => {
        userRepository.findOne.mockResolvedValue({
            id: 7,
            role: Role.Admin,
            isSystemAdmin: true,
        } as User);
        (
            appointmentRepository as unknown as {
                createQueryBuilder: jest.Mock;
            }
        ).createQueryBuilder.mockReturnValue(createCountQueryBuilder(0));
        (
            timeBlockRepository as unknown as { createQueryBuilder: jest.Mock }
        ).createQueryBuilder.mockReturnValue(createCountQueryBuilder(0));
        await expect(
            service.createTimeBlock(
                {
                    employeeId: 7,
                    startTime: '2026-11-02T10:00:00.000Z',
                    endTime: '2026-11-02T11:00:00.000Z',
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
            appointmentRepository as unknown as {
                createQueryBuilder: jest.Mock;
            }
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
                    : ({
                          id: 1,
                          duration: 30,
                          isActive: true,
                          ...overrides.service,
                      } as Service),
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
        const svc = buildService({
            slots: [{ time: evenLater }, { time: soon }, { time: later }],
        });

        const result = await svc.getNearestSlot();
        expect(result.slot).toBe(later);
    });

    it('caches the result between calls', async () => {
        const later = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
        const svc = buildService({ slots: [{ time: later }] });

        await svc.getNearestSlot();
        await svc.getNearestSlot();
        expect((svc.getAvailableSlots as jest.Mock).mock.calls.length).toBe(1);
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
        service?: Partial<Service>;
        addonServices?: Service[];
    }) {
        const serviceRepository = {
            findOne: jest.fn().mockResolvedValue({
                id: 1,
                duration: 60,
                variants: [],
                ...options.service,
            } as Service),
            find: jest.fn().mockResolvedValue(options.addonServices ?? []),
        } as unknown as Repository<Service>;

        const employeeServiceRepository = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest
                    .fn()
                    .mockResolvedValue([
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
                getOne: jest.fn().mockResolvedValue(options.timetable ?? null),
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

    // Next future occurrence (>= tomorrow) of a JS weekday (Sun=0..Sat=6),
    // so these tests don't rot against hardcoded dates and the now+1h slot
    // floor never truncates a full future day.
    const pad = (n: number) => String(n).padStart(2, '0');
    const nextDow = (targetDow: number): string => {
        const d = new Date();
        do {
            d.setDate(d.getDate() + 1);
        } while (d.getDay() !== targetDow);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };

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
        const slots = await svc.getAvailableSlots(1, nextDow(0));
        expect(slots).toEqual([]);
    });

    it('cuts Saturday to salon closing time', async () => {
        const svc = buildHarness({ branch: branchMonSat });
        // 2026-06-13 is a Saturday; hours 09:00-15:00, 60-min service
        const slots = await svc.getAvailableSlots(1, nextDow(6));
        expect(slots.length).toBeGreaterThan(0);
        const first = new Date(slots[0].time);
        const last = new Date(slots[slots.length - 1].time);
        expect(warsawWallMinutes(first)).toBe(9 * 60);
        // last START must allow the service to END by 15:00
        expect(warsawWallMinutes(last)).toBeLessThanOrEqual(14 * 60);
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
        const slots = await svc.getAvailableSlots(1, nextDow(5));
        expect(slots).toEqual([]);
    });

    it('offers no slots when branch working hours are not configured', async () => {
        const svc = buildHarness({ branch: null });
        const sunday = await svc.getAvailableSlots(1, nextDow(0));
        expect(sunday).toEqual([]);
        const friday = await svc.getAvailableSlots(1, nextDow(5));
        expect(friday).toEqual([]);
    });

    it('employee timetable fully defines bookable hours (owner = salon)', async () => {
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
        const slots = await svc.getAvailableSlots(1, nextDow(5));
        expect(slots.length).toBeGreaterThan(0);
        const minutes = slots.map((s) =>
            warsawWallMinutes(new Date(s.time)),
        );
        expect(Math.min(...minutes)).toBeGreaterThanOrEqual(12 * 60);
        const last = new Date(slots[slots.length - 1].time);
        expect(warsawWallMinutes(last)).toBeLessThanOrEqual(15 * 60);
    });

    it('uses variant and add-on duration when offering online slots', async () => {
        const svc = buildHarness({
            branch: branchMonSat,
            service: {
                variants: [
                    {
                        id: 11,
                        serviceId: 1,
                        name: 'Długie włosy',
                        duration: 90,
                    },
                ],
            } as Partial<Service>,
            addonServices: [
                {
                    id: 2,
                    name: 'Pielęgnacja',
                    duration: 30,
                } as Service,
            ],
        });

        const slots = await svc.getAvailableSlots(
            1,
            nextDow(5),
            undefined,
            11,
            [2],
        );

        expect(slots.length).toBeGreaterThan(0);
        const last = new Date(slots[slots.length - 1].time);
        expect(warsawWallMinutes(last)).toBeLessThanOrEqual(17 * 60);
    });

    it('emits actual UTC instants for future summer Warsaw opening hours and accepts the same POST slot', async () => {
        const futureYear = new Date().getUTCFullYear() + 1;
        const day = `${futureYear}-06-15`;
        const daily = { open: '09:00', close: '10:00' };
        const workingHours = {
            mon: daily,
            tue: daily,
            wed: daily,
            thu: daily,
            fri: daily,
            sat: daily,
            sun: daily,
        };
        const svc = buildHarness({
            branch: { workingHours } as unknown as Branch,
            service: { duration: 30, isActive: true, onlineBooking: true },
        });
        const slots = await svc.getAvailableSlots(1, day, 7);
        expect(slots.map((slot) => slot.time)).toEqual([
            `${day}T07:00:00.000Z`,
            `${day}T07:30:00.000Z`,
        ]);
        for (const slot of slots) {
            await expect(
                svc.isAvailableSlot(1, new Date(slot.time), 7),
            ).resolves.toBe(true);
        }
    });

    it('does not create nonexistent spring hours and enumerates both autumn repeated hours', async () => {
        const year = new Date().getUTCFullYear() + 1;
        const lastSunday = (monthOneBased: number) => {
            const day = new Date(Date.UTC(year, monthOneBased, 0));
            day.setUTCDate(day.getUTCDate() - day.getUTCDay());
            return day.toISOString().slice(0, 10);
        };
        const daily = { open: '01:00', close: '05:00' };
        const workingHours = {
            mon: daily,
            tue: daily,
            wed: daily,
            thu: daily,
            fri: daily,
            sat: daily,
            sun: daily,
        };
        const svc = buildHarness({
            branch: { workingHours } as unknown as Branch,
            service: { duration: 30, isActive: true, onlineBooking: true },
        });
        const wallTime = (time: string) => {
            const parts = new Intl.DateTimeFormat('en-GB', {
                timeZone: 'Europe/Warsaw',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
            }).formatToParts(new Date(time));
            const hour = parts.find((p) => p.type === 'hour')?.value;
            const minute = parts.find((p) => p.type === 'minute')?.value;
            return `${hour}:${minute}`;
        };
        const spring = await svc.getAvailableSlots(1, lastSunday(3), 7);
        expect(spring.length).toBeGreaterThan(0);
        expect(spring.map((slot) => wallTime(slot.time))).not.toContain('02:30');

        const fall = await svc.getAvailableSlots(1, lastSunday(10), 7);
        expect(
            fall.filter((slot) => wallTime(slot.time) === '02:30'),
        ).toHaveLength(2);
        const uniqueInstants = new Set(fall.map((slot) => slot.time));
        expect(uniqueInstants.size).toBe(fall.length);
    });

    it('allows 180 elapsed minutes across the autumn fold when staff works 01:00–04:00', async () => {
        const year = new Date().getUTCFullYear() + 1;
        const day = new Date(Date.UTC(year, 10, 0));
        day.setUTCDate(day.getUTCDate() - day.getUTCDay());
        const date = day.toISOString().slice(0, 10);
        const daily = { open: '01:00', close: '04:00' };
        const svc = buildHarness({
            branch: {
                workingHours: {
                    mon: daily,
                    tue: daily,
                    wed: daily,
                    thu: daily,
                    fri: daily,
                    sat: daily,
                    sun: daily,
                },
            } as unknown as Branch,
            service: { duration: 180, isActive: true, onlineBooking: true },
        });
        const slots = await svc.getAvailableSlots(1, date, 7);
        expect(slots.map((s) => s.time)).toContain(
            `${date}T00:00:00.000Z`,
        );
    });

    it('rejects a 60-minute appointment crossing the nonworking fold segment', async () => {
        const year = new Date().getUTCFullYear() + 1;
        const day = new Date(Date.UTC(year, 10, 0));
        day.setUTCDate(day.getUTCDate() - day.getUTCDay());
        const date = day.toISOString().slice(0, 10);
        const daily = { open: '02:30', close: '04:00' };
        const svc = buildHarness({
            branch: {
                workingHours: {
                    mon: daily,
                    tue: daily,
                    wed: daily,
                    thu: daily,
                    fri: daily,
                    sat: daily,
                    sun: daily,
                },
            } as unknown as Branch,
            service: { duration: 60, isActive: true, onlineBooking: true },
        });
        const slots = await svc.getAvailableSlots(1, date, 7);
        const instants = slots.map((slot) => slot.time);
        expect(instants).not.toContain(`${date}T00:30:00.000Z`);
        expect(instants).toContain(`${date}T01:30:00.000Z`);
    });

    it('a scheduled Sunday is bookable even though branch hours say closed', async () => {
        const svc = buildHarness({
            branch: branchMonSat,
            timetable: {
                id: 5,
                slots: [
                    {
                        // Sunday = ISO index 6; owner decided to work 10-14
                        dayOfWeek: 6,
                        startTime: '10:00',
                        endTime: '14:00',
                        isBreak: false,
                    },
                ],
            } as unknown as Timetable,
        });
        // 2026-06-14 is a Sunday
        const slots = await svc.getAvailableSlots(1, nextDow(0));
        expect(slots.length).toBeGreaterThan(0);
        expect(warsawWallMinutes(new Date(slots[0].time))).toBe(10 * 60);
    });
});

describe('CalendarService public opening hours', () => {
    function buildHarness(options: {
        timetables: Array<Partial<Timetable>>;
        branch?: Partial<Branch> | null;
    }) {
        const timetableRepository = {
            createQueryBuilder: jest.fn(() => ({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(options.timetables),
                getOne: jest.fn().mockResolvedValue(null),
            })),
        } as unknown as Repository<Timetable>;
        const branchRepository = {
            findOne: jest
                .fn()
                .mockResolvedValue(
                    options.branch === undefined || options.branch === null
                        ? null
                        : (options.branch as Branch),
                ),
        } as unknown as Repository<Branch>;

        return new CalendarService(
            {} as Repository<TimeBlock>,
            {} as Repository<Appointment>,
            {} as Repository<User>,
            {} as Repository<Service>,
            {} as Repository<EmployeeService>,
            branchRepository,
            timetableRepository,
            {} as Repository<TimetableException>,
        );
    }

    it('derives weekly hours from active timetables (union, breaks excluded)', async () => {
        const svc = buildHarness({
            timetables: [
                {
                    id: 1,
                    slots: [
                        {
                            dayOfWeek: 0,
                            startTime: '10:00',
                            endTime: '14:00',
                            isBreak: false,
                        },
                        {
                            dayOfWeek: 0,
                            startTime: '13:00',
                            endTime: '18:00',
                            isBreak: false,
                        },
                        {
                            dayOfWeek: 0,
                            startTime: '12:00',
                            endTime: '12:30',
                            isBreak: true,
                        },
                        {
                            dayOfWeek: 5,
                            startTime: '09:00',
                            endTime: '15:00',
                            isBreak: false,
                        },
                    ],
                } as unknown as Timetable,
            ],
        });
        const result = await svc.getOpeningHours();
        expect(result.source).toBe('timetables');
        // Monday: two overlapping work ranges merged 10-18; break ignored
        expect(result.hours.mon).toEqual([{ open: '10:00', close: '18:00' }]);
        expect(result.hours.sat).toEqual([{ open: '09:00', close: '15:00' }]);
        expect(result.hours.sun).toEqual([]);
    });

    it('falls back to branch hours when no timetable has slots', async () => {
        const svc = buildHarness({
            timetables: [],
            branch: {
                workingHours: {
                    mon: { open: '10:00', close: '19:00' },
                    sun: null,
                },
            } as unknown as Branch,
        });
        const result = await svc.getOpeningHours();
        expect(result.source).toBe('branch');
        expect(result.hours.mon).toEqual([{ open: '10:00', close: '19:00' }]);
        expect(result.hours.sun).toEqual([]);
    });

    it('returns explicit empty hours when neither timetable nor branch hours are configured', async () => {
        const svc = buildHarness({ timetables: [], branch: null });
        const result = await svc.getOpeningHours();
        expect(result.source).toBe('default');
        expect(result.hours).toEqual({
            mon: [],
            tue: [],
            wed: [],
            thu: [],
            fri: [],
            sat: [],
            sun: [],
        });
    });
});

describe('CalendarService online slot revalidation', () => {
    it('compares exact employee and instant using the Warsaw calendar date', async () => {
        const calendar = Object.create(CalendarService.prototype) as CalendarService;
        const getter = jest
            .spyOn(calendar, 'getAvailableSlots')
            .mockResolvedValue([
                {
                    employeeId: 7,
                    employeeName: 'Salon',
                    time: '2026-03-29T01:30:00.000Z',
                },
            ]);
        const instant = new Date('2026-03-29T01:30:00.000Z');
        await expect(calendar.isAvailableSlot(15, instant, 7)).resolves.toBe(
            true,
        );
        expect(getter).toHaveBeenCalledWith(15, '2026-03-29', 7, undefined, [], undefined);
        await expect(calendar.isAvailableSlot(15, instant, 8)).resolves.toBe(
            false,
        );
        await expect(
            calendar.isAvailableSlot(
                15,
                new Date('2026-03-29T01:31:00.000Z'),
                7,
            ),
        ).resolves.toBe(false);
    });

    it('selects the local Warsaw day across the autumn clock change', async () => {
        const calendar = Object.create(CalendarService.prototype) as CalendarService;
        const getter = jest
            .spyOn(calendar, 'getAvailableSlots')
            .mockResolvedValue([]);
        await calendar.isAvailableSlot(
            15,
            new Date('2026-10-25T23:30:00.000Z'),
            7,
        );
        expect(getter).toHaveBeenCalledWith(15, '2026-10-26', 7, undefined, [], undefined);
    });
});
