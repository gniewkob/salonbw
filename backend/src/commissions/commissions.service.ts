import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRecord } from './commission-record.entity';
import { CommissionRule, CommissionTargetType } from './commission-rule.entity';
import { Service } from '../catalog/service.entity';
import { Product } from '../catalog/product.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

export const DEFAULT_COMMISSION_BASE = 13;

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(CommissionRecord)
        private readonly repo: Repository<CommissionRecord>,
        @InjectRepository(CommissionRule)
        private readonly rules: Repository<CommissionRule>,
        @InjectRepository(Appointment)
        private readonly appointments: Repository<Appointment>,
        private readonly logs: LogsService,
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

        if (base === null) {
            return DEFAULT_COMMISSION_BASE;
        }
        return (
            base ?? service.defaultCommissionPercent ?? DEFAULT_COMMISSION_BASE
        );
    }

    async getPercentForProduct(
        employeeId: number,
        product: Product,
        base?: number | null,
    ): Promise<number> {
        const rule = await this.rules.findOne({
            where: {
                employee: { id: employeeId } as any,
                targetType: CommissionTargetType.Product,
                targetId: product.id,
            },
        });
        if (rule) return rule.commissionPercent;

        if (base === null) {
            return DEFAULT_COMMISSION_BASE;
        }
        return base ?? DEFAULT_COMMISSION_BASE;
    }

    async calculateCommission(
        appointmentId: number,
    ): Promise<CommissionRecord | null> {
        const appt = await this.appointments.findOne({
            where: { id: appointmentId },
        });
        if (!appt) {
            return null;
        }
        const percent =
            (await this.getPercentForService(
                appt.employee.id,
                appt.service,
                appt.employee.commissionBase,
            )) / 100;
        if (percent <= 0) {
            return null;
        }
        const record = this.repo.create({
            employee: { id: appt.employee.id } as any,
            appointment: { id: appt.id } as any,
            product: null,
            amount: Number(appt.service.price) * percent,
            percent: percent * 100,
        });
        const saved = await this.repo.save(record);
        await this.logs.create(
            LogAction.CommissionGranted,
            JSON.stringify({
                appointmentId: appt.id,
                amount: saved.amount,
                percent: saved.percent,
            }),
            appt.employee.id,
        );
        return saved;
    }
}
