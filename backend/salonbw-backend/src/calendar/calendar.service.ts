import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    addDays,
} from 'date-fns';
import { TimeBlock } from './entities/time-block.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { CalendarView } from './dto/calendar-query.dto';
import { CreateTimeBlockDto, UpdateTimeBlockDto } from './dto/create-time-block.dto';

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
    blockType?: string;
    notes?: string;
    allDay?: boolean;
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
    ) {}

    async getCalendarData(
        date: Date,
        view: CalendarView,
        employeeIds?: number[],
    ): Promise<CalendarData> {
        const { start, end } = this.getDateRange(date, view);

        const whereConditions: Record<string, unknown> = {
            startTime: Between(start, end),
        };

        if (employeeIds && employeeIds.length > 0) {
            whereConditions.employee = { id: In(employeeIds) };
        }

        const [appointments, timeBlocks, employees] = await Promise.all([
            this.appointmentRepository.find({
                where: whereConditions,
                relations: ['client', 'employee', 'service'],
                order: { startTime: 'ASC' },
            }),
            this.timeBlockRepository.find({
                where: whereConditions,
                relations: ['employee'],
                order: { startTime: 'ASC' },
            }),
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
        const whereConditions: Record<string, unknown> = {
            startTime: Between(from, to),
        };

        if (employeeId) {
            whereConditions.employee = { id: employeeId };
        }

        return this.timeBlockRepository.find({
            where: whereConditions,
            relations: ['employee'],
            order: { startTime: 'ASC' },
        });
    }

    async createTimeBlock(
        dto: CreateTimeBlockDto,
        createdBy: User,
    ): Promise<TimeBlock> {
        const employee = await this.userRepository.findOne({
            where: { id: dto.employeeId },
        });

        if (!employee) {
            throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
        }

        const timeBlock = this.timeBlockRepository.create({
            employee,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
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

        if (dto.startTime) {
            timeBlock.startTime = new Date(dto.startTime);
        }
        if (dto.endTime) {
            timeBlock.endTime = new Date(dto.endTime);
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
            .andWhere(
                '(tb.startTime < :endTime AND tb.endTime > :startTime)',
                { startTime, endTime },
            )
            .getMany();

        const conflictingEvents: CalendarEvent[] = [
            ...filteredAppointments.map((apt) => this.mapAppointmentToEvent(apt)),
            ...timeBlocks.map((block) => this.mapTimeBlockToEvent(block)),
        ];

        return {
            hasConflict: conflictingEvents.length > 0,
            conflictingEvents,
        };
    }

    private getDateRange(
        date: Date,
        view: CalendarView,
    ): { start: Date; end: Date } {
        switch (view) {
            case CalendarView.Day:
                return {
                    start: startOfDay(date),
                    end: endOfDay(date),
                };
            case CalendarView.Week:
                return {
                    start: startOfWeek(date, { weekStartsOn: 1 }),
                    end: endOfWeek(date, { weekStartsOn: 1 }),
                };
            case CalendarView.Month:
                const monthStart = startOfMonth(date);
                const monthEnd = endOfMonth(date);
                return {
                    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
                    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
                };
        }
    }

    private async getEmployees(employeeIds?: number[]): Promise<User[]> {
        const whereConditions: Record<string, unknown> = {
            role: In(['employee', 'admin']),
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
            notes: apt.notes,
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
