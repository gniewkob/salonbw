import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './commission.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(Commission)
        private readonly commissionsRepository: Repository<Commission>,
    ) {}

    create(data: Partial<Commission>): Promise<Commission> {
        const commission = this.commissionsRepository.create(data);
        return this.commissionsRepository.save(commission);
    }

    async createFromAppointment(appointment: Appointment): Promise<Commission> {
        const percent = appointment.service.commissionPercent ?? 0;
        const amount = (appointment.service.price * percent) / 100;
        return this.create({
            employee: appointment.employee,
            appointment,
            amount,
            percent,
        });
    }

    findForUser(userId: number): Promise<Commission[]> {
        return this.commissionsRepository.find({
            where: { employee: { id: userId } },
            order: { createdAt: 'DESC' },
        });
    }

    findAll(): Promise<Commission[]> {
        return this.commissionsRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
}
