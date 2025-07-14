import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecord } from './commission-record.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(CommissionRecord)
        private readonly repo: Repository<CommissionRecord>,
    ) {}

    listAll() {
        return this.repo.find();
    }

    listForEmployee(employeeId: number) {
        return this.repo.find({ where: { employee: { id: employeeId } } });
    }

    createForAppointment(appointment: Appointment) {
        const record = this.repo.create({
            employee: appointment.employee,
            appointment,
            product: null,
            amount: appointment.service.price,
            percent: appointment.service.defaultCommissionPercent ?? 0,
        });
        return this.repo.save(record);
    }
}
