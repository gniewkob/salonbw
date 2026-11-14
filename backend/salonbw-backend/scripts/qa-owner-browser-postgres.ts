/**
 * P0 browser-to-Nest-to-PostgreSQL UAT fixture and independent DB verifier.
 * Runs on GitHub Actions OR a dedicated no-host-ports Docker runner.
 * Local Docker mode must prove Linux container identity and exact source SHA;
 * an ordinary Mac shell cannot opt in by setting CI/GITHUB_ACTIONS flags.
 * A read-only catalog preflight must prove that this DB is empty before seed.
 * Never drop schemas: a wrong/occupied localhost:5432 target fails closed.
 * No host credentials, outbound transports, production schemas or real clients.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hash } from 'bcrypt';
// pg has no @types/pg in the locked workspace. Keep a narrow typed facade
// for this read-only catalog preflight rather than adding a new dependency.
type QaCatalogResult = { rows: Array<Record<string, unknown>> };
type QaCatalogClient = {
    connect(): Promise<void>;
    query(sql: string): Promise<QaCatalogResult>;
    end(): Promise<void>;
};
const { Client } = require('pg') as {
    Client: new (config: Record<string, unknown>) => QaCatalogClient;
};
import { DataSource } from 'typeorm';
import { Appointment, AppointmentStatus } from '../src/appointments/appointment.entity';
import { Branch, BranchStatus } from '../src/branches/entities/branch.entity';
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
    const githubRunner =
        process.env.GITHUB_ACTIONS === 'true' && process.env.CI === 'true';
    const isolatedDockerRunner =
        process.env.QA_ISOLATED_DOCKER === '1' &&
        process.env.GITHUB_ACTIONS !== 'true' &&
        process.env.CI === 'true' &&
        process.platform === 'linux' &&
        existsSync('/.dockerenv') &&
        /^[a-f0-9]{40}$/.test(process.env.V18_QA_SOURCE_SHA ?? '');
    if (
        (!githubRunner && !isolatedDockerRunner) ||
        process.env.QA_OWNER_E2E_MODE !== '1' ||
        process.env.APP_ENV !== 'test' ||
        process.env.DATABASE_URL !== DATABASE_URL ||
        process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
        process.env.SMSAPI_ENABLED !== 'false'
    ) {
        throw new Error('OWNER_BROWSER_PG_BLOCKED: exact disposable QA database required');
    }
}

/**
 * Fail before applying even the first migration if the fixed CI endpoint is
 * already populated. The historical dropSchema option could destroy existing
 * data if localhost:5432 unexpectedly mapped to a persistent PostgreSQL.
 *
 * This preflight is READ ONLY and uses pg_catalog; it inspects no business
 * records and does not require permissions on application tables.
 */
