import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentsRepository: Repository<Appointment>,
    ) {}

    async create(data: Partial<Appointment>): Promise<Appointment> {
        const conflict = await this.appointmentsRepository.findOne({
            where: {
                employee: { id: data.employee!.id },
                status: Not(AppointmentStatus.Cancelled),
                startTime: LessThan(data.endTime as Date),
                endTime: MoreThan(data.startTime as Date),
            },
        });
        if (conflict) {
            throw new ConflictException('Employee is already booked for this time');
        }
        const appointment = this.appointmentsRepository.create(data);
        return this.appointmentsRepository.save(appointment);
    }

    findForUser(userId: number): Promise<Appointment[]> {
        return this.appointmentsRepository.find({
            where: [{ client: { id: userId } }, { employee: { id: userId } }],
            order: { startTime: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Appointment | null> {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
        });
        return appointment ?? null;
    }

    async cancel(id: number): Promise<Appointment | null> {
        await this.appointmentsRepository.update(id, {
            status: AppointmentStatus.Cancelled,
        });
        return this.findOne(id);
    }

    async complete(id: number): Promise<Appointment | null> {
        await this.appointmentsRepository.update(id, {
            status: AppointmentStatus.Completed,
        });
        return this.findOne(id);
    }
}
