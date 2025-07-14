import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Service } from '../catalog/service.entity';
import { FormulasService } from '../formulas/formulas.service';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly repo: Repository<Appointment>,
        private readonly formulas: FormulasService,
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
}
