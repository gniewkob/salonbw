import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    CommissionsService,
    DEFAULT_COMMISSION_BASE,
} from './commissions.service';
import { CommissionRecord } from './commission-record.entity';
import { CommissionRule, CommissionTargetType } from './commission-rule.entity';
import { Service } from '../catalog/service.entity';
import { Appointment } from '../appointments/appointment.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';

describe('CommissionsService', () => {
    let service: CommissionsService;
    let repo: { create: jest.Mock; save: jest.Mock };
    let ruleRepo: { findOne: jest.Mock };
    let apptRepo: { findOne: jest.Mock };
    let logs: { create: jest.Mock };

    beforeEach(async () => {
        repo = { create: jest.fn(), save: jest.fn() };
        ruleRepo = { findOne: jest.fn() };
        apptRepo = { findOne: jest.fn() };
        logs = { create: jest.fn() };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommissionsService,
                {
                    provide: getRepositoryToken(CommissionRecord),
                    useValue: repo,
                },
                {
                    provide: getRepositoryToken(CommissionRule),
                    useValue: ruleRepo,
                },
                {
                    provide: getRepositoryToken(Appointment),
                    useValue: apptRepo,
                },
                { provide: LogsService, useValue: logs },
            ],
        }).compile();

        service = module.get<CommissionsService>(CommissionsService);
    });

    it('getPercentForService uses service rule', async () => {
        ruleRepo.findOne.mockResolvedValue({ commissionPercent: 25 });
        const serviceObj = { id: 4, category: { id: 2 } } as Service;

        const result = await service.getPercentForService(1, serviceObj, 10);

        expect(ruleRepo.findOne).toHaveBeenCalledWith({
            where: {
                employee: { id: 1 },
                targetType: CommissionTargetType.Service,
                targetId: 4,
            },
        });
        expect(result).toBe(25);
    });

    it('getPercentForService falls back to category rule', async () => {
        ruleRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ commissionPercent: 15 });
        const serviceObj = { id: 4, category: { id: 3 } } as Service;

        const result = await service.getPercentForService(2, serviceObj, 5);

        expect(ruleRepo.findOne).toHaveBeenNthCalledWith(1, {
            where: {
                employee: { id: 2 },
                targetType: CommissionTargetType.Service,
                targetId: 4,
            },
        });
        expect(ruleRepo.findOne).toHaveBeenNthCalledWith(2, {
            where: {
                employee: { id: 2 },
                targetType: CommissionTargetType.Category,
                targetId: 3,
            },
        });
        expect(result).toBe(15);
    });

    it('getPercentForService uses default base when none provided', async () => {
        ruleRepo.findOne.mockResolvedValue(null);
        const serviceObj = { id: 8 } as Service;

        const result = await service.getPercentForService(2, serviceObj, null);

        expect(result).toBe(DEFAULT_COMMISSION_BASE);
    });

    it('calculateCommission saves record and logs', async () => {
        const appt: any = {
            id: 5,
            employee: { id: 7, commissionBase: 10 },
            service: { price: 50, defaultCommissionPercent: 15 },
        };
        apptRepo.findOne.mockResolvedValue(appt);
        jest.spyOn(service, 'getPercentForService').mockResolvedValue(10);
        repo.create.mockReturnValue({ amount: 5, percent: 10 });
        repo.save.mockResolvedValue({ amount: 5, percent: 10 });

        const result = await service.calculateCommission(5);

        expect(apptRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
        expect(service.getPercentForService).toHaveBeenCalledWith(
            7,
            appt.service,
            10,
        );
        expect(repo.save).toHaveBeenCalled();
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CommissionGranted,
            JSON.stringify({ appointmentId: 5, amount: 5, percent: 10 }),
            7,
        );
        expect(result).toEqual({ amount: 5, percent: 10 });
    });

    it('returns service-specific commission when rule exists', async () => {
        ruleRepo.findOne.mockResolvedValueOnce({ commissionPercent: 20 });
        const serviceObj = { id: 1, category: { id: 2 } } as Service;

        const result = await service.getPercentForService(3, serviceObj, 10);

        expect(result).toBe(20);
    });

    it('returns category commission when service rule missing', async () => {
        ruleRepo.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ commissionPercent: 15 });
        const serviceObj = { id: 5, category: { id: 2 } } as Service;

        const result = await service.getPercentForService(3, serviceObj, 10);

        expect(result).toBe(15);
    });

    it('returns base commission when no matching rules', async () => {
        ruleRepo.findOne.mockResolvedValue(null);
        const serviceObj = { id: 6, category: { id: 9 } } as Service;

        const result = await service.getPercentForService(3, serviceObj, 10);

        expect(result).toBe(10);
    });
});
