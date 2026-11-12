/**
 * P0 browser-to-Nest-to-PostgreSQL UAT fixture and independent DB verifier.
 * Runs ONLY on GitHub Actions with an exact disposable localhost database.
 * No host credentials, outbound transports, production schemas or real clients.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { CalendarSettings } from '../src/settings/entities/calendar-settings.entity';
import { PriceType, Service } from '../src/services/service.entity';
import { Role } from '../src/users/role.enum';
import { User } from '../src/users/user.entity';

const DATABASE_URL =
    'postgresql://salonbw_browser_uat:salonbw_browser_uat_local_only@127.0.0.1:5432/salonbw_browser_uat';
const RECEIPT = '/tmp/salonbw-owner-real-stack-receipt.json';
const OWNER_EMAIL = 'owner-browser-uat@example.invalid';
const CLIENT_EMAIL = 'client-browser-uat@example.invalid';
const TECH_EMAIL = 'technical-browser-uat@example.invalid';
const QA_PASSWORD = 'SyntheticLocalOnly2026!';

function assertIsolatedRunner(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.CI !== 'true' ||
        process.env.QA_OWNER_E2E_MODE !== '1' ||
        process.env.APP_ENV !== 'test' ||
        process.env.DATABASE_URL !== DATABASE_URL ||
        process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
        process.env.SMSAPI_ENABLED !== 'false'
    ) {
        throw new Error('OWNER_BROWSER_PG_BLOCKED: exact disposable CI database required');
    }
}

type Receipt = {
    appointmentId: number;
    createdStart: string;
    rescheduledStart: string;
};

function parseReceipt(): Receipt {
    const value: unknown = JSON.parse(readFileSync(RECEIPT, 'utf8'));
    if (
        typeof value !== 'object' ||
        value === null ||
        !('appointmentId' in value) ||
        !('createdStart' in value) ||
        !('rescheduledStart' in value) ||
        typeof value.appointmentId !== 'number' ||
        !Number.isSafeInteger(value.appointmentId) ||
        value.appointmentId <= 0 ||
        typeof value.createdStart !== 'string' ||
        typeof value.rescheduledStart !== 'string' ||
        !Number.isFinite(Date.parse(value.createdStart)) ||
        !Number.isFinite(Date.parse(value.rescheduledStart))
    ) {
        throw new Error('Invalid synthetic browser receipt');
    }
    return value as Receipt;
}

async function seed(db: DataSource): Promise<void> {
    const users = db.getRepository(User);
    const services = db.getRepository(Service);
    const password = await hash(QA_PASSWORD, 10);
    const defaults = {
        password,
        phone: '+48000000000',
        receiveNotifications: false,
        notifyPanel: false,
        notifySms: false,
        notifyWhatsapp: false,
        notifyEmail: false,
        smsConsent: false,
        whatsappConsent: false,
        emailConsent: false,
        commissionBase: 0,
    };
    // Historical migration 1761220000000 seeds a second UI-only employee.
    // In this disposable CI fixture, remove that exact legacy test account
    // before asserting a one-provider owner workflow. Never do this on DEV/PROD.
    const legacyEmployee = await users.findOne({
        where: { email: 'test.pracownik@salon-bw.pl' },
    });
    if (legacyEmployee) {
        if (
            legacyEmployee.name !== 'Pracownik (test)' ||
            legacyEmployee.role !== Role.Employee ||
            legacyEmployee.isSystemAdmin
        ) {
            throw new Error('Unexpected legacy employee fixture identity');
        }
        const relatedAppointments = await db.getRepository(Appointment).count({
            where: { employee: { id: legacyEmployee.id } },
        });
        if (relatedAppointments !== 0) {
            throw new Error('Legacy employee fixture has appointments');
        }
        await users.delete({ id: legacyEmployee.id });
    }

    const owner = await users.save(
        users.create({
            ...defaults,
            email: OWNER_EMAIL,
            name: 'Aleksandra',
            role: Role.Admin,
            isSystemAdmin: false,
        }),
    );
    const client = await users.save(
        users.create({
            ...defaults,
            email: CLIENT_EMAIL,
            name: 'Klient Syntetyczny',
            firstName: 'Klient',
            lastName: 'Syntetyczny',
            role: Role.Client,
            isSystemAdmin: false,
        }),
    );
    await users.save(
        users.create({
            ...defaults,
            email: TECH_EMAIL,
            name: 'Administrator techniczny',
            role: Role.Admin,
            isSystemAdmin: true,
        }),
    );
    const service = await services.save(
        services.create({
            name: 'Strzyżenie testowe',
            description: 'Synthetic browser acceptance fixture',
            duration: 45,
            price: 80,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        }),
    );
    // Positive/negative customer booking checks use the same live Nest API.
    // This second active service deliberately has NO active stylist assignment.
    // It exists only in the disposable GitHub Actions PostgreSQL database.
    const unassignedService = await services.save(
        services.create({
            name: 'Usługa bez stylisty — wyłącznie test',
            description: 'Synthetic no-provider booking regression fixture',
            duration: 30,
            price: 40,
            priceType: PriceType.Fixed,
            isActive: true,
            onlineBooking: true,
        }),
    );
    const settings = db.getRepository(CalendarSettings);
    const existing = await settings.find({ take: 1 });
    await settings.save({
        ...(existing[0] ?? {}),
        allowOverlappingAppointments: false,
    });
    if (!owner.id || !client.id || !service.id || !unassignedService.id) {
        throw new Error('Incomplete synthetic browser fixture');
    }
    // The calendar counts bookable operators by ACTIVE service assignments,
    // not by role alone. Seed exactly one owner-provider in disposable CI PG.
    // This fixture never targets hosted DEV or production databases.
    await db.query(
        'INSERT INTO employee_services ("employeeId", "serviceId", "isActive") VALUES ($1, $2, true)',
        [owner.id, service.id],
    );
    writeFileSync(
        '/tmp/salonbw-calendar-drag-fixture.json',
        JSON.stringify({
            ownerId: owner.id,
            clientId: client.id,
            serviceId: service.id,
            unassignedServiceId: unassignedService.id,
        }),
        { mode: 0o600 },
    );
    const actualStaff = (await users.find()).filter(
        (user) =>
            [Role.Admin, Role.Employee, Role.Receptionist].includes(user.role) &&
            !user.isSystemAdmin,
    );
    if (actualStaff.length !== 1 || actualStaff[0]?.id !== owner.id) {
        throw new Error('OWNER_BROWSER_PG_BLOCKED: fixture must have one salon operator');
    }
    console.log('OWNER_BROWSER_PG_SEED=PASS (one synthetic owner and service)');

}

async function verify(db: DataSource): Promise<void> {
    const receipt = parseReceipt();
    const appointment = await db.getRepository(Appointment).findOne({
        where: { id: receipt.appointmentId },
        relations: { client: true, employee: true, service: true },
    });
    if (
        !appointment ||
        appointment.status !== AppointmentStatus.Cancelled ||
        appointment.client?.email !== CLIENT_EMAIL ||
        appointment.employee?.email !== OWNER_EMAIL ||
        appointment.service?.name !== 'Strzyżenie testowe' ||
        new Date(appointment.startTime).getTime() !==
            new Date(receipt.rescheduledStart).getTime() ||
        new Date(receipt.createdStart).getTime() ===
            new Date(receipt.rescheduledStart).getTime()
    ) {
        throw new Error('OWNER_BROWSER_PG_VERIFY_FAILED: appointment state differs from browser receipt');
    }
    console.log('OWNER_BROWSER_PG_PERSISTENCE=PASS');
    console.log('OWNER_BROWSER_FINAL_STATUS=cancelled');
}

async function main(): Promise<void> {
    assertIsolatedRunner();
    const mode = process.argv[2];
    if (mode !== 'seed' && mode !== 'verify') {
        throw new Error('Expected seed or verify');
    }
    const database = new DataSource({
        type: 'postgres',
        url: DATABASE_URL,
        entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
        migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
        migrationsRun: mode === 'seed',
        dropSchema: mode === 'seed',
        synchronize: false,
        logging: ['error'],
    });
    try {
        await database.initialize();
        if (mode === 'seed') await seed(database);
        else await verify(database);
    } finally {
        if (database.isInitialized) await database.destroy();
    }
}

void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'UAT failure');
    process.exitCode = 1;
});
