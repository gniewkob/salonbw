/**
 * Owner daily workflow acceptance on a PRIVATE, disposable PostgreSQL service.
 *
 * This suite is intentionally destructive (dropSchema + migrations). Refuse to
 * run unless CI points to the exact ephemeral localhost test database.
 * Never reuse hosted DEV/PROD credentials, clients or notification providers.
 */
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import {
    Appointment,
    AppointmentStatus,
} from '../src/appointments/appointment.entity';
import { AppointmentMessage } from '../src/appointments/appointment-message.entity';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { CalendarService } from '../src/calendar/calendar.service';
import { CalendarView } from '../src/calendar/dto/calendar-query.dto';
import {
    TimeBlock,
    TimeBlockType,
} from '../src/calendar/entities/time-block.entity';
import { Branch } from '../src/branches/entities/branch.entity';
import { CalendarSettings } from '../src/settings/entities/calendar-settings.entity';
import { Service, PriceType } from '../src/services/service.entity';
import { EmployeeService } from '../src/services/entities/employee-service.entity';
import { ServiceVariant } from '../src/services/entities/service-variant.entity';
import { ServiceRecipeItem } from '../src/services/entities/service-recipe-item.entity';
import { Timetable } from '../src/timetables/entities/timetable.entity';
import { TimetableException } from '../src/timetables/entities/timetable-exception.entity';
import { Role } from '../src/users/role.enum';
import { User } from '../src/users/user.entity';

const EXACT_TEST_DATABASE =
    'postgresql://salonbw_owner_uat:salonbw_owner_uat_test_only@127.0.0.1:5432/salonbw_owner_uat';

function assertIsolatedRunner(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.CI !== 'true' ||
        process.env.APP_ENV !== 'test' ||
        process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
        process.env.SMSAPI_ENABLED !== 'false' ||
        process.env.TEST_DATABASE_URL !== EXACT_TEST_DATABASE
    ) {
        throw new Error(
            'OWNER_UAT_BLOCKED: requires disposable local PG test container and outbound=off',
        );
    }
}

function fixtureUser(email: string, role: Role, isSystemAdmin = false) {
    return {
        email,
        password: 'unusable-synthetic-password',
        name: email,
        role,
        isSystemAdmin,
        phone: '+48000000000',
        receiveNotifications: false,
        smsConsent: false,
        whatsappConsent: false,
        emailConsent: false,
        commissionBase: 0,
    };
}

