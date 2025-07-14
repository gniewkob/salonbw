import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionsService } from '../commissions/commissions.service';

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

  beforeEach(async () => {
    repo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOne: jest.fn(), delete: jest.fn() };
    formulas = { create: jest.fn() };
    commissions = { createForAppointment: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: repo },
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

    await service.complete(3);

    expect(appt.status).toBe(AppointmentStatus.Completed);
    expect(repo.save).toHaveBeenCalledWith(appt);
    expect(commissions.createForAppointment).toHaveBeenCalledWith(appt);
  });

  it('remove calls repository delete', async () => {
    repo.delete.mockResolvedValue({});
    await service.remove(5);
    expect(repo.delete).toHaveBeenCalledWith(5);
  });
});
