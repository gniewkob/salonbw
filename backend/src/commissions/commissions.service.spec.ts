import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionsService } from './commissions.service';
import { CommissionRecord } from './commission-record.entity';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Service } from '../catalog/service.entity';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let repo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        { provide: getRepositoryToken(CommissionRecord), useValue: repo },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
  });

  it('createForAppointment builds and saves a commission record', async () => {
    const appt = {
      id: 1,
      service: { price: 50, defaultCommissionPercent: 0.2 } as Service,
      employee: { id: 2 } as User,
    } as Appointment;
    const created = { id: 99 } as CommissionRecord;
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const result = await service.createForAppointment(appt);

    expect(repo.create).toHaveBeenCalledWith({
      employee: appt.employee,
      appointment: appt,
      product: null,
      amount: appt.service.price,
      percent: appt.service.defaultCommissionPercent,
    });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });
});
