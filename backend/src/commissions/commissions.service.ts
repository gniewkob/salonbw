import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecord } from './commission-record.entity';

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
}
