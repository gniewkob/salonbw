import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formula } from './formula.entity';
import { Appointment } from '../appointments/appointment.entity';

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
        data: { description: string; date: Date },
    ): Promise<Formula> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id: appointmentId },
        });
        if (!appointment) {
            throw new NotFoundException('Appointment not found');
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

