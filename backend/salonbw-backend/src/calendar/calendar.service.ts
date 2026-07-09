import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addMinutes,
    addDays,
    format,
} from 'date-fns';
import { TimeBlock } from './entities/time-block.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { Service } from '../services/service.entity';
import { EmployeeService } from '../services/entities/employee-service.entity';
import { Branch, BranchStatus } from '../branches/entities/branch.entity';
import { Timetable } from '../timetables/entities/timetable.entity';
import { DayOfWeek } from '../timetables/entities/timetable-slot.entity';
import {
    TimetableException,
    ExceptionType,
} from '../timetables/entities/timetable-exception.entity';
import { User } from '../users/user.entity';
import { Role } from '../users/role.enum';
import { CalendarView } from './dto/calendar-query.dto';
import {
    CreateTimeBlockDto,
    UpdateTimeBlockDto,
} from './dto/create-time-block.dto';

export interface CalendarEvent {
    id: number;
    type: 'appointment' | 'time_block';
    title: string;
    startTime: Date;
    endTime: Date;
    employeeId: number;
    employeeName: string;
    clientId?: number;
    clientName?: string;
    serviceId?: number;
    serviceName?: string;
    status?: string;
    paidAmount?: number;
    paymentMethod?: string;
    blockType?: string;
    notes?: string;
    clientComment?: string | null;
    staffRecommendations?: string | null;
    onlineAddonsSummary?: string | null;
    onlineTotalDurationMinutes?: number | null;
    onlineDurationNeedsVerification?: boolean;
    allDay?: boolean;
    extraServices?: Array<{
        serviceId: number;
        name: string;
        priceCents: number;
        discountCents: number;
    }>;
}

