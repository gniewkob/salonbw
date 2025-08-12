import { ConflictException, BadRequestException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';

describe('AppointmentsService', () => {
    let service: AppointmentsService;
    let appointments: Appointment[];
    let users: User[];
    let services: SalonService[];
    let mockAppointmentsRepo: any;
    let mockUsersRepo: any;
    let mockServicesRepo: any;
    let mockCommissionsService: any;
    let nextId: number;

    beforeEach(() => {
        appointments = [];
        users = [
            { id: 1, role: Role.Client } as User,
            { id: 2, role: Role.Employee } as User,
        ];
        services = [{ id: 1, duration: 30 } as SalonService];
        nextId = 1;

        mockUsersRepo = {
            findOne: jest
                .fn()
                .mockImplementation(({ where }) =>
                    users.find((u) => u.id === where.id) ?? null,
                ),
        };

        mockServicesRepo = {
            findOne: jest
                .fn()
                .mockImplementation(({ where }) =>
                    services.find((s) => s.id === where.id) ?? null,
                ),
        };

        mockAppointmentsRepo = {
            findOne: jest.fn().mockImplementation(({ where }) => {
                if (where?.id !== undefined) {
                    return appointments.find((a) => a.id === where.id) ?? null;
                }
                if (where?.employee) {
                    return (
                        appointments.find(
                            (a) =>
                                a.employee.id === where.employee.id &&
                                a.status !== AppointmentStatus.Cancelled &&
                                a.startTime < where.startTime._value &&
                                a.endTime > where.endTime._value,
                        ) ?? null
                    );
                }
                return null;
            }),
            create: jest.fn().mockImplementation((data) => ({
                id: nextId++,
                status: AppointmentStatus.Scheduled,
                ...data,
            })),
            save: jest.fn().mockImplementation((appt) => {
                appointments.push(appt);
                return appt;
            }),
            update: jest.fn().mockImplementation((id, partial) => {
                const idx = appointments.findIndex((a) => a.id === id);
                if (idx >= 0) {
                    appointments[idx] = { ...appointments[idx], ...partial };
                }
            }),
        };

        mockCommissionsService = {
            createFromAppointment: jest.fn(),
        };

        service = new AppointmentsService(
            mockAppointmentsRepo,
            mockServicesRepo,
            mockUsersRepo,
            mockCommissionsService,
        );
    });

    it('should create an appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const result = await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        expect(result.id).toBeDefined();
        expect(result.endTime.getTime()).toBe(
            start.getTime() + 30 * 60 * 1000,
        );
        expect(appointments).toHaveLength(1);
    });

    it('should reject overlapping appointments', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        await expect(
            service.create({
                client: { id: 1 } as User,
                employee: { id: 2 } as User,
                service: { id: 1 } as SalonService,
                startTime: overlap,
            }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should cancel a scheduled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        const cancelled = await service.cancel(id);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
    });

    it('should not cancel a completed appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        await service.completeAppointment(id);
        await expect(service.cancel(id)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not cancel an already cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        await service.cancel(id);
        await expect(service.cancel(id)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not complete a cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: { id: 1 } as User,
            employee: { id: 2 } as User,
            service: { id: 1 } as SalonService,
            startTime: start,
        });

        await service.cancel(id);
        await expect(
            service.completeAppointment(id),
        ).rejects.toBeInstanceOf(BadRequestException);
    });
});
