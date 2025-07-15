import { Injectable, Inject, forwardRef, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Service } from '../catalog/service.entity';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';
import { UpdateAppointmentParams } from './dto/update-appointment-params';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
        @Inject(forwardRef(() => FormulasService))
        private readonly formulas: FormulasService,
        @InjectRepository(CommissionRecord)
        private readonly commissions: Repository<CommissionRecord>,
        private readonly logs: LogsService,
    ) {}

    async create(
        clientId: number,
        employeeId: number,
        serviceId: number,
        startTime: string,
    ): Promise<Appointment> {
        const start = new Date(startTime);
        if (start < new Date()) {
            throw new BadRequestException('Start time must be in the future');
        }
        const existing = await this.repo.findOne({
            where: {
                employee: { id: employeeId },
                startTime: start,
            },
        });
        if (existing) {
            throw new ConflictException('Appointment time already taken');
        }
        const appointment = this.repo.create({
            client: { id: clientId } as any,
            employee: { id: employeeId } as any,
            service: { id: serviceId } as Service,
            startTime: start,
            status: AppointmentStatus.Scheduled,
        });
        const saved = await this.repo.save(appointment);
        await this.logs.create(
            LogAction.CreateAppointment,
            JSON.stringify({ clientId, employeeId, serviceId, startTime }),
            clientId,
        );
        return saved;
    }

    findClientAppointments(clientId: number) {
        return this.repo.find({ where: { client: { id: clientId } } });
    }

    findEmployeeAppointments(employeeId: number) {
        return this.repo.find({ where: { employee: { id: employeeId } } });
    }

    findAll() {
        return this.repo.find();
    }

    findOne(id: number) {
        return this.repo.findOne({ where: { id } });
    }

    async update(id: number, dto: UpdateAppointmentParams) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        return this.applyUpdates(appt, dto);
    }

    private async applyUpdates(
        appt: Appointment,
        dto: UpdateAppointmentParams,
    ) {
        if (dto.startTime) {
            appt.startTime = new Date(dto.startTime);
        }
        if (dto.endTime) {
            appt.endTime = new Date(dto.endTime);
        }
        if (dto.notes !== undefined) {
            appt.notes = dto.notes;
        }
        if (dto.serviceId) {
            appt.service = { id: dto.serviceId } as Service;
        }
        if (dto.employeeId) {
            appt.employee = { id: dto.employeeId } as any;
        }
        if (dto.status) {
            appt.status = dto.status;
        }
        const saved = await this.repo.save(appt);
        if (dto.formulaDescription) {
            await this.formulas.create(
                appt.client.id,
                dto.formulaDescription,
                appt.id,
            );
        }
        return saved;
    }

    async complete(id: number): Promise<Appointment | undefined>;
    async complete(
        id: number,
        userId: number,
        role: Role | EmployeeRole,
    ): Promise<Appointment | undefined>;
    async complete(id: number, userId?: number, role?: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (userId === undefined || role === undefined) {
            appt.status = AppointmentStatus.Completed;
            appt.endTime = new Date();
            const saved = await this.repo.save(appt);
            const record = this.commissions.create({
                employee: appt.employee,
                appointment: appt,
                product: null,
                amount: appt.service.price,
                percent: appt.service.defaultCommissionPercent ?? 0,
            });
            await this.commissions.save(record);
            return saved;
        }
        if (appt.status === AppointmentStatus.Completed) {
            return appt;
        }
        if (
            role !== Role.Admin &&
            (role !== Role.Employee || appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        appt.status = AppointmentStatus.Completed;
        appt.endTime = appt.endTime || new Date();
        const saved = await this.repo.save(appt);

        const percent =
            (appt.employee.commissionBase ??
                appt.service.defaultCommissionPercent ??
                0) / 100;
        if (percent > 0) {
            const record = this.commissions.create({
                employee: { id: appt.employee.id } as any,
                appointment: { id: appt.id } as any,
                amount: Number(appt.service.price) * percent,
                percent: percent * 100,
            });
            await this.commissions.save(record);
        }
        return saved;
    }

    remove(id: number) {
        return this.repo.delete(id);
    }

    async updateForUser(
        id: number,
        userId: number,
        role: Role | EmployeeRole,
        dto: UpdateAppointmentParams,
    ) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            (role === Role.Client && appt.client.id !== userId) ||
            (role === Role.Employee && appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        return this.applyUpdates(appt, dto);
    }

    async cancel(id: number, userId: number, role: Role | EmployeeRole) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            role !== Role.Admin &&
            appt.client.id !== userId &&
            appt.employee.id !== userId
        ) {
            throw new ForbiddenException();
        }
        appt.status = AppointmentStatus.Cancelled;
        return this.repo.save(appt);
    }

    async removeForUser(
        id: number,
        userId: number,
        role: Role | EmployeeRole,
    ) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
        if (
            (role === Role.Client && appt.client.id !== userId) ||
            (role === Role.Employee && appt.employee.id !== userId)
        ) {
            throw new ForbiddenException();
        }
        return this.repo.delete(id);
    }
}