export interface CalendarData {
    events: CalendarEvent[];
    employees: Array<{ id: number; name: string; color?: string }>;
    dateRange: { start: Date; end: Date };
}

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(TimeBlock)
        private readonly timeBlockRepository: Repository<TimeBlock>,
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Service)
        private readonly serviceRepository: Repository<Service>,
        @InjectRepository(EmployeeService)
        private readonly employeeServiceRepository: Repository<EmployeeService>,
        @InjectRepository(Branch)
        private readonly branchRepository: Repository<Branch>,
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
        @InjectRepository(TimetableException)
        private readonly timetableExceptionRepository: Repository<TimetableException>,
    ) {}

    async getCalendarData(
        date: Date,
        view: CalendarView,
        employeeIds?: number[],
    ): Promise<CalendarData> {
        const { start, end } = this.getDateRange(date, view);

        const [appointments, timeBlocks, employees] = await Promise.all([
            this.findAppointmentsOverlappingRange(start, end, employeeIds),
            this.findTimeBlocksOverlappingRange(start, end, employeeIds),
            this.getEmployees(employeeIds),
        ]);

        const events: CalendarEvent[] = [
            ...appointments.map((apt) => this.mapAppointmentToEvent(apt)),
            ...timeBlocks.map((block) => this.mapTimeBlockToEvent(block)),
        ];

        events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return {
            events,
            employees: employees.map((e) => ({
                id: e.id,
                name: e.name,
                color: undefined,
            })),
            dateRange: { start, end },
        };
    }

    async getTimeBlocks(
        from: Date,
        to: Date,
        employeeId?: number,
    ): Promise<TimeBlock[]> {
        return this.findTimeBlocksOverlappingRange(
            from,
            to,
            employeeId ? [employeeId] : undefined,
        );
    }

    async createTimeBlock(
        dto: CreateTimeBlockDto,
        _createdBy: User,
    ): Promise<TimeBlock> {
        const employee = await this.userRepository.findOne({
            where: { id: dto.employeeId },
        });

        if (!employee) {
            throw new NotFoundException(
                `Employee with ID ${dto.employeeId} not found`,
            );
        }

        // Role ≠ bookability (see appointment-employee-role-vs-bookability):
        // the owner-stylist is role=admin, so requiring role===Employee made
        // it impossible to add her own breaks/vacations. Only clients are
        // invalid targets for time blocks.
        if (employee.role === Role.Client) {
            throw new BadRequestException(
                'Time blocks can only target staff members',
            );
        }

        const startTime = new Date(dto.startTime);
        const endTime = new Date(dto.endTime);
        await this.assertTimeBlockCanBeSaved(employee.id, startTime, endTime);

        const timeBlock = this.timeBlockRepository.create({
            employee,
            startTime,
            endTime,
            type: dto.type,
            title: dto.title,
            notes: dto.notes,
            allDay: dto.allDay ?? false,
        });

        return this.timeBlockRepository.save(timeBlock);
    }

    async updateTimeBlock(
        id: number,
        dto: UpdateTimeBlockDto,
    ): Promise<TimeBlock> {
        const timeBlock = await this.timeBlockRepository.findOne({
            where: { id },
            relations: ['employee'],
        });

        if (!timeBlock) {
            throw new NotFoundException(`TimeBlock with ID ${id} not found`);
        }

        const startTime = dto.startTime
            ? new Date(dto.startTime)
            : new Date(timeBlock.startTime);
        const endTime = dto.endTime
            ? new Date(dto.endTime)
            : new Date(timeBlock.endTime);
        await this.assertTimeBlockCanBeSaved(
            timeBlock.employee.id,
            startTime,
            endTime,
            id,
        );

        if (dto.startTime) {
            timeBlock.startTime = startTime;
        }
        if (dto.endTime) {
            timeBlock.endTime = endTime;
        }
        if (dto.type) {
            timeBlock.type = dto.type;
        }
        if (dto.title !== undefined) {
            timeBlock.title = dto.title;
        }
        if (dto.notes !== undefined) {
            timeBlock.notes = dto.notes;
        }
        if (dto.allDay !== undefined) {
            timeBlock.allDay = dto.allDay;
        }

        return this.timeBlockRepository.save(timeBlock);
    }

    async deleteTimeBlock(id: number): Promise<void> {
        const result = await this.timeBlockRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`TimeBlock with ID ${id} not found`);
        }
    }

    async findTimeBlockById(id: number): Promise<TimeBlock | null> {
        return this.timeBlockRepository.findOne({
            where: { id },
            relations: ['employee'],
        });
    }

    async checkConflicts(
        employeeId: number,
        startTime: Date,
        endTime: Date,
        excludeAppointmentId?: number,
    ): Promise<{ hasConflict: boolean; conflictingEvents: CalendarEvent[] }> {
        const appointments = await this.appointmentRepository
            .createQueryBuilder('apt')
            .leftJoinAndSelect('apt.employee', 'employee')
            .leftJoinAndSelect('apt.client', 'client')
            .leftJoinAndSelect('apt.service', 'service')
            .where('employee.id = :employeeId', { employeeId })
            .andWhere('apt.status != :cancelled', { cancelled: 'cancelled' })
            .andWhere(
                '(apt.startTime < :endTime AND apt.endTime > :startTime)',
                { startTime, endTime },
            )
            .getMany();

        const filteredAppointments = excludeAppointmentId
            ? appointments.filter((a) => a.id !== excludeAppointmentId)
            : appointments;

        const timeBlocks = await this.timeBlockRepository
            .createQueryBuilder('tb')
            .leftJoinAndSelect('tb.employee', 'employee')
            .where('employee.id = :employeeId', { employeeId })
            .andWhere('(tb.startTime < :endTime AND tb.endTime > :startTime)', {
                startTime,
                endTime,
            })
            .getMany();

        const conflictingEvents: CalendarEvent[] = [
            ...filteredAppointments.map((apt) =>
                this.mapAppointmentToEvent(apt),
            ),
            ...timeBlocks.map((block) => this.mapTimeBlockToEvent(block)),
        ];

        return {
            hasConflict: conflictingEvents.length > 0,
            conflictingEvents,
        };
    }

    private async findAppointmentsOverlappingRange(
        start: Date,
        end: Date,
        employeeIds?: number[],
    ): Promise<Appointment[]> {
        let query = this.appointmentRepository
            .createQueryBuilder('apt')
            .leftJoinAndSelect('apt.employee', 'employee')
            .leftJoinAndSelect('apt.client', 'client')
            .leftJoinAndSelect('apt.service', 'service')
            .where('apt.startTime < :end', { end })
            .andWhere('apt.endTime > :start', { start })
            .orderBy('apt.startTime', 'ASC');

        if (employeeIds && employeeIds.length > 0) {
            query = query.andWhere('employee.id IN (:...employeeIds)', {
                employeeIds,
            });
        }

        return query.getMany();
    }

    private async findTimeBlocksOverlappingRange(
        start: Date,
        end: Date,
        employeeIds?: number[],
    ): Promise<TimeBlock[]> {
        let query = this.timeBlockRepository
            .createQueryBuilder('tb')
            .leftJoinAndSelect('tb.employee', 'employee')
            .where('tb.startTime < :end', { end })
            .andWhere('tb.endTime > :start', { start })
            .orderBy('tb.startTime', 'ASC');

        if (employeeIds && employeeIds.length > 0) {
            query = query.andWhere('employee.id IN (:...employeeIds)', {
                employeeIds,
            });
        }

        return query.getMany();
    }

    private async assertTimeBlockCanBeSaved(
        employeeId: number,
        startTime: Date,
        endTime: Date,
        excludedTimeBlockId?: number,
    ): Promise<void> {
        if (
            Number.isNaN(startTime.getTime()) ||
            Number.isNaN(endTime.getTime())
        ) {
            throw new BadRequestException('Invalid time block date range');
        }

        if (endTime <= startTime) {
            throw new BadRequestException('End time must be after start time');
        }

        const appointmentConflictCount = await this.appointmentRepository
            .createQueryBuilder('apt')
            .leftJoin('apt.employee', 'employee')
            .where('employee.id = :employeeId', { employeeId })
            .andWhere('apt.status != :cancelled', {
                cancelled: AppointmentStatus.Cancelled,
            })
            .andWhere('apt.startTime < :endTime', { endTime })
            .andWhere('apt.endTime > :startTime', { startTime })
            .getCount();

        if (appointmentConflictCount > 0) {
            throw new ConflictException(
                'Time block overlaps an existing appointment',
            );
        }

        let timeBlockQuery = this.timeBlockRepository
            .createQueryBuilder('tb')
            .leftJoin('tb.employee', 'employee')
            .where('employee.id = :employeeId', { employeeId })
            .andWhere('tb.startTime < :endTime', { endTime })
            .andWhere('tb.endTime > :startTime', { startTime });

        if (excludedTimeBlockId) {
            timeBlockQuery = timeBlockQuery.andWhere('tb.id != :excludedId', {
                excludedId: excludedTimeBlockId,
            });
        }

        const timeBlockConflictCount = await timeBlockQuery.getCount();
        if (timeBlockConflictCount > 0) {
            throw new ConflictException(
                'Time block overlaps an existing time block',
            );
        }
    }

    /**
     * Publicly exposable "nearest bookable slot" teaser. Returns a single
     * timestamp (or null) — deliberately no employee/service detail, so the
     * unauthenticated landing page can show "najbliższy wolny termin"
     * without leaking schedule internals. Cached in-process for 2 minutes
     * because the landing calls this on every visit.
     */
    private nearestSlotCache: {
        value: string | null;
        expiresAt: number;
    } | null = null;

    async getNearestSlot(): Promise<{ slot: string | null }> {
        const now = Date.now();
        if (this.nearestSlotCache && this.nearestSlotCache.expiresAt > now) {
            return { slot: this.nearestSlotCache.value };
        }

        let result: string | null = null;
        // Shortest active service is the most likely to fit a gap, which
        // makes the teaser honest: if nothing fits this one, nothing fits.
        const service = await this.serviceRepository.findOne({
            where: { isActive: true },
            order: { duration: 'ASC' },
        });

        if (service) {
            // Don't advertise slots starting sooner than visitors could
            // realistically arrive.
            const minStart = now + 60 * 60 * 1000;
            const SCAN_DAYS = 14;
            for (let offset = 0; offset < SCAN_DAYS && !result; offset++) {
                const date = format(
                    addDays(new Date(now), offset),
                    'yyyy-MM-dd',
                );
                let slots: Array<{ time: string }>;
                try {
                    slots = await this.getAvailableSlots(service.id, date);
                } catch {
                    break;
                }
                const earliest = slots
                    .map((s) => new Date(s.time).getTime())
                    .filter((t) => t >= minStart)
                    .sort((a, b) => a - b)[0];
                if (earliest) {
                    result = new Date(earliest).toISOString();
                }
            }
        }

        this.nearestSlotCache = { value: result, expiresAt: now + 120_000 };
        return { slot: result };
    }

    async getAvailableSlots(
        serviceId: number,
        date: string,
        employeeId?: number,
        serviceVariantId?: number,
        addonServiceIds: number[] = [],
    ): Promise<
        Array<{
            employeeId: number;
            employeeName: string;
            time: string;
        }>
    > {
        const service = await this.serviceRepository.findOne({
            where: { id: serviceId },
            relations: ['variants'],
        });
        if (!service) {
            throw new NotFoundException(
                `Service with ID ${serviceId} not found`,
            );
        }

        const variant = serviceVariantId
            ? service.variants?.find((item) => item.id === serviceVariantId)
            : undefined;
        if (serviceVariantId && !variant) {
            throw new BadRequestException('Invalid serviceVariantId');
        }
        const uniqueAddonIds = Array.from(new Set(addonServiceIds));
        if (uniqueAddonIds.length > 5) {
            throw new BadRequestException('Too many add-on services');
        }
        const addonServices =
            uniqueAddonIds.length > 0
                ? await this.serviceRepository.find({
                      where: {
                          id: In(uniqueAddonIds),
                          isActive: true,
                          onlineBooking: true,
                      },
                  })
                : [];
        if (addonServices.length !== uniqueAddonIds.length) {
            throw new BadRequestException('Invalid addonServiceIds');
        }
        const duration =
            (variant?.duration ?? service.duration) +
            addonServices.reduce((sum, addon) => sum + addon.duration, 0);

        // Find employees that offer this service
        let employeeServiceQuery = this.employeeServiceRepository
            .createQueryBuilder('es')
            .leftJoinAndSelect('es.employee', 'employee')
            .where('es.serviceId = :serviceId', { serviceId })
            .andWhere('es.isActive = true');

        if (serviceVariantId) {
            employeeServiceQuery = employeeServiceQuery.andWhere(
                '(es.serviceVariantId = :serviceVariantId OR es.serviceVariantId IS NULL)',
                { serviceVariantId },
            );
        }

        if (employeeId) {
            employeeServiceQuery = employeeServiceQuery.andWhere(
                'es.employeeId = :employeeId',
                { employeeId },
            );
        }

        const employeeServices = await employeeServiceQuery.getMany();

        // Collect employees to check: from service assignments, or all employees as fallback
        let candidateEmployees: User[];
        if (employeeServices.length > 0) {
            const uniqueEmployees = new Map<number, User>();
            employeeServices
                .map((es) => es.employee)
                .filter((e): e is User => !!e)
                .forEach((employee) =>
                    uniqueEmployees.set(employee.id, employee),
                );
            candidateEmployees = Array.from(uniqueEmployees.values());
        } else {
            candidateEmployees = await this.userRepository.find({
                where: { role: 'employee' as never },
            });
        }

        const dayStart = new Date(`${date}T00:00:00`);
        const dayEnd = endOfDay(dayStart);

        const SLOT_STEP = 30;
        // Don't offer slots in the past for the current day. The appointment
        // POST rejects past startTimes ("must be in the future"), so a slot
        // the wizard shows but the API refuses is a broken UX. Mirror the
        // nearest-slot +1h lead so a client can't pick something starting in
        // a few minutes either.
        const minStartMs = Date.now() + 60 * 60 * 1000;
        const branchRanges = await this.getBranchDayRanges(dayStart);

        const slots: Array<{
            employeeId: number;
            employeeName: string;
            time: string;
        }> = [];

        for (const emp of candidateEmployees) {
            if (!emp) continue;

            // Owner decision (2026-06-10): the employee's calendar IS the
            // salon's calendar. A timetable, when present, fully defines
            // bookable hours (so a scheduled Sunday is bookable even though
            // branch hours say closed). Branch hours apply only to
            // employees without a timetable.
            const employeeRanges = await this.getEmployeeDayRanges(
                emp.id,
                dayStart,
            );
            const workRanges =
                employeeRanges === null ? branchRanges : employeeRanges;
            if (workRanges.length === 0) continue;

            const [appointments, timeBlocks] = await Promise.all([
                this.findAppointmentsOverlappingRange(
                    startOfDay(dayStart),
                    dayEnd,
                    [emp.id],
                ),
                this.findTimeBlocksOverlappingRange(
                    startOfDay(dayStart),
                    dayEnd,
                    [emp.id],
                ),
            ]);

            const busyRanges = [
                ...appointments
                    .filter((a) => a.status !== AppointmentStatus.Cancelled)
                    .map((a) => ({
                        start: new Date(a.startTime).getTime(),
                        end: new Date(a.endTime).getTime(),
                    })),
                ...timeBlocks.map((tb) => ({
                    start: new Date(tb.startTime).getTime(),
                    end: new Date(tb.endTime).getTime(),
                })),
            ];

            for (const range of workRanges) {
                let minuteOffset = range.start;
                while (minuteOffset + duration <= range.end) {
                    const slotStart = addMinutes(
                        startOfDay(dayStart),
                        minuteOffset,
                    );
                    const slotEnd = addMinutes(slotStart, duration);

                    const isBusy = busyRanges.some(
                        (r) =>
                            slotStart.getTime() < r.end &&
                            slotEnd.getTime() > r.start,
                    );

                    if (!isBusy && slotStart.getTime() >= minStartMs) {
                        slots.push({
                            employeeId: emp.id,
                            employeeName: emp.name,
                            time: slotStart.toISOString(),
                        });
                    }

                    minuteOffset += SLOT_STEP;
                }
            }
        }

        slots.sort((a, b) => a.time.localeCompare(b.time));
        return slots;
    }

    // ---- Working-hours resolution (branch ∩ employee timetable) ----

    /** Minutes from local midnight; end exclusive. */
    private static readonly DAY_KEYS = [
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
        'sat',
        'sun',
    ] as const;

    private parseTimeToMinutes(value: string): number | null {
        const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
        if (!match) return null;
        const minutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
        return minutes >= 0 && minutes <= 24 * 60 ? minutes : null;
    }

    private toMinuteRanges(
        raw: Array<{
            start?: string;
            end?: string;
            open?: string;
            close?: string;
        }>,
    ): Array<{ start: number; end: number }> {
        const ranges: Array<{ start: number; end: number }> = [];
        for (const item of raw) {
            const start = this.parseTimeToMinutes(
                item.open ?? item.start ?? '',
            );
            const end = this.parseTimeToMinutes(item.close ?? item.end ?? '');
            if (start !== null && end !== null && end > start) {
                ranges.push({ start, end });
            }
        }
        return ranges.sort((a, b) => a.start - b.start);
    }

    /**
     * Salon opening hours for the given local date. Empty array = closed.
     * No branch configured at all → legacy fallback 09:00–19:00 Mon–Sat,
     * closed Sunday, so a missing settings row degrades gracefully instead
     * of offering Sunday slots (the original hardcoded-hours bug).
     */
    private async getBranchDayRanges(
        day: Date,
    ): Promise<Array<{ start: number; end: number }>> {
        // ISO: Monday=0 … Sunday=6 (JS getDay: Sunday=0)
        const isoIndex = (day.getDay() + 6) % 7;
        const key = CalendarService.DAY_KEYS[isoIndex];

        const branch = await this.branchRepository.findOne({
            where: { status: BranchStatus.Active },
            order: { id: 'ASC' },
        });

        const value = branch?.workingHours?.[key];
        if (branch && branch.workingHours) {
            if (!value) return [];
            return this.toMinuteRanges(Array.isArray(value) ? value : [value]);
        }

        return isoIndex === 6 ? [] : [{ start: 9 * 60, end: 19 * 60 }];
    }

    /**
     * Employee working ranges for the given local date from their active
     * timetable. Returns null when no timetable applies (caller falls back
     * to salon hours); [] when the timetable says "not working" (free day
     * or a day-off/vacation exception).
     */
    private async getEmployeeDayRanges(
        employeeId: number,
        day: Date,
    ): Promise<Array<{ start: number; end: number }> | null> {
        const dateStr = format(day, 'yyyy-MM-dd');
        const timetable = await this.timetableRepository
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.slots', 'slot')
            .where('t.employeeId = :employeeId', { employeeId })
            .andWhere('t.isActive = true')
            .andWhere('t.validFrom <= :date', { date: dateStr })
            .andWhere('(t.validTo IS NULL OR t.validTo >= :date)', {
                date: dateStr,
            })
            .orderBy('t.validFrom', 'DESC')
            .getOne();

        if (!timetable) return null;

        const exception = await this.timetableExceptionRepository.findOne({
            where: { timetableId: timetable.id, date: dateStr as never },
        });
        if (exception) {
            if (
                exception.type === ExceptionType.CustomHours &&
                exception.customStartTime &&
                exception.customEndTime
            ) {
                return this.toMinuteRanges([
                    {
                        start: exception.customStartTime,
                        end: exception.customEndTime,
                    },
                ]);
            }
            // Day off / vacation / sick leave / training / other → not working.
            return [];
        }

        const isoIndex = ((day.getDay() + 6) % 7) as DayOfWeek;
        const working = (timetable.slots ?? []).filter(
            (s) => s.dayOfWeek === isoIndex && !s.isBreak,
        );
        const breaks = (timetable.slots ?? []).filter(
            (s) => s.dayOfWeek === isoIndex && s.isBreak,
        );

        let ranges = this.toMinuteRanges(
            working.map((s) => ({ start: s.startTime, end: s.endTime })),
        );
        for (const brk of this.toMinuteRanges(
            breaks.map((s) => ({ start: s.startTime, end: s.endTime })),
        )) {
            ranges = this.subtractMinuteRange(ranges, brk);
        }
        return ranges;
    }

    /** Union of possibly-overlapping ranges, merged and sorted. */
    private mergeMinuteRanges(
        ranges: Array<{ start: number; end: number }>,
    ): Array<{ start: number; end: number }> {
        const sorted = [...ranges].sort((a, b) => a.start - b.start);
        const out: Array<{ start: number; end: number }> = [];
        for (const r of sorted) {
            const last = out[out.length - 1];
            if (last && r.start <= last.end) {
                last.end = Math.max(last.end, r.end);
            } else {
                out.push({ ...r });
            }
        }
        return out;
    }

    private minutesToTime(minutes: number): string {
        const h = Math.floor(minutes / 60)
            .toString()
            .padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    private openingHoursCache: {
        value: {
            source: 'timetables' | 'branch' | 'default';
            hours: Record<string, Array<{ open: string; close: string }>>;
        };
        expiresAt: number;
    } | null = null;

    /**
     * Public weekly opening hours. Owner decision (2026-06-10): the salon's
     * hours follow the employees' timetables — the owner-employee manages
     * her own calendar and that IS when the salon is open. Union across all
     * active timetables; branch.workingHours only when no timetable exists;
     * hardcoded default as the last resort. No employee data in the output.
     */
    async getOpeningHours(): Promise<{
        source: 'timetables' | 'branch' | 'default';
        hours: Record<string, Array<{ open: string; close: string }>>;
    }> {
        const now = Date.now();
        if (this.openingHoursCache && this.openingHoursCache.expiresAt > now) {
            return this.openingHoursCache.value;
        }

        const today = format(new Date(now), 'yyyy-MM-dd');
        const timetables = await this.timetableRepository
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.slots', 'slot')
            .where('t.isActive = true')
            .andWhere('t.validFrom <= :date', { date: today })
            .andWhere('(t.validTo IS NULL OR t.validTo >= :date)', {
                date: today,
            })
            // Only count the schedules of staff who actually take online
            // bookings (have an active service with onlineBooking=true), so a
            // non-bookable / test employee's timetable can't widen the public
            // hours. If nobody qualifies the result is empty and we fall back
            // to branch/default hours below.
            .andWhere(
                `t."employeeId" IN (
                    SELECT es."employeeId"
                    FROM "employee_services" es
                    JOIN "services" s ON s."id" = es."serviceId"
                    WHERE es."isActive" = true
                      AND s."isActive" = true
                      AND s."onlineBooking" = true
                )`,
            )
            .getMany();

        let source: 'timetables' | 'branch' | 'default' = 'default';
        const hours: Record<
            string,
            Array<{ open: string; close: string }>
        > = {};

        const hasTimetableSlots = timetables.some((t) =>
            (t.slots ?? []).some((sl) => !sl.isBreak),
        );

        if (hasTimetableSlots) {
            source = 'timetables';
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                const key = CalendarService.DAY_KEYS[dayIdx];
                const dayRanges = timetables.flatMap((t) =>
                    this.toMinuteRanges(
                        (t.slots ?? [])
                            .filter(
                                (sl) =>
                                    sl.dayOfWeek === (dayIdx as DayOfWeek) &&
                                    !sl.isBreak,
                            )
                            .map((sl) => ({
                                start: sl.startTime,
                                end: sl.endTime,
                            })),
                    ),
                );
                hours[key] = this.mergeMinuteRanges(dayRanges).map((r) => ({
                    open: this.minutesToTime(r.start),
                    close: this.minutesToTime(r.end),
                }));
            }
        } else {
            const branch = await this.branchRepository.findOne({
                where: { status: BranchStatus.Active },
                order: { id: 'ASC' },
            });
            if (branch?.workingHours) {
                source = 'branch';
                for (const key of CalendarService.DAY_KEYS) {
                    const value = branch.workingHours[key];
                    hours[key] = value
                        ? this.toMinuteRanges(
                              Array.isArray(value) ? value : [value],
                          ).map((r) => ({
                              open: this.minutesToTime(r.start),
                              close: this.minutesToTime(r.end),
                          }))
                        : [];
                }
            } else {
                for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                    const key = CalendarService.DAY_KEYS[dayIdx];
                    hours[key] =
                        dayIdx === 6 ? [] : [{ open: '09:00', close: '19:00' }];
                }
            }
        }

        const value = { source, hours };
        this.openingHoursCache = { value, expiresAt: now + 300_000 };
        return value;
    }

    private subtractMinuteRange(
        ranges: Array<{ start: number; end: number }>,
        cut: { start: number; end: number },
    ): Array<{ start: number; end: number }> {
        const out: Array<{ start: number; end: number }> = [];
        for (const r of ranges) {
            if (cut.end <= r.start || cut.start >= r.end) {
                out.push(r);
                continue;
            }
            if (cut.start > r.start)
                out.push({ start: r.start, end: cut.start });
            if (cut.end < r.end) out.push({ start: cut.end, end: r.end });
        }
        return out;
    }

    private getDateRange(
        date: Date,
        view: CalendarView,
    ): { start: Date; end: Date } {
        switch (view) {
            case CalendarView.Day:
            case CalendarView.Reception:
                return {
                    start: startOfDay(date),
                    end: endOfDay(date),
                };
            case CalendarView.Week:
                return {
                    start: startOfWeek(date, { weekStartsOn: 1 }),
                    end: endOfWeek(date, { weekStartsOn: 1 }),
                };
            case CalendarView.Month: {
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                return {
                    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
                    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
                };
            }
        }
    }

    private async getEmployees(employeeIds?: number[]): Promise<User[]> {
        const whereConditions: Record<string, unknown> = {
            role: In(['employee']),
        };

        if (employeeIds && employeeIds.length > 0) {
            whereConditions.id = In(employeeIds);
        }

        return this.userRepository.find({
            where: whereConditions,
            order: { name: 'ASC' },
        });
    }

    private mapAppointmentToEvent(apt: Appointment): CalendarEvent {
        return {
            id: apt.id,
            type: 'appointment',
            title: apt.service?.name ?? 'Wizyta',
            startTime: apt.startTime,
            endTime: apt.endTime,
            employeeId: apt.employee?.id ?? 0,
            employeeName: apt.employee?.name ?? '',
            clientId: apt.client?.id,
            clientName: apt.client?.name,
            serviceId: apt.service?.id,
            serviceName: apt.service?.name,
            status: apt.status,
            // Decimal columns come back from the driver as strings — coerce so
            // the event carries a real number (the panel calls .toFixed on it).
            paidAmount:
                apt.paidAmount != null ? Number(apt.paidAmount) : undefined,
            paymentMethod: apt.paymentMethod,
            clientComment: apt.clientComment ?? null,
            staffRecommendations: apt.staffRecommendations ?? null,
            onlineAddonsSummary: apt.onlineAddonsSummary ?? null,
            onlineTotalDurationMinutes: apt.onlineTotalDurationMinutes ?? null,
            onlineDurationNeedsVerification:
                apt.onlineDurationNeedsVerification ?? false,
            // Dodatki wybrane przy rezerwacji online — finalizacja pre-filluje
            // z nich pozycje rozliczeniowe.
            extraServices: apt.extraServices ?? undefined,
        };
    }

    private mapTimeBlockToEvent(block: TimeBlock): CalendarEvent {
        return {
            id: block.id,
            type: 'time_block',
            title: block.title ?? this.getTimeBlockTypeLabel(block.type),
            startTime: block.startTime,
            endTime: block.endTime,
            employeeId: block.employee?.id ?? 0,
            employeeName: block.employee?.name ?? '',
            blockType: block.type,
            notes: block.notes,
            allDay: block.allDay,
        };
    }

    private getTimeBlockTypeLabel(type: string): string {
        const labels: Record<string, string> = {
            break: 'Przerwa',
            vacation: 'Urlop',
            training: 'Szkolenie',
            sick: 'Choroba',
            other: 'Inne',
        };
        return labels[type] ?? type;
    }
}
