import { ConflictException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { UpdateResult } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { Role } from '../users/role.enum';
import { Service as SalonService, PriceType } from '../services/service.entity';
import { ServiceVariant } from '../services/entities/service-variant.entity';
import { User } from '../users/user.entity';
import { CommissionsService } from '../commissions/commissions.service';
import { LogService } from '../logs/log.service';
import { LogAction } from '../logs/log-action.enum';
import { WhatsappService } from '../notifications/whatsapp.service';

export interface AppointmentsTestContext {
    service: AppointmentsService;
    appointments: Appointment[];
    users: User[];
    services: SalonService[];
    mockAppointmentsRepo: jest.Mocked<Repository<Appointment>>;
    mockServicesRepo: jest.Mocked<Repository<SalonService>>;
    mockWhatsappService: jest.Mocked<WhatsappService>;
    logActionSpy: jest.SpyInstance;
    sendFollowUpMock: jest.Mock;
    transactionMock: jest.Mock;
    createFromAppointmentMock: jest.Mock;
}

export function createAppointmentsTestContext(): AppointmentsTestContext {
    const appointments: Appointment[] = [];
    const now = new Date();
    const users: User[] = [
        {
            id: 1,
            role: Role.Client,
            email: '',
            password: '',
            name: '',
            phone: '123',
            receiveNotifications: true,
            commissionBase: 0,
            smsConsent: true,
            emailConsent: true,
            gdprConsent: true,
            createdAt: now,
            updatedAt: now,
        },
        {
            id: 2,
            role: Role.Employee,
            email: '',
            password: '',
            name: '',
            phone: '456',
            receiveNotifications: true,
            commissionBase: 0,
            smsConsent: true,
            emailConsent: true,
            gdprConsent: true,
            createdAt: now,
            updatedAt: now,
        },
    ];

    const services: SalonService[] = [
        {
            id: 1,
            duration: 30,
            name: '',
            description: '',
            price: 0,
            priceType: PriceType.Fixed,
            vatRate: 23,
            isFeatured: false,
            publicDescription: '',
            privateDescription: '',
            isActive: true,
            onlineBooking: true,
            sortOrder: 0,
            variants: [],
            media: [],
            reviews: [],
            recipeItems: [],
            employeeServices: [],
            createdAt: now,
            updatedAt: now,
        },
    ];

    let nextId = 1;
    const nextAppointmentId = () => nextId++;

    const mockUsersRepo = createUsersRepo(users);
    const mockServicesRepo = createServicesRepo(services);
    const mockServiceVariantsRepo = createServiceVariantsRepo();
    const mockAppointmentsRepo = createAppointmentsRepo(
        appointments,
        services,
        nextAppointmentId,
    );

    const mockCommissionsService = {
        createFromAppointment: jest.fn<
            Promise<unknown>,
            [Appointment, User, unknown]
        >(() => Promise.resolve({})),
    } as unknown as jest.Mocked<CommissionsService>;

    const mockLogService = {
        logAction: jest.fn(),
    } as unknown as jest.Mocked<LogService>;

    const mockWhatsappService = {
        sendBookingConfirmation: jest.fn<
            Promise<void>,
            [string | null, string, string]
        >(() => Promise.resolve()),
        sendReminder: jest.fn<Promise<void>, [string, string, string]>(),
        sendFollowUp: jest.fn<Promise<void>, [string, string, string]>(() =>
            Promise.resolve(),
        ),
    } as unknown as jest.Mocked<WhatsappService>;

    const sendFollowUpMock = jest.spyOn(
        mockWhatsappService,
        'sendFollowUp',
    ) as jest.Mock;
    const transactionMock = jest.spyOn(
        mockAppointmentsRepo.manager,
        'transaction',
    ) as jest.Mock;
    const createFromAppointmentMock = jest.spyOn(
        mockCommissionsService,
        'createFromAppointment',
    ) as jest.Mock;

    const service = new AppointmentsService(
        mockAppointmentsRepo,
        mockServicesRepo,
        mockServiceVariantsRepo,
        mockUsersRepo,
        mockCommissionsService,
        mockLogService,
        mockWhatsappService,
    );
    const logActionSpy = jest.spyOn(mockLogService, 'logAction');

    return {
        service,
        appointments,
        users,
        services,
        mockAppointmentsRepo,
        mockServicesRepo,
        mockWhatsappService,
        logActionSpy,
        sendFollowUpMock,
        transactionMock,
        createFromAppointmentMock,
    };
}

function createUsersRepo(users: User[]) {
    return {
        findOne: jest.fn<Promise<User | null>, [{ where: { id: number } }]>(
            ({ where }) =>
                Promise.resolve(users.find((u) => u.id === where.id) ?? null),
        ),
    } as unknown as jest.Mocked<Repository<User>>;
}

function createServicesRepo(services: SalonService[]) {
    return {
        findOne: jest.fn<
            Promise<SalonService | null>,
            [{ where: { id: number } }]
        >(({ where }) =>
            Promise.resolve(services.find((s) => s.id === where.id) ?? null),
        ),
        findOneBy: jest.fn<Promise<SalonService | null>, [{ id: number }]>(
            ({ id }) =>
                Promise.resolve(services.find((s) => s.id === id) ?? null),
        ),
    } as unknown as jest.Mocked<Repository<SalonService>>;
}

function createServiceVariantsRepo() {
    return {
        findOne: jest.fn<
            Promise<null>,
            [{ where: { id: number } } | undefined]
        >(() => Promise.resolve(null)),
    } as unknown as jest.Mocked<Repository<ServiceVariant>>;
}

function createAppointmentsRepo(
    appointments: Appointment[],
    services: SalonService[],
    nextAppointmentId: () => number,
) {
    const findById = (id: number) =>
        appointments.find((a) => a.id === id) ?? null;

    const findOverlap = (
        employeeId: number,
        startTime?: Date,
        endTime?: Date,
    ) =>
        appointments.find(
            (a) =>
                a.employee?.id === employeeId &&
                a.status !== AppointmentStatus.Cancelled &&
                startTime &&
                endTime &&
                a.startTime < startTime &&
                a.endTime > endTime,
        ) ?? null;

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

    return {
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
                return Promise.resolve(findById(criteria));
            }
            const where = criteria?.where;
            if (!where) return Promise.resolve(null);
            if (where.id !== undefined) {
                return Promise.resolve(findById(where.id));
            }
            const employeeId = where.employee?.id;
            if (employeeId === undefined) {
                return Promise.resolve(null);
            }
            return Promise.resolve(
                findOverlap(
                    employeeId,
                    where.startTime?._value,
                    where.endTime?._value,
                ),
            );
        }),
        create: jest.fn<Appointment, [Partial<Appointment>]>(
            (data) =>
                ({
                    id: nextAppointmentId(),
                    status: AppointmentStatus.Scheduled,
                    ...data,
                }) as Appointment,
        ),
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
                    appointments.splice(0, appointments.length, ...snapshot);
                    throw e;
                }
            }),
        },
    } as unknown as jest.Mocked<Repository<Appointment>>;
}

// Re-exported for convenience in specs
export { ConflictException, BadRequestException, LogAction, AppointmentStatus };
