import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Commission } from './commission.entity';
import { CommissionRule } from './commission-rule.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { User } from '../users/user.entity';
import { Service as SalonService } from '../services/service.entity';

@Injectable()
export class CommissionsService {
    constructor(
        @InjectRepository(Commission)
        private readonly commissionsRepository: Repository<Commission>,
        @InjectRepository(CommissionRule)
        private readonly commissionRulesRepository: Repository<CommissionRule>,
        private readonly logService: LogService,
    ) {}

    async create(
        data: Partial<Commission>,
        user: User,
        manager?: EntityManager,
    ): Promise<Commission> {
        const repo = manager
            ? manager.getRepository(Commission)
            : this.commissionsRepository;
        const commission = repo.create(data);
        const saved = await repo.save(commission);
        try {
            await this.logService.logAction(
                user,
                LogAction.COMMISSION_CREATED,
                {
                    commissionId: saved.id,
                    appointmentId: saved.appointment?.id,
                    employeeId: saved.employee?.id,
                    amount: saved.amount,
                },
            );
        } catch (error) {
            console.error('Failed to log commission creation action', error);
        }
        return saved;
    }

    async resolveCommissionPercent(
        employee: User,
        service: SalonService,
    ): Promise<number> {
        const ruleForService = await this.commissionRulesRepository.findOne({
            where: {
                employee: { id: employee.id },
                service: { id: service.id },
            },
        });
        if (ruleForService) {
            return Number(ruleForService.commissionPercent);
        }
        if (service.category) {
            const ruleForCategory =
                await this.commissionRulesRepository.findOne({
                    where: {
                        employee: { id: employee.id },
                        category: service.category,
                    },
                });
            if (ruleForCategory) {
                return Number(ruleForCategory.commissionPercent);
            }
        }
        return Number(employee.commissionBase ?? 0);
    }

    async calculateAndSaveCommission(
        employee: User,
        service: SalonService,
        appointment: Appointment | null,
        user: User,
        manager?: EntityManager,
    ): Promise<Commission> {
        const repo = manager
            ? manager.getRepository(Commission)
            : this.commissionsRepository;
        if (appointment) {
            const existing = await repo.findOne({
                where: { appointment: { id: appointment.id } },
            });
            if (existing) {
                return existing;
            }
        }
        const price = Number(service.price);
        const percent = await this.resolveCommissionPercent(employee, service);
        const amount = (price * percent) / 100;
        return this.create(
            {
                employee,
                appointment,
                amount,
                percent,
            },
            user,
            manager,
        );
    }

    async createFromAppointment(
        appointment: Appointment,
        user: User,
        manager?: EntityManager,
    ): Promise<Commission> {
        return this.calculateAndSaveCommission(
            appointment.employee,
            appointment.service,
            appointment,
            user,
            manager,
        );
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
