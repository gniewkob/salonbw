import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Timetable } from './entities/timetable.entity';
import { TimetableSlot, DayOfWeek } from './entities/timetable-slot.entity';
import { TimetableException, ExceptionType } from './entities/timetable-exception.entity';
import {
    CreateTimetableDto,
    UpdateTimetableDto,
    CreateExceptionDto,
    UpdateExceptionDto,
    EmployeeAvailability,
    AvailabilitySlot,
} from './dto/timetable.dto';
import { User } from '../users/user.entity';
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
        return this.timetableRepository.find({
            where,
            order: { validFrom: 'DESC' },
            relations: ['employee', 'slots'],
        });
    }

    async findOne(id: number): Promise<Timetable> {
        const timetable = await this.timetableRepository.findOne({
            where: { id },
            relations: ['employee', 'slots', 'exceptions'],
        });
        if (!timetable) {
            throw new NotFoundException(`Grafik o ID ${id} nie został znaleziony`);
        }
        return timetable;
    }

    async findActiveForEmployee(employeeId: number, date: Date): Promise<Timetable | null> {
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

    async create(dto: CreateTimetableDto, actor: User): Promise<Timetable> {
        // Deactivate other timetables for same employee if this one overlaps
        if (dto.validFrom) {
            await this.timetableRepository.update(
                {
                    employeeId: dto.employeeId,
                    isActive: true,
                },
                { isActive: false }
            );
        }

        const timetable = this.timetableRepository.create({
            employeeId: dto.employeeId,
            name: dto.name,
            description: dto.description,
            validFrom: new Date(dto.validFrom),
            validTo: dto.validTo ? new Date(dto.validTo) : undefined,
            isActive: true,
        });

        const saved = await this.timetableRepository.save(timetable);

        // Create slots
        if (dto.slots && dto.slots.length > 0) {
            const slots = dto.slots.map((slotDto) =>
                this.slotRepository.create({
                    timetableId: saved.id,
                    dayOfWeek: slotDto.dayOfWeek,
                    startTime: slotDto.startTime,
                    endTime: slotDto.endTime,
                    isBreak: slotDto.isBreak ?? false,
                    notes: slotDto.notes,
                })
            );
            await this.slotRepository.save(slots);
        }

        await this.logService.logAction(actor, LogAction.TIMETABLE_CREATED, {
            entity: 'timetable',
            timetableId: saved.id,
            employeeId: dto.employeeId,
            name: dto.name,
        });

        return this.findOne(saved.id);
    }

    async update(id: number, dto: UpdateTimetableDto, actor: User): Promise<Timetable> {
        const timetable = await this.findOne(id);

        if (dto.name !== undefined) timetable.name = dto.name;
        if (dto.description !== undefined) timetable.description = dto.description;
        if (dto.validFrom) timetable.validFrom = new Date(dto.validFrom);
        if (dto.validTo !== undefined) {
            timetable.validTo = dto.validTo ? new Date(dto.validTo) : undefined;
        }
        if (dto.isActive !== undefined) timetable.isActive = dto.isActive;

        await this.timetableRepository.save(timetable);

        // Update slots if provided
        if (dto.slots) {
            // Remove existing slots
            await this.slotRepository.delete({ timetableId: id });

            // Create new slots
            const slots = dto.slots.map((slotDto) =>
                this.slotRepository.create({
                    timetableId: id,
                    dayOfWeek: slotDto.dayOfWeek,
                    startTime: slotDto.startTime,
                    endTime: slotDto.endTime,
                    isBreak: slotDto.isBreak ?? false,
                    notes: slotDto.notes,
                })
            );
            await this.slotRepository.save(slots);
        }

        await this.logService.logAction(actor, LogAction.TIMETABLE_UPDATED, {
            entity: 'timetable',
            timetableId: id,
            changes: dto,
        });

        return this.findOne(id);
    }

    async remove(id: number, actor: User): Promise<void> {
        const timetable = await this.findOne(id);
        await this.timetableRepository.remove(timetable);

        await this.logService.logAction(actor, LogAction.TIMETABLE_DELETED, {
            entity: 'timetable',
            timetableId: id,
            name: timetable.name,
        });
    }

    // Exception management
    async findExceptions(timetableId: number, options?: {
        from?: Date;
        to?: Date;
        type?: ExceptionType;
    }): Promise<TimetableException[]> {
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

        // Check for existing exception on same date
        const existing = await this.exceptionRepository.findOne({
            where: {
                timetableId,
                date: new Date(dto.date),
            },
        });
        if (existing) {
            throw new BadRequestException(
                `Wyjątek dla daty ${dto.date} już istnieje`
            );
        }

        const exception = this.exceptionRepository.create({
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
        });

        const saved = await this.exceptionRepository.save(exception);

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
        const exception = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!exception) {
            throw new NotFoundException(
                `Wyjątek o ID ${exceptionId} nie został znaleziony`
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

        const saved = await this.exceptionRepository.save(exception);

        await this.logService.logAction(actor, LogAction.SERVICE_UPDATED, {
            entity: 'timetable_exception',
            exceptionId,
            changes: dto,
        });

        return saved;
    }

    async removeException(exceptionId: number, actor: User): Promise<void> {
        const exception = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!exception) {
            throw new NotFoundException(
                `Wyjątek o ID ${exceptionId} nie został znaleziony`
            );
        }

        await this.exceptionRepository.remove(exception);

        await this.logService.logAction(actor, LogAction.SERVICE_DELETED, {
            entity: 'timetable_exception',
            exceptionId,
            date: exception.date,
        });
    }

    async approveException(
        exceptionId: number,
        actor: User,
    ): Promise<TimetableException> {
        const exception = await this.exceptionRepository.findOne({
            where: { id: exceptionId },
        });
        if (!exception) {
            throw new NotFoundException(
                `Wyjątek o ID ${exceptionId} nie został znaleziony`
            );
        }

        exception.isPending = false;
        exception.approvedById = actor.id;
        exception.approvedAt = new Date();

        const saved = await this.exceptionRepository.save(exception);

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
            const dayOfWeek = (currentDate.getDay() + 6) % 7; // Convert to ISO (Mon=0)
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
                if (exception.type === ExceptionType.CustomHours && !exception.isAllDay) {
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
                    (s) => s.dayOfWeek === dayOfWeek && !s.isBreak
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
