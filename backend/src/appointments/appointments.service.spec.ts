import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    ConflictException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { UpdateAppointmentParams } from './dto/update-appointment-params';
import { FormulasService } from '../formulas/formulas.service';
import { CommissionsService } from '../commissions/commissions.service';
import { CommissionRecord } from '../commissions/commission-record.entity';
import { LogsService } from '../logs/logs.service';
import { LogAction } from '../logs/action.enum';
import { Role } from '../users/role.enum';
import { NotificationsService } from '../notifications/notifications.service';

describe('AppointmentsService', () => {
    let service: AppointmentsService;
    let repo: {
        create: jest.Mock;
        save: jest.Mock;
        find: jest.Mock;
        delete: jest.Mock;
        findOne: jest.Mock;
        manager: { findOne: jest.Mock };
    };
    let formulas: { create: jest.Mock };
    let commissions: {
        getPercentForService: jest.Mock;
        calculateCommission: jest.Mock;
    };
    let logs: { create: jest.Mock };
    let notifications: {
        sendAppointmentConfirmation: jest.Mock;
        sendThankYou: jest.Mock;
        sendNotification: jest.Mock;
    };

    beforeEach(async () => {
        repo = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            manager: { findOne: jest.fn() },
        };
        formulas = { create: jest.fn() };
        commissions = {
            getPercentForService: jest.fn(),
            calculateCommission: jest.fn(),
        };
        logs = { create: jest.fn() };
        notifications = {
            sendAppointmentConfirmation: jest.fn(),
            sendThankYou: jest.fn(),
            sendNotification: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AppointmentsService,
                { provide: getRepositoryToken(Appointment), useValue: repo },
                { provide: getRepositoryToken(CommissionRecord), useValue: {} },
                { provide: FormulasService, useValue: formulas },
                { provide: CommissionsService, useValue: commissions },
                { provide: LogsService, useValue: logs },
                { provide: NotificationsService, useValue: notifications },
            ],
        }).compile();

        service = module.get<AppointmentsService>(AppointmentsService);
    });

    it('create builds and saves a new appointment', async () => {
        const created: any = {
            id: 1,
            client: { phone: '111' },
            employee: { phone: '222' },
            startTime: new Date('2100-07-01T10:00:00.000Z'),
        };
        repo.create.mockReturnValue(created);
        repo.save.mockResolvedValue(created);
        repo.manager.findOne.mockResolvedValue({ id: 3, duration: 30 });
        repo.find.mockResolvedValue([]);

        const result = await service.create(
            1,
            2,
            3,
            '2100-07-01T10:00:00.000Z',
        );

        expect(repo.create).toHaveBeenCalledWith({
            client: { id: 1 },
            employee: { id: 2 },
            service: { id: 3 },
            startTime: new Date('2100-07-01T10:00:00.000Z'),
            status: AppointmentStatus.Scheduled,
        });
        expect(repo.save).toHaveBeenCalledWith(created);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CreateAppointment,
            JSON.stringify({
                clientId: 1,
                employeeId: 2,
                serviceId: 3,
                startTime: '2100-07-01T10:00:00.000Z',
            }),
            1,
        );
        expect(notifications.sendAppointmentConfirmation).toHaveBeenCalled();
        expect(result).toBe(created);
    });

    it('create rejects overlapping appointment for employee', async () => {
        repo.manager.findOne.mockResolvedValue({ id: 3, duration: 30 });
        repo.find.mockResolvedValue([
            {
                id: 9,
                startTime: new Date('2100-07-01T10:15:00.000Z'),
                service: { duration: 30 },
                employee: { id: 2 },
                client: { id: 99 },
            },
        ]);
        await expect(
            service.create(1, 2, 3, '2100-07-01T10:00:00.000Z'),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(repo.create).not.toHaveBeenCalled();
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('create rejects overlapping appointment for client', async () => {
        repo.manager.findOne.mockResolvedValue({ id: 3, duration: 30 });
        repo.find.mockResolvedValue([
            {
                id: 9,
                startTime: new Date('2100-07-01T10:15:00.000Z'),
                service: { duration: 30 },
                employee: { id: 99 },
                client: { id: 1 },
            },
        ]);
        await expect(
            service.create(1, 2, 3, '2100-07-01T10:00:00.000Z'),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(repo.create).not.toHaveBeenCalled();
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('findClientAppointments queries by client id', async () => {
        repo.find.mockResolvedValue([]);
        await service.findClientAppointments(4);
        expect(repo.find).toHaveBeenCalledWith({
            where: { client: { id: 4 } },
        });
    });

    it('update modifies existing appointment', async () => {
        const existing: any = {
            id: 2,
            status: AppointmentStatus.Scheduled,
            employee: { id: 5 },
            client: { id: 6 },
            service: { duration: 30 },
            startTime: new Date('2100-01-01T10:00:00.000Z'),
        };
        repo.findOne.mockResolvedValue(existing);
        repo.save.mockResolvedValue(existing);

        const updateParams: UpdateAppointmentParams = {
            status: AppointmentStatus.Completed,
            notes: 'done',
        };

        await service.update(2, updateParams);

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
        commissions.calculateCommission.mockResolvedValue({
            amount: 6,
            percent: 15,
        } as any);

        const result = await service.complete(3);

        expect(appt.status).toBe(AppointmentStatus.Completed);
        expect(commissions.calculateCommission).toHaveBeenCalledWith(3);
        expect(repo.save).toHaveBeenCalledWith(appt);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CompleteAppointment,
            JSON.stringify({
                appointmentId: 3,
                commissionAmount: 6,
                percent: 15,
            }),
        );
        expect(result).toEqual({
            appointment: appt,
            commission: { amount: 6, percent: 15 },
        });
    });

    it('remove calls repository delete', async () => {
        repo.delete.mockResolvedValue({});
        await service.remove(5);
        expect(repo.delete).toHaveBeenCalledWith(5);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.DeleteAppointment,
            JSON.stringify({ appointmentId: 5 }),
        );
    });

    it('update rejects past start time', async () => {
        const existing: any = {
            id: 1,
            employee: { id: 2 },
            service: { duration: 30 },
            client: { id: 3 },
            startTime: new Date('2100-01-01T10:00:00.000Z'),
        };
        repo.findOne.mockResolvedValue(existing);
        await expect(
            service.update(1, { startTime: '2000-01-01T00:00:00.000Z' }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.save).not.toHaveBeenCalled();
    });

    it('update rejects conflicting appointment', async () => {
        const existing: any = {
            id: 1,
            employee: { id: 2 },
            service: { duration: 30 },
            startTime: new Date('2100-01-01T10:00:00.000Z'),
            client: { id: 3 },
        };
        const other: any = {
            id: 2,
            employee: { id: 2 },
            service: { duration: 30 },
            startTime: new Date('2100-01-01T10:15:00.000Z'),
            client: { id: 4 },
        };
        repo.findOne.mockResolvedValue(existing);
        repo.find.mockResolvedValue([existing, other]);
        await expect(
            service.update(1, { startTime: '2100-01-01T10:20:00.000Z' }),
        ).rejects.toBeInstanceOf(ConflictException);
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

    it('cancel logs action', async () => {
        const appt: any = {
            id: 2,
            status: AppointmentStatus.Scheduled,
            client: { id: 1 },
            employee: { id: 3 },
        };
        repo.findOne.mockResolvedValue(appt);
        repo.save.mockResolvedValue(appt);

        await service.cancel(2, 1, Role.Client);

        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CancelAppointment,
            JSON.stringify({ appointmentId: 2, userId: 1 }),
            1,
        );
    });

    it('complete saves status and commission', async () => {
        const appt: any = {
            id: 2,
            status: AppointmentStatus.Scheduled,
            client: { id: 2, phone: '111' },
            employee: { id: 3, commissionBase: 10 },
            service: { price: 100, defaultCommissionPercent: 15 },
            startTime: new Date('2100-07-01T10:00:00.000Z'),
        };
        repo.findOne.mockResolvedValue(appt);
        repo.save.mockResolvedValue(appt);
        commissions.calculateCommission.mockResolvedValue({
            amount: 10,
            percent: 10,
        } as any);

        const result = await service.complete(2, 3, Role.Employee);

        expect(appt.status).toBe(AppointmentStatus.Completed);
        expect(commissions.calculateCommission).toHaveBeenCalledWith(2);
        expect(repo.save).toHaveBeenCalledWith(appt);
        expect(logs.create).toHaveBeenCalledWith(
            LogAction.CompleteAppointment,
            JSON.stringify({
                appointmentId: 2,
                commissionAmount: 10,
                percent: 10,
            }),
            3,
        );
        expect(notifications.sendThankYou).toHaveBeenCalled();
        expect(result).toEqual({
            appointment: appt,
            commission: { amount: 10, percent: 10 },
        });
    });
});
