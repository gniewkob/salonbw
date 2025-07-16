import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecord } from './commission-record.entity';
import { CommissionRule, CommissionTargetType } from './commission-rule.entity';
import { Service } from '../catalog/service.entity';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(CommissionRecord)
        private readonly repo: Repository<CommissionRecord>,
        @InjectRepository(CommissionRule)
        private readonly rules: Repository<CommissionRule>,
    ) {}

    listAll() {
        return this.repo.find();
    }

    listForEmployee(employeeId: number) {
        return this.repo.find({ where: { employee: { id: employeeId } } });
    }

    async getPercentForService(
        employeeId: number,
        service: Service,
        base?: number | null,
    ): Promise<number> {
        const rule = await this.rules.findOne({
            where: {
                employee: { id: employeeId } as any,
                targetType: CommissionTargetType.Service,
                targetId: service.id,
            },
        });
        if (rule) return rule.commissionPercent;

        if (service.category) {
            const catRule = await this.rules.findOne({
                where: {
                    employee: { id: employeeId } as any,
                    targetType: CommissionTargetType.Category,
                    targetId: service.category.id,
                },
            });
            if (catRule) return catRule.commissionPercent;
        }

        return base ?? service.defaultCommissionPercent ?? 0;
    }

}
