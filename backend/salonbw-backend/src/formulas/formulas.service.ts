import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula } from './formula.entity';
import {
    Appointment,
    AppointmentStatus,
} from '../appointments/appointment.entity';
import { Role } from '../users/role.enum';

@Injectable()
export class FormulasService {
    constructor(
        @InjectRepository(Formula)
        private readonly formulasRepository: Repository<Formula>,
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
    ) {}

    async addToAppointment(
        appointmentId: number,
        userId: number,
        role: Role | string,
        data: { description: string; date: Date },
    ): Promise<Formula> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
            select: ['id', 'status'],
            relations: ['employee', 'client'],
        });
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }
        if (role !== Role.Admin && appointment.employee.id !== userId) {
            throw new ForbiddenException();
        }
        if (
            appointment.status !== AppointmentStatus.Completed &&
            appointment.status !== AppointmentStatus.InProgress &&
            appointment.status !== AppointmentStatus.Confirmed
        ) {
            throw new BadRequestException(
                'Appointment must be confirmed, in progress or completed to add a formula',
            );
        }
        const formula = this.formulasRepository.create({
            description: data.description,
            date: data.date,
            client: appointment.client,
            appointment,
        });
        return this.formulasRepository.save(formula);
    }

    findForClient(clientId: number): Promise<Formula[]> {
        return this.formulasRepository.find({
            where: { client: { id: clientId } },
            order: { date: 'DESC' },
        });
    }
}
