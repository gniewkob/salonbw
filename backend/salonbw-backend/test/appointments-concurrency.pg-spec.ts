import { ConflictException } from '@nestjs/common';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

import {
    Appointment,
    AppointmentStatus,
} from '../src/appointments/appointment.entity';
import { AppointmentMessage } from '../src/appointments/appointment-message.entity';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { CalendarSettings } from '../src/settings/entities/calendar-settings.entity';
import { Service, PriceType } from '../src/services/service.entity';
import { ServiceRecipeItem } from '../src/services/entities/service-recipe-item.entity';
import { ServiceVariant } from '../src/services/entities/service-variant.entity';
import { Role } from '../src/users/role.enum';
import { User } from '../src/users/user.entity';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithPostgres = testDatabaseUrl ? describe : describe.skip;

describeWithPostgres('Appointment booking concurrency (PostgreSQL)', () => {
    let dataSource: DataSource;

    beforeAll(async () => {
        const migrationWarning = jest
            .spyOn(console, 'warn')
            .mockImplementation(() => undefined);
        dataSource = new DataSource({
            type: 'postgres',
            url: testDatabaseUrl,
            entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
            migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
            migrationsRun: true,
            dropSchema: true,
            synchronize: false,
        });
        try {
            await dataSource.initialize();
        } finally {
            migrationWarning.mockRestore();
        }
    });

    afterAll(async () => {
        if (dataSource?.isInitialized) await dataSource.destroy();
    });

    it('persists only one of two simultaneous online bookings for the same slot', async () => {
        const users = dataSource.getRepository(User);
        const services = dataSource.getRepository(Service);
        const appointments = dataSource.getRepository(Appointment);

        const [firstClient, secondClient, employee] = await users.save([
            userFixture('first-client@example.invalid', Role.Client),
            userFixture('second-client@example.invalid', Role.Client),
            userFixture('owner@example.invalid', Role.Admin),
        ]);
        const salonService = await services.save({
            name: 'Concurrency test service',
            description: 'Isolated PostgreSQL test fixture',
            duration: 60,
            price: 100,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        });

        // Keep both inserts open briefly. Without a lock, both conflict reads
        // finish while the slot is still absent, making the race deterministic.
        await dataSource.query(`
            CREATE OR REPLACE FUNCTION delay_test_appointment_insert()
            RETURNS trigger AS $$
            BEGIN
                PERFORM pg_sleep(0.15);
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
        `);
        await dataSource.query(`
            CREATE TRIGGER delay_test_appointment_insert_trigger
            BEFORE INSERT ON appointments
            FOR EACH ROW EXECUTE FUNCTION delay_test_appointment_insert()
        `);

        const appointmentService = createService(dataSource);
        const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const attempts = await Promise.allSettled([
            appointmentService.create(
                bookingInput(firstClient, employee, salonService, startTime),
                firstClient,
            ),
            appointmentService.create(
                bookingInput(secondClient, employee, salonService, startTime),
                secondClient,
            ),
        ]);

        const accepted = attempts.filter(
            ({ status }) => status === 'fulfilled',
        );
        const rejected = attempts.filter(({ status }) => status === 'rejected');
        expect(accepted).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(
            ConflictException,
        );
        expect(
            await appointments.count({
                where: { status: AppointmentStatus.OnlinePending },
            }),
        ).toBe(1);
    });
});

function userFixture(email: string, role: Role): Partial<User> {
    return {
        email,
        password: 'test-only-password',
        name: email,
        role,
        phone: '+48000000000',
        receiveNotifications: true,
        whatsappConsent: true,
        commissionBase: 0,
    };
}

function bookingInput(
    client: User,
    employee: User,
    salonService: Service,
    startTime: Date,
): Partial<Appointment> {
    return {
        client: { id: client.id } as User,
        employee: { id: employee.id } as User,
        service: { id: salonService.id } as Service,
        startTime: new Date(startTime),
    };
}

function createService(dataSource: DataSource): AppointmentsService {
    const resolved = Promise.resolve();
    return new AppointmentsService(
        dataSource.getRepository(Appointment),
        dataSource.getRepository(Service),
        dataSource.getRepository(ServiceVariant),
        dataSource.getRepository(ServiceRecipeItem),
        dataSource.getRepository(User),
        dataSource.getRepository(CalendarSettings),
        dataSource.getRepository(AppointmentMessage),
        {} as never,
        { logAction: () => resolved } as never,
        {
            sendBookingConfirmation: () => resolved,
            sendNewBookingToEmployee: () => resolved,
        } as never,
    );
}
