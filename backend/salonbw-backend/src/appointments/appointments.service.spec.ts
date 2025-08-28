import { ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { UpdateResult } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Role } from '../users/role.enum';
import { Service as SalonService } from '../services/service.entity';
import { User } from '../users/user.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WhatsappService } from '../notifications/whatsapp.service';

describe('AppointmentsService', () => {
    let service: AppointmentsService;
    let appointments: Appointment[];
    let users: User[];
    let services: SalonService[];
    let mockAppointmentsRepo: jest.Mocked<Repository<Appointment>>;
    let mockUsersRepo: jest.Mocked<Repository<User>>;
    let mockServicesRepo: jest.Mocked<Repository<SalonService>>;
    let mockCommissionsService: jest.Mocked<CommissionsService>;
    let mockLogService: jest.Mocked<LogService>;
    let mockWhatsappService: jest.Mocked<WhatsappService>;
    let logActionSpy: jest.SpyInstance;
    let nextId: number;
    let sendFollowUpMock: jest.Mock;
    let transactionMock: jest.Mock;
    let createFromAppointmentMock: jest.Mock;

    beforeEach(() => {
        appointments = [];
        users = [
            {
                id: 1,
                role: Role.Client,
                email: '',
                password: '',
                name: '',
                phone: '123',
                receiveNotifications: true,
            },
            {
                id: 2,
                role: Role.Employee,
                email: '',
                password: '',
                name: '',
                phone: '456',
                receiveNotifications: true,
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
            [unknown, number, Partial<Appointment>]
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
                transaction: jest.fn<
                    Promise<unknown>,
                    [(em: { update: typeof managerUpdate }) => Promise<unknown>]
                >(async (cb) => {
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
            createFromAppointment: jest.fn<
                Promise<unknown>,
                [Appointment, User, unknown]
            >(() => Promise.resolve({})),
        } as Partial<CommissionsService> as jest.Mocked<CommissionsService>;

        mockLogService = {
            logAction: jest.fn(),
        } as Partial<LogService> as jest.Mocked<LogService>;

        mockWhatsappService = {
            sendBookingConfirmation: jest.fn<
                Promise<void>,
                [string, string, string]
            >(() => Promise.resolve()),
            sendReminder: jest.fn<Promise<void>, [string, string, string]>(),
            sendFollowUp: jest.fn<Promise<void>, [string, string, string]>(() =>
                Promise.resolve(),
            ),
        } as Partial<WhatsappService> as jest.Mocked<WhatsappService>;

        sendFollowUpMock = mockWhatsappService.sendFollowUp.bind(
            mockWhatsappService,
        ) as jest.Mock;
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Object.assign(sendFollowUpMock, mockWhatsappService.sendFollowUp);

        transactionMock = mockAppointmentsRepo.manager.transaction.bind(
            mockAppointmentsRepo.manager,
        ) as jest.Mock;

        Object.assign(
            transactionMock,

            mockAppointmentsRepo.manager.transaction.bind(
                mockAppointmentsRepo.manager,
            ) as jest.Mock,
        );
        Object.assign(
            transactionMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockAppointmentsRepo.manager.transaction,
        );

        createFromAppointmentMock =
            mockCommissionsService.createFromAppointment.bind(
                mockCommissionsService,
            ) as jest.Mock;
        Object.assign(
            createFromAppointmentMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockCommissionsService.createFromAppointment,
        );

        service = new AppointmentsService(
            mockAppointmentsRepo,
            mockServicesRepo,
            mockUsersRepo,
            mockCommissionsService,
            mockLogService,
            mockWhatsappService,
        );
        logActionSpy = jest.spyOn(mockLogService, 'logAction');
    });

    it('should create an appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );

        expect(result.id).toBeDefined();
        expect(result.endTime.getTime()).toBe(start.getTime() + 30 * 60 * 1000);
        expect(appointments).toHaveLength(1);
        expect(logActionSpy).toHaveBeenCalledWith(
            users[0],
            LogAction.APPOINTMENT_CREATED,
            expect.objectContaining({ id: result.id }),
        );

        const date = start.toISOString().split('T')[0];
        const time = start.toISOString().split('T')[1].slice(0, 5);
        expect(sendBookingConfirmationMock).toHaveBeenCalledWith(
            users[0].phone,
            date,
            time,
        );
        expect(
            mockAppointmentsRepo.save.mock.invocationCallOrder[0],
        ).toBeLessThan(sendBookingConfirmationMock.mock.invocationCallOrder[0]);
    });

    it('should not send booking confirmation if client has no phone', async () => {
        users[0].phone = null;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );
        expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    });

    it('should not send booking confirmation if client disabled notifications', async () => {
        users[0].receiveNotifications = false;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const sendBookingConfirmationMock =
            mockWhatsappService.sendBookingConfirmation.bind(
                mockWhatsappService,
            ) as jest.Mock;

        Object.assign(
            sendBookingConfirmationMock,
            // eslint-disable-next-line @typescript-eslint/unbound-method
            mockWhatsappService.sendBookingConfirmation,
        );
        expect(sendBookingConfirmationMock).not.toHaveBeenCalled();
    });

    it('should create an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const result = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        expect(result.id).toBeDefined();
        expect(appointments).toHaveLength(1);
    });

    it('should reject overlapping appointments', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const overlap = new Date(start.getTime() + 15 * 60 * 1000);
        await expect(
            service.create(
                {
                    client: users[0],
                    employee: users[1],
                    service: services[0],
                    startTime: overlap,
                },
                users[0],
            ),
        ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should cancel a scheduled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        const cancelled = await service.cancel(id, users[0]);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
        expect(mockAppointmentsRepo.update.mock.calls[0]).toEqual([
            id,
            { status: AppointmentStatus.Cancelled },
        ]);
        expect(logActionSpy).toHaveBeenNthCalledWith(
            2,
            users[0],
            LogAction.APPOINTMENT_CANCELLED,
            expect.objectContaining({
                appointmentId: id,
                status: AppointmentStatus.Cancelled,
            }),
        );
    });

    it('should cancel an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const cancelled = await service.cancel(id, users[0]);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
    });

    it('should not cancel a completed appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        await expect(service.cancel(id, users[0])).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not cancel an already cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.cancel(id, users[0]);
        await expect(service.cancel(id, users[0])).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should not complete a cancelled appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.cancel(id, users[0]);
        await expect(
            service.completeAppointment(id, users[1]),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should revert completion if commission creation fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        createFromAppointmentMock.mockRejectedValueOnce(new Error('fail'));

        await expect(service.completeAppointment(id, users[1])).rejects.toThrow(
            'fail',
        );
        const appt = await service.findOne(id);
        expect(appt?.status).toBe(AppointmentStatus.Scheduled);
    });

    it('should complete an appointment even if logging fails', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        logActionSpy.mockRejectedValueOnce(new Error('fail'));
        const completed = await service.completeAppointment(id, users[1]);
        expect(completed?.status).toBe(AppointmentStatus.Completed);
    });

    it('should log when completing an appointment', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        expect(logActionSpy).toHaveBeenNthCalledWith(
            2,
            users[1],
            LogAction.APPOINTMENT_COMPLETED,
            expect.objectContaining({
                appointmentId: id,
                status: AppointmentStatus.Completed,
            }),
        );
        const date = start.toISOString().split('T')[0];
        const time = start.toISOString().split('T')[1].slice(0, 5);
        expect(sendFollowUpMock).toHaveBeenCalledWith(
            users[0].phone,
            date,
            time,
        );
        expect(transactionMock.mock.invocationCallOrder[0]).toBeLessThan(
            sendFollowUpMock.mock.invocationCallOrder[0],
        );
    });

    it('should not send follow up if client has no phone', async () => {
        users[0].phone = null;
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        expect(sendFollowUpMock).not.toHaveBeenCalled();
    });

    it('should not send follow up if client disabled notifications', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        users[0].receiveNotifications = false;
        await service.completeAppointment(id, users[1]);
        expect(sendFollowUpMock).not.toHaveBeenCalled();
    });

    it('should not create duplicate commissions when completing twice', async () => {
        const start = new Date(Date.now() + 60 * 60 * 1000);
        const { id } = await service.create(
            {
                client: users[0],
                employee: users[1],
                service: services[0],
                startTime: start,
            },
            users[0],
        );

        await service.completeAppointment(id, users[1]);
        const calls = createFromAppointmentMock.mock.calls.length;
        await expect(
            service.completeAppointment(id, users[1]),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(createFromAppointmentMock.mock.calls.length).toBe(calls);
    });
});
