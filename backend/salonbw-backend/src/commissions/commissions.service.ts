import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commission } from './commission.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(Commission)
        private readonly commissionsRepository: Repository<Commission>,
        private readonly logService: LogService,
    ) {}

    async create(data: Partial<Commission>): Promise<Commission> {
        const commission = this.commissionsRepository.create(data);
        const saved = await this.commissionsRepository.save(commission);
        await this.logService.logAction(null, LogAction.COMMISSION_CREATED, {
            commissionId: saved.id,
            appointmentId: saved.appointment?.id,
            employeeId: saved.employee?.id,
            amount: saved.amount,
        });
        return saved;
    }

    async createFromAppointment(appointment: Appointment): Promise<Commission> {
        const price = Number(appointment.service.price);
        const percent = Number(appointment.service.commissionPercent ?? 0);
        const amount = (price * percent) / 100;
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
