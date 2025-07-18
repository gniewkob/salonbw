import {
    Injectable,
    Inject,
    ForbiddenException,
    forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula } from './formula.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { Role } from '../users/role.enum';
import { EmployeeRole } from '../employees/employee-role.enum';

@Injectable()
export class FormulasService {
    constructor(
        @InjectRepository(Formula)
        private readonly repo: Repository<Formula>,
        @Inject(forwardRef(() => AppointmentsService))
        private readonly appointments: AppointmentsService,
    ) {}

    create(clientId: number, description: string, appointmentId?: number) {
        const formula = this.repo.create({
            client: { id: clientId } as any,
            description,
            appointment: appointmentId ? ({ id: appointmentId } as any) : null,
        });
        return this.repo.save(formula);
    }

    findForUser(clientId: number) {
        return this.repo.find({
            where: { client: { id: clientId } },
            order: { id: 'ASC' },
        });
    }

    async createForAppointment(
        userId: number,
        role: Role | EmployeeRole,
        appointmentId: number,
        description: string,
    ) {
        const appointment = await this.appointments.findOne(appointmentId);
        if (!appointment) {
            throw new ForbiddenException();
        }
        if (role !== Role.Admin && appointment.employee.id !== userId) {
            throw new ForbiddenException();
        }
        return this.create(appointment.client.id, description, appointment.id);
    }
}
