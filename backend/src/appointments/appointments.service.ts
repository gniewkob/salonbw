import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Service } from '../catalog/service.entity';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
        private readonly formulas: FormulasService,
        @InjectRepository(CommissionRecord)
        private readonly commissions: Repository<CommissionRecord>,
    ) {}

    create(
        clientId: number,
        employeeId: number,
        serviceId: number,
        startTime: string,
    ) {
        const appointment = this.repo.create({
            client: { id: clientId } as any,
            employee: { id: employeeId } as any,
            service: { id: serviceId } as Service,
            startTime: new Date(startTime),
            status: AppointmentStatus.Scheduled,
        });
        return this.repo.save(appointment);
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

    async update(id: number, dto: any) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
        }
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

    remove(id: number) {
        return this.repo.delete(id);
    }

    async cancel(id: number, userId: number, role: Role) {
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

    async complete(id: number, userId: number, role: Role) {
        const appt = await this.repo.findOne({ where: { id } });
        if (!appt) {
            return undefined;
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
}
