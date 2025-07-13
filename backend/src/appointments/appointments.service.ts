import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
    ) {}

    create(clientId: number, employeeId: number, scheduledAt: string) {
        const appointment = this.repo.create({
            client: { id: clientId } as any,
            employee: { id: employeeId } as any,
            scheduledAt: new Date(scheduledAt),
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
        if (dto.scheduledAt) {
            appt.scheduledAt = new Date(dto.scheduledAt);
        }
        if (dto.employeeId) {
            appt.employee = { id: dto.employeeId } as any;
        }
        if (dto.status) {
            appt.status = dto.status;
        }
        return this.repo.save(appt);
    }

    remove(id: number) {
        return this.repo.delete(id);
    }
}
