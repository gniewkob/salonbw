import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionsService } from './commissions.service';
import { CommissionRecord } from './commission-record.entity';
import { CommissionRule, CommissionTargetType } from './commission-rule.entity';
import { Service } from '../catalog/service.entity';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let repo: { create: jest.Mock; save: jest.Mock };
  let ruleRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn() };
    ruleRepo = { findOne: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: getRepositoryToken(CommissionRecord), useValue: repo },
        { provide: getRepositoryToken(CommissionRule), useValue: ruleRepo },
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
});