async function assertFreshDisposableDatabase(): Promise<void> {
    const client = new Client({
        connectionString: DATABASE_URL,
        connectionTimeoutMillis: 8000,
        query_timeout: 10000,
        statement_timeout: 10000,
        application_name: 'salonbw_owner_browser_seed_preflight',
    });
    let connected = false;
    try {
        await client.connect();
        connected = true;
        await client.query('BEGIN TRANSACTION READ ONLY');
        const result = await client.query(`
            SELECT
                current_database() AS database_name,
                current_user AS role_name,
                current_setting('transaction_read_only') AS readonly_flag,
                (
                    SELECT COUNT(*)::integer
                    FROM pg_catalog.pg_class c
                    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
                      AND n.nspname NOT LIKE 'pg_toast%'
                      AND n.nspname NOT LIKE 'pg_temp_%'
                      AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')
                ) AS user_object_count,
                (
                    SELECT COUNT(*)::integer
                    FROM pg_catalog.pg_namespace n
                    WHERE n.nspname NOT IN ('public', 'pg_catalog', 'information_schema')
                      AND n.nspname NOT LIKE 'pg_toast%'
                      AND n.nspname NOT LIKE 'pg_temp_%'
                ) AS extra_schema_count
        `);
        const identity = result.rows[0] as
            | {
                  database_name: string;
                  role_name: string;
                  readonly_flag: string;
                  user_object_count: number;
                  extra_schema_count: number;
              }
            | undefined;
        if (
            result.rows.length !== 1 ||
            identity?.database_name !== 'salonbw_browser_uat' ||
            identity.role_name !== 'salonbw_browser_uat' ||
            identity.readonly_flag !== 'on'
        ) {
            throw new Error('OWNER_BROWSER_PG_BLOCKED: wrong disposable identity');
        }
        if (identity.user_object_count !== 0 || identity.extra_schema_count !== 0) {
            // A distinct, redacted status proves the negative test reached the
            // real catalog check (not a missing module or network failure).
            throw new Error('OWNER_BROWSER_PG_NONEMPTY_DB');
        }
        console.log('OWNER_BROWSER_PG_EMPTY_PREFLIGHT=PASS');
    } catch (error) {
        if (
            error instanceof Error &&
            error.message === 'OWNER_BROWSER_PG_NONEMPTY_DB'
        ) {
            throw error;
        }
        // Do not leak host connection errors, role metadata or credentials.
        throw new Error(
            'OWNER_BROWSER_PG_BLOCKED: cannot prove a fresh disposable database',
        );
    } finally {
        if (connected) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Do not expose connection metadata.
            }
            try {
                await client.end();
            } catch {
                // Preserve the original preflight result.
            }
        }
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

    // The disposable DB has no employee timetable and may have no active
    // branch at all. In that state the real GET /calendar/opening-hours
    // correctly returns [] for every weekday. A real-stack browser test
    // needs a deterministic, explicitly SYNTHETIC schedule; never compensate
    // by force-clicking a hidden grid slot or weakening production defaults.
    // This fixture runs only after the empty disposable DB identity preflight.
    const branches = db.getRepository(Branch);
    const weeklyHours = {
        mon: { open: '10:00', close: '19:00' },
        tue: { open: '10:00', close: '19:00' },
        wed: { open: '10:00', close: '19:00' },
        thu: { open: '10:00', close: '19:00' },
        fri: { open: '10:00', close: '19:00' },
        sat: { open: '09:00', close: '15:00' },
        sun: null,
    };
    let qaBranch = await branches.findOne({
        where: { status: BranchStatus.Active },
        order: { id: 'ASC' },
    });
    if (qaBranch) {
        qaBranch.workingHours = weeklyHours;
    } else {
        qaBranch = branches.create({
            name: 'Studio V18 — synthetic Docker UAT',
            slug: 'studio-v18-synthetic-docker-uat',
            status: BranchStatus.Active,
            ownerId: owner.id,
            workingHours: weeklyHours,
            onlineBookingEnabled: false,
        });
    }
    const savedBranch = await branches.save(qaBranch);
    const mondayHours = savedBranch.workingHours.mon;
    if (!savedBranch.id || savedBranch.status !== BranchStatus.Active ||
        !mondayHours || Array.isArray(mondayHours) ||
        mondayHours.open !== '10:00' ||
        savedBranch.workingHours.sun !== null) {
        throw new Error('OWNER_BROWSER_WEEKLY_HOURS_FIXTURE_INVALID');
    }
    console.log('OWNER_BROWSER_WEEKLY_HOURS_FIXTURE=PASS (synthetic Mon-Sat; Sunday closed)');

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
    if (mode === 'seed') {
        await assertFreshDisposableDatabase();
    }
    const database = new DataSource({
        type: 'postgres',
        url: DATABASE_URL,
        entities: [join(__dirname, '../src/**/*.entity.{ts,js}')],
        migrations: [join(__dirname, '../src/migrations/*{ts,js}')],
        migrationsRun: mode === 'seed',
        // Never destroy an existing database, even if CI variables were spoofed.
        dropSchema: false,
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
    // Only expose a known synthetic catalog-check status, never driver errors.
    if (
        error instanceof Error &&
        error.message === 'OWNER_BROWSER_PG_NONEMPTY_DB'
    ) {
        console.error('OWNER_BROWSER_PG_NONEMPTY_DB=BLOCKED');
    } else {
        console.error('OWNER_BROWSER_PG_BLOCKED: fixture setup/verification failed');
    }
    process.exitCode = 1;
});
