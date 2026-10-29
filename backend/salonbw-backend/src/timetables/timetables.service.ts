import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { Role } from '../users/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import {
    EntityManager,
    Repository,
    LessThanOrEqual,
    MoreThan,
    Not,
    In,
} from 'typeorm';
import { Timetable } from './entities/timetable.entity';
import { TimetableSlot, DayOfWeek } from './entities/timetable-slot.entity';
import {
    TimetableException,
    ExceptionType,
} from './entities/timetable-exception.entity';
import {
    CreateTimetableDto,
    UpdateTimetableDto,
    CreateExceptionDto,
    UpdateExceptionDto,
    EmployeeAvailability,
    AvailabilitySlot,
} from './dto/timetable.dto';
import { User } from '../users/user.entity';
import { Appointment, AppointmentStatus } from '../appointments/appointment.entity';
import { CalendarService } from '../calendar/calendar.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class TimetablesService {
    constructor(
        @InjectRepository(Timetable)
        private readonly timetableRepository: Repository<Timetable>,
        @InjectRepository(TimetableSlot)
        private readonly slotRepository: Repository<TimetableSlot>,
        @InjectRepository(TimetableException)
        private readonly exceptionRepository: Repository<TimetableException>,
        private readonly logService: LogService,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly calendarService: CalendarService,
    ) {}

    async findAll(options?: {
        employeeId?: number;
        isActive?: boolean;
    }): Promise<Timetable[]> {
        const where: Record<string, unknown> = {};
        if (options?.employeeId) {
            where.employeeId = options.employeeId;
        }
        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        return this.timetableRepository
            .find({
                where,
                order: { validFrom: 'DESC' },
                relations: ['employee', 'slots'],
            })
            .then((items) =>
                items.filter((item) => !item.employee?.isSystemAdmin),
            );
    }

    async findOne(id: number): Promise<Timetable> {
        const timetable = await this.timetableRepository.findOne({
            where: { id },
            relations: ['employee', 'slots', 'exceptions'],
        });
        if (!timetable || timetable.employee?.isSystemAdmin) {
            throw new NotFoundException(
                `Grafik o ID ${id} nie został znaleziony`,
            );
        }
        return timetable;
    }

    async findActiveForEmployee(
        employeeId: number,
        date: Date,
    ): Promise<Timetable | null> {
        return this.timetableRepository.findOne({
            where: {
                employeeId,
                isActive: true,
                validFrom: LessThanOrEqual(date),
            },
            order: { validFrom: 'DESC' },
            relations: ['slots'],
        });
    }

    /**
     * Employees may manage only their OWN schedule; Admin/Receptionist any.
     */
    private assertCanManage(employeeId: number, actor: User): void {
        if (actor.role === Role.Employee && employeeId !== actor.id) {
            throw new ForbiddenException(
                'Pracownik może zarządzać tylko własnym grafikiem.',
            );
        }
    }

    /**
     * All writers that affect bookability serialize on users(id) FOR UPDATE.
     * Reads, mutation and the post-write booking invariant share this
     * transaction manager; rejected writes roll back completely.
     */
    private async withLockedSchedule<T>(
        employeeId: number,
        mutate: (manager: EntityManager) => Promise<T>,
    ): Promise<T> {
        return this.timetableRepository.manager.transaction(async (manager) => {
            if (manager.connection.options.type === 'postgres') {
                await manager.query(
                    'SELECT "id" FROM "users" WHERE "id" = $1 FOR UPDATE',
                    [employeeId],
                );
            }
            const appointments = await manager.getRepository(Appointment).find({
                where: {
                    employeeId,
                    status: Not(In([
                        AppointmentStatus.Cancelled,
                        AppointmentStatus.Completed,
                        AppointmentStatus.NoShow,
                    ])),
                    endTime: MoreThan(new Date()),
                },
            });
            // Existing intentional manual bookings outside standard working
            // hours remain untouched; only newly invalidated bookings block
            // a schedule edit.
            const previouslyValid = await Promise.all(
                appointments.map((appointment) =>
                    this.calendarService.isWithinEmployeeWorkingHours(
                        employeeId,
                        new Date(appointment.startTime),
                        new Date(appointment.endTime),
                        manager,
                    ),
                ),
            );
            const result = await mutate(manager);
            for (let i = 0; i < appointments.length; i++) {
                if (
                    previouslyValid[i] &&
                    !(await this.calendarService.isWithinEmployeeWorkingHours(
                        employeeId,
                        new Date(appointments[i].startTime),
                        new Date(appointments[i].endTime),
                        manager,
                    ))
                ) {
                    throw new ConflictException(
                        'Schedule change would invalidate an existing appointment',
                    );
                }
            }
            return result;
        });
    }

    async create(dto: CreateTimetableDto, actor: User): Promise<Timetable> {
        this.assertCanManage(dto.employeeId, actor);
        const employee = await this.userRepository.findOne({
            where: { id: dto.employeeId },
        });
        if (
            !employee ||
            employee.role === Role.Client ||
            employee.isSystemAdmin
        ) {
            throw new BadRequestException(
                'Timetables require a salon staff member',
            );
        }

        const saved = await this.withLockedSchedule(
            dto.employeeId,
            async (manager) => {
                const timetables = manager.getRepository(Timetable);
                const slotsRepo = manager.getRepository(TimetableSlot);
                // Schedule deactivation and slot replacement are one commit.
                if (dto.validFrom) {
                    await timetables.update(
                        { employeeId: dto.employeeId, isActive: true },
                        { isActive: false },
                    );
                }
                const timetable = timetables.create({
                    employeeId: dto.employeeId,
                    name: dto.name,
                    description: dto.description,
                    validFrom: new Date(dto.validFrom),
                    validTo: dto.validTo ? new Date(dto.validTo) : undefined,
                    isActive: true,
                });
                const created = await timetables.save(timetable);
                if (dto.slots?.length) {
                    await slotsRepo.save(
                        dto.slots.map((slot) =>
                            slotsRepo.create({
                                timetableId: created.id,
                                dayOfWeek: slot.dayOfWeek,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                                isBreak: slot.isBreak ?? false,
                                notes: slot.notes,
                            }),
                        ),
                    );
                }
                return created;
            },
        );
        await this.logService.logAction(actor, LogAction.TIMETABLE_CREATED, {
            entity: 'timetable',
            timetableId: saved.id,
            employeeId: dto.employeeId,
            name: dto.name,
        });
        return this.findOne(saved.id);
    }

    async update(
        id: number,
        dto: UpdateTimetableDto,
        actor: User,
    ): Promise<Timetable> {
        const original = await this.findOne(id);
        this.assertCanManage(original.employeeId, actor);
        await this.withLockedSchedule(original.employeeId, async (manager) => {
            const timetables = manager.getRepository(Timetable);
            const slotsRepo = manager.getRepository(TimetableSlot);
            // Reload after obtaining staff lock; do not save stale state.
            const timetable = await timetables.findOne({ where: { id } });
            if (!timetable || timetable.employeeId !== original.employeeId) {
                throw new NotFoundException(`Grafik o ID ${id} nie został znaleziony`);
            }
            if (dto.name !== undefined) timetable.name = dto.name;
            if (dto.description !== undefined) timetable.description = dto.description;
            if (dto.validFrom) timetable.validFrom = new Date(dto.validFrom);
            if (dto.validTo !== undefined) {
                timetable.validTo = dto.validTo ? new Date(dto.validTo) : undefined;
            }
            if (dto.isActive !== undefined) timetable.isActive = dto.isActive;
            await timetables.save(timetable);
            if (dto.slots) {
                await slotsRepo.delete({ timetableId: id });
                if (dto.slots.length) {
                    await slotsRepo.save(dto.slots.map((slot) => slotsRepo.create({
                        timetableId: id,
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isBreak: slot.isBreak ?? false,
                        notes: slot.notes,
                    })));
                }
            }
        });
        await this.logService.logAction(actor, LogAction.TIMETABLE_UPDATED, {
            entity: 'timetable',
            timetableId: id,
            changes: dto,
        });
        return this.findOne(id);
    }

    async remove(id: number, actor: User): Promise<void> {
        const original = await this.findOne(id);
        this.assertCanManage(original.employeeId, actor);
        await this.withLockedSchedule(original.employeeId, async (manager) => {
            const repo = manager.getRepository(Timetable);
            const timetable = await repo.findOne({ where: { id } });
            if (!timetable) {
                throw new NotFoundException(`Grafik o ID ${id} nie został znaleziony`);
            }
            await repo.remove(timetable);
        });
        await this.logService.logAction(actor, LogAction.TIMETABLE_DELETED, {
            entity: 'timetable',
            timetableId: id,
            name: original.name,
        });
    }

    // Exception management
    async findExceptions(
        timetableId: number,
        options?: {
            from?: Date;
            to?: Date;
            type?: ExceptionType;
        },
    ): Promise<TimetableException[]> {
        const qb = this.exceptionRepository
            .createQueryBuilder('exception')
            .where('exception.timetableId = :timetableId', { timetableId })
            .leftJoinAndSelect('exception.createdBy', 'createdBy')
            .leftJoinAndSelect('exception.approvedBy', 'approvedBy')
            .orderBy('exception.date', 'ASC');

        if (options?.from && options?.to) {
            qb.andWhere('exception.date BETWEEN :from AND :to', {
                from: options.from,
                to: options.to,
            });
        }
        if (options?.type) {
            qb.andWhere('exception.type = :type', { type: options.type });
        }

        return qb.getMany();
    }

    async createException(
        timetableId: number,
        dto: CreateExceptionDto,
        actor: User,
    ): Promise<TimetableException> {
        const timetable = await this.findOne(timetableId);
        this.assertCanManage(timetable.employeeId, actor);
        const saved = await this.withLockedSchedule(
            timetable.employeeId,
            async (manager) => {
                const timetableRepo = manager.getRepository(Timetable);
                if (!(await timetableRepo.findOne({ where: { id: timetableId } }))) {
                    throw new NotFoundException(
                        `Grafik o ID ${timetableId} nie został znaleziony`,
                    );
                }
                const repo = manager.getRepository(TimetableException);
                const existing = await repo.findOne({
                    where: { timetableId, date: new Date(dto.date) },
                });
                if (existing) {
                    throw new BadRequestException(
                        `Wyjątek dla daty ${dto.date} już istnieje`,
                    );
                }
                return repo.save(repo.create({
                    timetableId,
                    date: new Date(dto.date),
                    type: dto.type,
                    title: dto.title,
                    reason: dto.reason,
                    customStartTime: dto.customStartTime,
                    customEndTime: dto.customEndTime,
                    isAllDay: dto.isAllDay ?? true,
                    createdById: actor.id,
                    isPending: dto.type === ExceptionType.Vacation,
                }));
            },
        );
        await this.logService.logAction(actor, LogAction.SERVICE_CREATED, {
            entity: 'timetable_exception',
            exceptionId: saved.id,
            timetableId,
            date: dto.date,
            type: dto.type,
        });
        return saved;
    }

    async updateException(
        exceptionId: number,
        dto: UpdateExceptionDto,
        actor: User,
    ): Promise<TimetableException> {
        const original = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!original) {
            throw new NotFoundException(`Wyjątek o ID ${exceptionId} nie został znaleziony`);
        }
        const timetable = await this.findOne(original.timetableId);
        this.assertCanManage(timetable.employeeId, actor);
        const saved = await this.withLockedSchedule(
            timetable.employeeId,
            async (manager) => {
                const repo = manager.getRepository(TimetableException);
                const exception = await repo.findOne({ where: { id: exceptionId } });
                if (!exception || exception.timetableId !== timetable.id) {
                    throw new NotFoundException(
                        `Wyjątek o ID ${exceptionId} nie został znaleziony`,
                    );
                }
                if (dto.type !== undefined) exception.type = dto.type;
                if (dto.title !== undefined) exception.title = dto.title;
                if (dto.reason !== undefined) exception.reason = dto.reason;
                if (dto.customStartTime !== undefined) {
                    exception.customStartTime = dto.customStartTime;
                }
                if (dto.customEndTime !== undefined) {
                    exception.customEndTime = dto.customEndTime;
                }
                if (dto.isAllDay !== undefined) exception.isAllDay = dto.isAllDay;
                return repo.save(exception);
            },
        );
        await this.logService.logAction(actor, LogAction.SERVICE_UPDATED, {
            entity: 'timetable_exception',
            exceptionId,
            changes: dto,
        });
        return saved;
    }

    async removeException(exceptionId: number, actor: User): Promise<void> {
        const original = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!original) {
            throw new NotFoundException(`Wyjątek o ID ${exceptionId} nie został znaleziony`);
        }
        const timetable = await this.findOne(original.timetableId);
        this.assertCanManage(timetable.employeeId, actor);
        await this.withLockedSchedule(timetable.employeeId, async (manager) => {
            const repo = manager.getRepository(TimetableException);
            const exception = await repo.findOne({ where: { id: exceptionId } });
            if (!exception) {
                throw new NotFoundException(`Wyjątek o ID ${exceptionId} nie został znaleziony`);
            }
            await repo.remove(exception);
        });
        await this.logService.logAction(actor, LogAction.SERVICE_DELETED, {
            entity: 'timetable_exception',
            exceptionId,
            date: original.date,
        });
    }

    async approveException(
        exceptionId: number,
        actor: User,
    ): Promise<TimetableException> {
        const original = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!original) {
            throw new NotFoundException(`Wyjątek o ID ${exceptionId} nie został znaleziony`);
        }
        const timetable = await this.findOne(original.timetableId);
        const saved = await this.withLockedSchedule(
            timetable.employeeId,
            async (manager) => {
                const repo = manager.getRepository(TimetableException);
                const exception = await repo.findOne({ where: { id: exceptionId } });
                if (!exception) {
                    throw new NotFoundException(
                        `Wyjątek o ID ${exceptionId} nie został znaleziony`,
                    );
                }
                exception.isPending = false;
                exception.approvedById = actor.id;
                exception.approvedAt = new Date();
                return repo.save(exception);
            },
        );
        await this.logService.logAction(actor, LogAction.SERVICE_UPDATED, {
            entity: 'timetable_exception',
            exceptionId,
            action: 'approve',
        });
        return saved;
    }

    // Availability calculation
    async getAvailability(
        employeeId: number,
        from: Date,
        to: Date,
    ): Promise<EmployeeAvailability> {
        const timetable = await this.findActiveForEmployee(employeeId, from);

        const slots: AvailabilitySlot[] = [];
        const currentDate = new Date(from);

        while (currentDate <= to) {
            // Convert JS day index (Sun=0) to ISO-like (Mon=0) and keep it typed as DayOfWeek.
            const dayOfWeek = ((currentDate.getDay() + 6) % 7) as DayOfWeek;
            const dateStr = currentDate.toISOString().split('T')[0];

            // Check for exceptions on this date
            const exception = timetable
                ? await this.exceptionRepository.findOne({
                      where: {
                          timetableId: timetable.id,
                          date: new Date(dateStr),
                      },
                  })
                : null;

            if (exception) {
                // Exception overrides regular schedule
                if (
                    exception.type === ExceptionType.CustomHours &&
                    !exception.isAllDay
                ) {
                    slots.push({
                        date: dateStr,
                        dayOfWeek,
                        startTime: exception.customStartTime!,
                        endTime: exception.customEndTime!,
                        isException: true,
                        exceptionType: exception.type,
                        isAvailable: true,
                    });
                } else {
                    // Day off or full day exception
                    slots.push({
                        date: dateStr,
                        dayOfWeek,
                        startTime: '00:00',
                        endTime: '00:00',
                        isException: true,
                        exceptionType: exception.type,
                        isAvailable: false,
                    });
                }
            } else if (timetable) {
                // Use regular schedule
                const daySlots = timetable.slots.filter(
                    (s) => s.dayOfWeek === dayOfWeek && !s.isBreak,
                );

                if (daySlots.length > 0) {
                    for (const slot of daySlots) {
                        slots.push({
                            date: dateStr,
                            dayOfWeek,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            isException: false,
                            isAvailable: true,
                        });
                    }
                } else {
                    // No slots = day off
                    slots.push({
                        date: dateStr,
                        dayOfWeek,
                        startTime: '00:00',
                        endTime: '00:00',
                        isException: false,
                        isAvailable: false,
                    });
                }
            } else {
                // No timetable = unavailable
                slots.push({
                    date: dateStr,
                    dayOfWeek,
                    startTime: '00:00',
                    endTime: '00:00',
                    isException: false,
                    isAvailable: false,
                });
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return {
            employeeId,
            employeeName: timetable?.employee?.name ?? '',
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0],
            slots,
        };
    }
}
