/**
 * V18 operational staff visibility against disposable PostgreSQL.
 * Deliberately destructive only inside a CI-owned localhost database.
 * Never use DEV/PROD data or provider credentials.
 */
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { CalendarService } from '../src/calendar/calendar.service';
import { CalendarView } from '../src/calendar/dto/calendar-query.dto';
import { TimeBlock } from '../src/calendar/entities/time-block.entity';
import { Branch } from '../src/branches/entities/branch.entity';
import { Service, PriceType } from '../src/services/service.entity';
import { EmployeeService } from '../src/services/entities/employee-service.entity';
import { Timetable } from '../src/timetables/entities/timetable.entity';
import { TimetableException } from '../src/timetables/entities/timetable-exception.entity';
import { Role } from '../src/users/role.enum';
import { User } from '../src/users/user.entity';

const DB_URL =
    'postgresql://salonbw_roster_uat:salonbw_roster_uat_only@127.0.0.1:5432/salonbw_roster_uat';

function assertDisposableDatabase() {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.CI !== 'true' ||
        process.env.APP_ENV !== 'test' ||
        process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
        process.env.SMSAPI_ENABLED !== 'false' ||
        process.env.TEST_DATABASE_URL !== DB_URL
    ) {
        throw new Error('V18_ROSTER_PG_BLOCKED: disposable localhost CI only');
    }
}

const syntheticUser = (name: string, role: Role, isSystemAdmin = false) => ({
    name,
    email: name.toLowerCase().replace(/\s+/g, '-') + '@invalid.example',
    password: 'unusable-ci-test-password',
    role,
    isSystemAdmin,
    phone: '+48000000000',
    receiveNotifications: false,
    commissionBase: 0,
});

describe('V18 operational roster on PostgreSQL', () => {
    let db: DataSource;

    beforeAll(async () => {
        assertDisposableDatabase();
        db = new DataSource({
            type: 'postgres',
            url: DB_URL,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            await db.initialize();
        } finally {
            warn.mockRestore();
        }
    }, 120_000);

    afterAll(async () => {
        if (db?.isInitialized) await db.destroy();
    });

    it('excludes unconfigured, synthetic and technical accounts and activates additional staff dynamically', async () => {
        const users = db.getRepository(User);
        const services = db.getRepository(Service);
        const assignments = db.getRepository(EmployeeService);
        const timetables = db.getRepository(Timetable);
        const appointments = db.getRepository(Appointment);

        const [owner, pendingStaff, testAdmin, technicalAdmin, client] =
            await users.save([
                syntheticUser('Owner Stylist', Role.Admin),
                syntheticUser('Second Stylist', Role.Employee),
                syntheticUser('UAT Admin', Role.Admin),
                syntheticUser('Technical Admin', Role.Admin, true),
                syntheticUser('Test Client', Role.Client),
            ]);

        const service = await services.save({
            name: 'Haircut fixture',
            description: 'Synthetic, private CI only',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });
        await assignments.save({
            employeeId: owner.id,
            serviceId: service.id,
            isActive: true,
        });
        await timetables.save({
            employeeId: owner.id,
            name: 'Owner active weekly timetable',
            validFrom: new Date('2025-01-01'),
            isActive: true,
        });

        const start = new Date('2026-12-01T10:00:00.000Z');
        const end = new Date('2026-12-01T11:00:00.000Z');
        await appointments.save([
            {
                clientId: client.id,
                employeeId: owner.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
                status: AppointmentStatus.Scheduled,
            },
            {
                clientId: client.id,
                employeeId: testAdmin.id,
                serviceId: service.id,
                startTime: start,
                endTime: end,
                status: AppointmentStatus.Scheduled,
            },
        ]);

        const calendar = new CalendarService(
            db.getRepository(TimeBlock),
            appointments,
            users,
            services,
            assignments,
            db.getRepository(Branch),
            timetables,
            db.getRepository(TimetableException),
        );
        const date = new Date('2026-12-01T12:00:00.000Z');

        const initial = await calendar.getCalendarData(
            date,
            CalendarView.Day,
            undefined,
            true,
        );
        expect(initial.employees.map(({ id }) => id)).toEqual([owner.id]);
        expect(initial.events.map(({ employeeId }) => employeeId)).toEqual([
            owner.id,
        ]);

        // The legacy calendar deliberately preserves historical accounts.
        const classic = await calendar.getCalendarData(
            date,
            CalendarView.Day,
        );
        expect(classic.employees).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: testAdmin.id }),
                expect.objectContaining({ id: pendingStaff.id }),
            ]),
        );
        expect(classic.events).toHaveLength(2);

        // Merely creating a role-admin user never grants bookable visibility.
        // A second stylist becomes visible only after configuring both
        // service capability and a currently active timetable.
        await assignments.save({
            employeeId: pendingStaff.id,
            serviceId: service.id,
            isActive: true,
        });
        const withoutTimetable = await calendar.getCalendarData(
            date,
            CalendarView.Day,
            undefined,
            true,
        );
        expect(withoutTimetable.employees.map(({ id }) => id)).toEqual([
            owner.id,
        ]);

        await timetables.save({
            employeeId: pendingStaff.id,
            name: 'Second active weekly timetable',
            validFrom: new Date('2025-01-01'),
            isActive: true,
        });
        const multi = await calendar.getCalendarData(
            date,
            CalendarView.Day,
            undefined,
            true,
        );
        expect(multi.employees.map(({ id }) => id)).toEqual([
            owner.id,
            pendingStaff.id,
        ]);

        const filtered = await calendar.getCalendarData(
            date,
            CalendarView.Day,
            [pendingStaff.id, technicalAdmin.id],
            true,
        );
        expect(filtered.employees.map(({ id }) => id)).toEqual([
            pendingStaff.id,
        ]);
        expect(filtered.events).toHaveLength(0);
    }, 50_000);
});
