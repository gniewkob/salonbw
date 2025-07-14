import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { Role } from '../users/role.enum';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let formulas: { create: jest.Mock };
  let commissions: { createForAppointment: jest.Mock };
  let commissionRepo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), delete: jest.fn() };
    formulas = { create: jest.fn() };
    commissions = { createForAppointment: jest.fn() };
    commissionRepo = { create: jest.fn(), save: jest.fn() };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: repo },
        { provide: getRepositoryToken(CommissionRecord), useValue: commissionRepo },
        { provide: FormulasService, useValue: formulas },
        { provide: CommissionsService, useValue: commissions },

      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('create builds and saves a new appointment', async () => {
    const created = { id: 1 } as Appointment;
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);

    const result = await service.create(1, 2, 3, '2025-07-01T10:00:00.000Z');

    expect(repo.create).toHaveBeenCalledWith({
      client: { id: 1 },
      employee: { id: 2 },
      service: { id: 3 },
      startTime: new Date('2025-07-01T10:00:00.000Z'),
      status: AppointmentStatus.Scheduled,
    });
    expect(repo.save).toHaveBeenCalledWith(created);
    expect(result).toBe(created);
  });

  it('create rejects conflicting appointment', async () => {
    repo.findOne.mockResolvedValue({ id: 9 });
    await expect(
      service.create(1, 2, 3, '2025-07-01T10:00:00.000Z'),
    ).rejects.toThrow(ConflictException);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: {
        employee: { id: 2 },
        startTime: new Date('2025-07-01T10:00:00.000Z'),
      },
    });
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('findClientAppointments queries by client id', async () => {
    repo.find.mockResolvedValue([]);
    await service.findClientAppointments(4);
    expect(repo.find).toHaveBeenCalledWith({ where: { client: { id: 4 } } });
  });

  it('update modifies existing appointment', async () => {
    const existing: any = { id: 2, status: AppointmentStatus.Scheduled };
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockResolvedValue(existing);

    await service.update(2, { status: AppointmentStatus.Completed, notes: 'done' });

    expect(existing.status).toBe(AppointmentStatus.Completed);
    expect(existing.notes).toBe('done');
    expect(repo.save).toHaveBeenCalledWith(existing);
  });

  it('complete sets status and records commission', async () => {
    const appt: any = {
      id: 3,
      status: AppointmentStatus.Scheduled,
      service: { price: 40, defaultCommissionPercent: 0.15 },
      employee: { id: 5 },
    };
    repo.findOne.mockResolvedValue(appt);
    repo.save.mockResolvedValue(appt);
    commissionRepo.create.mockReturnValue({});

    await service.complete(3);

    expect(appt.status).toBe(AppointmentStatus.Completed);
    expect(repo.save).toHaveBeenCalledWith(appt);
    expect(commissionRepo.save).toHaveBeenCalled();
  });

  it('remove calls repository delete', async () => {
    repo.delete.mockResolvedValue({});
    await service.remove(5);
    expect(repo.delete).toHaveBeenCalledWith(5);
  });

  it('cancel updates status when authorized', async () => {
    const appt: any = {
      id: 1,
      status: AppointmentStatus.Scheduled,
      client: { id: 2 },
      employee: { id: 3 },
    };
    repo.findOne.mockResolvedValue(appt);
    repo.save.mockResolvedValue(appt);

    await service.cancel(1, 2, Role.Client);
    expect(appt.status).toBe(AppointmentStatus.Cancelled);
    expect(repo.save).toHaveBeenCalledWith(appt);
  });

  it('complete saves status and commission', async () => {
    const appt: any = {
      id: 2,
      status: AppointmentStatus.Scheduled,
      client: { id: 2 },
      employee: { id: 3, commissionBase: 10 },
      service: { price: 100, defaultCommissionPercent: 15 },
    };
    repo.findOne.mockResolvedValue(appt);
    repo.save.mockResolvedValue(appt);
    commissionRepo.create.mockReturnValue({});
    commissionRepo.save.mockResolvedValue({});

    await service.complete(2, 3, Role.Employee);

    expect(appt.status).toBe(AppointmentStatus.Completed);
    expect(repo.save).toHaveBeenCalledWith(appt);
    expect(commissionRepo.save).toHaveBeenCalled();
  });
});