describe('Single-owner salon — complete PostgreSQL appointment lifecycle', () => {
    let database: DataSource;

    beforeAll(async () => {
        // Fail BEFORE dropSchema, including when somebody runs Jest locally.
        assertIsolatedRunner();
        database = new DataSource({
            type: 'postgres',
            url: EXACT_TEST_DATABASE,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        const warnings = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);
        try {
            await database.initialize();
        } finally {
            warnings.mockRestore();
        }
    }, 120_000);

    afterAll(async () => {
        if (database?.isInitialized) await database.destroy();
    });

    it('creates, reschedules, blocks, cancels and preserves client history without any provider sends', async () => {
        const users = database.getRepository(User);
        const services = database.getRepository(Service);
        const appointments = database.getRepository(Appointment);
        const blocks = database.getRepository(TimeBlock);
        const settings = database.getRepository(CalendarSettings);
        const [owner, client, technician] = await users.save([
            fixtureUser('owner-operator@example.invalid', Role.Admin, false),
            fixtureUser('synthetic-client@example.invalid', Role.Client, false),
            fixtureUser('technical-admin@example.invalid', Role.Admin, true),
        ]);

        const service = await services.save({
            name: 'Synthetic haircut — daily UAT',
            description: 'Private, non-production CI fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });

        const [calendarSettings] = await settings.find({ take: 1 });
        if (calendarSettings) {
            calendarSettings.allowOverlappingAppointments = false;
            await settings.save(calendarSettings);
        } else {
            await settings.save({ allowOverlappingAppointments: false });
        }

        const calendar = new CalendarService(
            blocks,
            appointments,
            users,
            services,
            database.getRepository(EmployeeService),
            database.getRepository(Branch),
            database.getRepository(Timetable),
            database.getRepository(TimetableException),
        );

        const sendBookingConfirmation = jest.fn(async () => undefined);
        const sendNewBookingToEmployee = jest.fn(async () => undefined);
        const sendRescheduleNotification = jest.fn(async () => undefined);
        const serviceApi = new AppointmentsService(
            appointments,
            services,
            database.getRepository(ServiceVariant),
            database.getRepository(ServiceRecipeItem),
            users,
            settings,
            database.getRepository(AppointmentMessage),
            {} as never,
            { logAction: async () => undefined } as never,
            {
                sendBookingConfirmation,
                sendNewBookingToEmployee,
                sendRescheduleNotification,
            } as never,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            calendar,
        );

        // Pick a future 11:00 UTC slot; local Warsaw day cannot drift at DST.
        const originalStart = new Date(Date.now() + 45 * 86_400_000);
        originalStart.setUTCHours(11, 0, 0, 0);
        const oneHour = 3_600_000;
        const originalEnd = new Date(originalStart.getTime() + oneHour);
        const booking = {
            client: { id: client.id } as User,
            employee: { id: owner.id } as User,
            service: { id: service.id } as Service,
            startTime: originalStart,
        };

        // CREATE by owner: customer record and owner-as-provider persist.
        const booked = await serviceApi.create(booking, owner);
        expect(booked.status).toBe(AppointmentStatus.Scheduled);
        expect(booked.client.id).toBe(client.id);
        expect(booked.employee.id).toBe(owner.id);
        expect((await appointments.findOneByOrFail({ id: booked.id })).startTime)
            .toEqual(originalStart);

        const before = await calendar.getCalendarData(
            originalStart,
            CalendarView.Day,
        );
        expect(before.employees.map((employee) => employee.id)).toContain(
            owner.id,
        );
        expect(before.employees.map((employee) => employee.id)).not.toContain(
            technician.id,
        );
        expect(before.events).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: booked.id,
                    type: 'appointment',
                    employeeId: owner.id,
                    clientId: client.id,
                }),
            ]),
        );

        // 409: a second manual booking for the same operator and hour fails.
        await expect(serviceApi.create(booking, owner)).rejects.toBeInstanceOf(
            ConflictException,
        );

        // 403: customer may never override an existing conflict.
        await expect(
            serviceApi.create(booking, client, true),
        ).rejects.toBeInstanceOf(ForbiddenException);

        // 409: a block cannot overlap an existing appointment.
        await expect(
            calendar.createTimeBlock(
                {
                    employeeId: owner.id,
                    startTime: originalStart.toISOString(),
                    endTime: originalEnd.toISOString(),
                    type: TimeBlockType.Break,
                },
                owner,
            ),
        ).rejects.toBeInstanceOf(ConflictException);

        // RESCHEDULE and client ACCEPT: preserve exact appointment identity.
        const movedStart = new Date(originalStart.getTime() + 86_400_000);
        const moved = await serviceApi.reschedule(
            booked.id,
            movedStart,
            undefined,
            undefined,
            false,
            owner,
        );
        expect(moved?.status).toBe(AppointmentStatus.RescheduledPending);
        expect(moved?.startTime).toEqual(movedStart);
        const accepted = await serviceApi.acceptReschedule(booked.id, client);
        expect(accepted?.status).toBe(AppointmentStatus.Confirmed);

        // CREATE / EDIT a time block in the slot vacated by the appointment.
        const block = await calendar.createTimeBlock(
            {
                employeeId: owner.id,
                startTime: originalStart.toISOString(),
                endTime: originalEnd.toISOString(),
                type: TimeBlockType.Break,
                title: 'Synthetic break',
            },
            owner,
        );
        const renamed = await calendar.updateTimeBlock(block.id, {
            title: 'Synthetic break updated',
        });
        expect(renamed.title).toBe('Synthetic break updated');
        const conflict = await calendar.checkConflicts(
            owner.id,
            originalStart,
            originalEnd,
        );
        expect(conflict.hasConflict).toBe(true);
        expect(conflict.conflictingEvents).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: block.id,
                    type: 'time_block',
                }),
            ]),
        );
        await expect(serviceApi.create(booking, owner)).rejects.toBeInstanceOf(
            ConflictException,
        );

        // A technical administrator may never be a bookable time-block target.
        await expect(
            calendar.createTimeBlock(
                {
                    employeeId: technician.id,
                    startTime: originalStart.toISOString(),
                    endTime: originalEnd.toISOString(),
                    type: TimeBlockType.Break,
                },
                technician,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);

        // CANCEL must persist and keep the client/owner association for CRM.
        const cancelled = await serviceApi.cancel(booked.id, owner);
        expect(cancelled?.status).toBe(AppointmentStatus.Cancelled);
        const history = await appointments.find({
            where: { clientId: client.id },
        });
        expect(history).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: booked.id,
                    clientId: client.id,
                    employeeId: owner.id,
                    status: AppointmentStatus.Cancelled,
                    startTime: movedStart,
                }),
            ]),
        );

        await calendar.deleteTimeBlock(block.id);
        expect(await blocks.countBy({ id: block.id })).toBe(0);

        // Neither external provider is configured; guard regression explicitly.
        expect(sendBookingConfirmation).not.toHaveBeenCalled();
        expect(sendNewBookingToEmployee).not.toHaveBeenCalled();
        expect(sendRescheduleNotification).not.toHaveBeenCalled();
    }, 70_000);
});
