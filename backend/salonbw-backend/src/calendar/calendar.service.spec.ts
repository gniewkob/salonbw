import { BadRequestException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { Service } from '../services/service.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Role } from '../users/role.enum';
import { User } from '../users/user.entity';
import { CalendarService } from './calendar.service';
import { TimeBlock, TimeBlockType } from './entities/time-block.entity';

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
