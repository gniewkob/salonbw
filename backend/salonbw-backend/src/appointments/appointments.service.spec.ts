import { ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { FindOneOptions, UpdateResult } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';
import { CommissionsService } from '../commissions/commissions.service';

describe('AppointmentsService', () => {
    let service: AppointmentsService;
    let appointments: Appointment[];
    let users: User[];
    let services: SalonService[];
    let mockAppointmentsRepo: jest.Mocked<
        Pick<Repository<Appointment>, 'findOne' | 'create' | 'save' | 'update'>
    >;
    let mockUsersRepo: jest.Mocked<Pick<Repository<User>, 'findOne'>>;
    let mockServicesRepo: jest.Mocked<
        Pick<Repository<SalonService>, 'findOne'>
    >;
    let mockCommissionsService: jest.Mocked<
        Pick<CommissionsService, 'createFromAppointment'>
    >;
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
            findOne: jest.fn(({ where }: FindOneOptions<User>) => {
                const criteria = Array.isArray(where) ? where[0] : where;
                return Promise.resolve(
                    users.find((u) => u.id === criteria?.id) ?? null,
                );
            }),
        };

        mockServicesRepo = {
            findOne: jest.fn(({ where }: FindOneOptions<SalonService>) => {
                const criteria = Array.isArray(where) ? where[0] : where;
                return Promise.resolve(
                    services.find((s) => s.id === criteria?.id) ?? null,
                );
            }),
        };

        mockAppointmentsRepo = {
            findOne: jest.fn(({ where }: FindOneOptions<Appointment>) => {
                const criteria = Array.isArray(where) ? where[0] : where;
                if (criteria?.id !== undefined) {
                    return Promise.resolve(
                        appointments.find((a) => a.id === criteria.id) ?? null,
                    );
                }
                if (
                    criteria?.employee &&
                    criteria.startTime &&
                    criteria.endTime
                ) {
                    return Promise.resolve(
                        appointments.find(
                            (a) =>
                                a.employee.id === criteria.employee.id &&
                                a.status !== AppointmentStatus.Cancelled &&
                                a.startTime < criteria.startTime.value &&
                                a.endTime > criteria.endTime.value,
                        ) ?? null,
                    );
                }
                return Promise.resolve(null);
            }),
            create: jest
                .fn()
                .mockImplementation((data: Partial<Appointment>) => ({
                    id: nextId++,
                    status: AppointmentStatus.Scheduled,
                    ...data,
                })),
            save: jest.fn((appt: Appointment) => {
                appointments.push(appt);
                return Promise.resolve(appt);
            }),
            update: jest.fn((id: number, partial: Partial<Appointment>) => {
                const idx = appointments.findIndex((a) => a.id === id);
                if (idx >= 0) {
                    appointments[idx] = {
                        ...appointments[idx],
                        ...partial,
                    };
                }
                return Promise.resolve({
                    affected: idx >= 0 ? 1 : 0,
                } as UpdateResult);
            }),
        };

        mockCommissionsService = {
            createFromAppointment: jest.fn(),
        };

        service = new AppointmentsService(
            mockAppointmentsRepo as unknown as Repository<Appointment>,
            mockServicesRepo as unknown as Repository<SalonService>,
            mockUsersRepo as unknown as Repository<User>,
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
        expect(result.endTime.getTime()).toBe(start.getTime() + 30 * 60 * 1000);
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
        await expect(service.completeAppointment(id)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });
});
