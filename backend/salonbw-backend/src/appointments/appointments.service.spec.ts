import { ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { UpdateResult } from 'typeorm';
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
    let mockAppointmentsRepo: jest.Mocked<Repository<Appointment>>;
    let mockUsersRepo: jest.Mocked<Repository<User>>;
    let mockServicesRepo: jest.Mocked<Repository<SalonService>>;
    let mockCommissionsService: jest.Mocked<CommissionsService>;
    let nextId: number;

    beforeEach(() => {
        appointments = [];
        users = [
            {
                id: 1,
                role: Role.Client,
                email: '',
                password: '',
                name: '',
            },
            {
                id: 2,
                role: Role.Employee,
                email: '',
                password: '',
                name: '',
            },
        ];
        services = [
            {
                id: 1,
                duration: 30,
                name: '',
                description: '',
                price: 0,
            },
        ];
        nextId = 1;

        mockUsersRepo = {
            findOne: jest.fn<Promise<User | null>, [{ where: { id: number } }]>(
                ({ where }) =>
                    Promise.resolve(
                        users.find((u) => u.id === where.id) ?? null,
                    ),
            ),
        } as Partial<Repository<User>> as jest.Mocked<Repository<User>>;

        mockServicesRepo = {
            findOne: jest.fn<
                Promise<SalonService | null>,
                [{ where: { id: number } }]
            >(({ where }) =>
                Promise.resolve(
                    services.find((s) => s.id === where.id) ?? null,
                ),
            ),
        } as Partial<Repository<SalonService>> as jest.Mocked<
            Repository<SalonService>
        >;

        const update = jest.fn<
            Promise<UpdateResult>,
            [number, Partial<Appointment>]
        >((id, partial) => {
            const idx = appointments.findIndex((a) => a.id === id);
            if (idx >= 0) {
                appointments[idx] = { ...appointments[idx], ...partial };
            }
            return Promise.resolve({
                affected: idx >= 0 ? 1 : 0,
            } as UpdateResult);
        });

        const repoUpdate = jest.fn<
            Promise<UpdateResult>,
            [number, Partial<Appointment>]
        >((id, partial) => {
            const idx = appointments.findIndex((a) => a.id === id);
            if (idx >= 0) {
                appointments[idx] = { ...appointments[idx], ...partial };
            }
            return Promise.resolve({
                affected: idx >= 0 ? 1 : 0,
            } as UpdateResult);
        });

        const managerUpdate = jest.fn<
            Promise<UpdateResult>,
            [any, number, Partial<Appointment>]
        >((_entity, id, partial) => repoUpdate(id, partial));

        mockAppointmentsRepo = {
            findOne: jest.fn<
                Promise<Appointment | null>,
                [
                    | number
                    | {
                          where?: {
                              id?: number;
                              employee?: { id: number };
                              startTime?: { _value: Date };
                              endTime?: { _value: Date };
                          };
                      },
                ]
            >((criteria) => {
                if (typeof criteria === 'number') {
                    return Promise.resolve(
                        appointments.find((a) => a.id === criteria) ?? null,
                    );
                }
                const { where } = criteria;
                if (where?.id !== undefined) {
                    return Promise.resolve(
                        appointments.find((a) => a.id === where.id) ?? null,
                    );
                }
                if (where?.employee) {
                    return Promise.resolve(
                        appointments.find(
                            (a) =>
                                a.employee.id === where.employee.id &&
                                a.status !== AppointmentStatus.Cancelled &&
                                a.startTime < (where.startTime?._value ?? 0) &&
                                a.endTime > (where.endTime?._value ?? 0),
                        ) ?? null,
                    );
                }
                return Promise.resolve(null);
            }),
            create: jest.fn<Appointment, [Partial<Appointment>]>((data) => ({
                id: nextId++,
                status: AppointmentStatus.Scheduled,
                ...data,
            })),
            save: jest.fn<Promise<Appointment>, [Appointment]>((appt) => {
                appointments.push(appt);
                return Promise.resolve(appt);
            }),
            update: repoUpdate,
            manager: {
                transaction: jest.fn(async (cb: any) => {
                    const snapshot = appointments.map((a) => ({ ...a }));
                    try {
                        return await cb({ update: managerUpdate });
                    } catch (e) {
                        appointments = snapshot;
                        throw e;
                    }
                }),
            },
        } as Partial<Repository<Appointment>> as jest.Mocked<
            Repository<Appointment>
        >;

        mockCommissionsService = {
            createFromAppointment: jest.fn<Promise<void>, [Appointment]>(() =>
                Promise.resolve(),
            ),
        } as Partial<CommissionsService> as jest.Mocked<CommissionsService>;

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
            client: users[0],
            employee: users[1],
            service: services[0],
            startTime: start,
        });

        expect(result.id).toBeDefined();
        expect(result.endTime.getTime()).toBe(start.getTime() + 30 * 60 * 1000);
        expect(appointments).toHaveLength(1);
    });

    it('should reject overlapping appointments', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create({
            client: users[0],
            employee: users[1],
            service: services[0],
            startTime: start,
        });

        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        await expect(
            service.create({
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: overlap,
            }),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should cancel a scheduled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: users[0],
            employee: users[1],
            service: services[0],
            startTime: start,
        });

        const cancelled = await service.cancel(id);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
        expect(mockAppointmentsRepo.update.mock.calls[0]).toEqual([
            id,
            { status: AppointmentStatus.Cancelled },
        ]);
    });

    it('should not cancel a completed appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: users[0],
            employee: users[1],
            service: services[0],
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
            client: users[0],
            employee: users[1],
            service: services[0],
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
            client: users[0],
            employee: users[1],
            service: services[0],
            startTime: start,
        });

        await service.cancel(id);
        await expect(service.completeAppointment(id)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should revert completion if commission creation fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create({
            client: users[0],
            employee: users[1],
            service: services[0],
            startTime: start,
        });

        mockCommissionsService.createFromAppointment.mockRejectedValueOnce(
            new Error('fail'),
        );

        await expect(service.completeAppointment(id)).rejects.toThrow('fail');
        const appt = await service.findOne(id);
        expect(appt?.status).toBe(AppointmentStatus.Scheduled);
    });
});
