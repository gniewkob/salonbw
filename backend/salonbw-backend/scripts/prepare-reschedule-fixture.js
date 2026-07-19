const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { config: loadEnv } = require('dotenv');

loadEnv({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

const CONFIRM = process.env.CONFIRM_RESCHEDULE_FIXTURE === '1';
const CLIENT_EMAIL =
    process.env.RESCHEDULE_FIXTURE_CLIENT_EMAIL ??
    'codex.reschedule.qa@salon-bw.pl';
const CLIENT_PASSWORD = process.env.RESCHEDULE_FIXTURE_CLIENT_PASSWORD;
const FIXTURE_TAG = 'codex-reschedule-fixture';

function dbConfig() {
    const ssl = process.env.PGSSL === '1' ? true : false;
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL, ssl };
    }
    return {
        host: process.env.PGHOST || process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.PGPORT || process.env.DB_PORT || 8543),
        user: process.env.PGUSER || process.env.DB_USER,
        password: process.env.PGPASSWORD || process.env.DB_PASS,
        database: process.env.PGDATABASE || process.env.DB_NAME,
        ssl,
    };
}

function assertConfigured(config) {
    if (!CONFIRM) {
        throw new Error(
            'Refusing to write fixture. Set CONFIRM_RESCHEDULE_FIXTURE=1.',
        );
    }
    if (!config.connectionString) {
        const missing = [];
        if (!config.user) missing.push('PGUSER/DB_USER');
        if (!config.password) missing.push('PGPASSWORD/DB_PASS');
        if (!config.database) missing.push('PGDATABASE/DB_NAME');
        if (missing.length > 0) {
            throw new Error(`Missing DB env vars: ${missing.join(', ')}`);
        }
    }
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function nextFixturePreviousStart() {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(11, 0, 0, 0);
    return start;
}

function requireFixturePassword(reason) {
    if (!CLIENT_PASSWORD) {
        throw new Error(
            `Set RESCHEDULE_FIXTURE_CLIENT_PASSWORD to ${reason}.`,
        );
    }
    return CLIENT_PASSWORD;
}

async function ensureClient(client) {
    const existing = await client.query(
        `SELECT id FROM "users" WHERE email = $1`,
        [CLIENT_EMAIL],
    );
    if (existing.rowCount > 0) {
        if (process.env.RESCHEDULE_FIXTURE_RESET_PASSWORD === '1') {
            const passwordHash = await bcrypt.hash(
                requireFixturePassword('reset fixture client password'),
                10,
            );
            await client.query(
                `UPDATE "users"
                 SET password = $2, role = 'client', "gdprConsent" = true,
                     "gdprConsentDate" = COALESCE("gdprConsentDate", now()),
                     "termsConsent" = true,
                     "termsConsentDate" = COALESCE("termsConsentDate", now()),
                     "updatedAt" = now()
                 WHERE email = $1`,
                [CLIENT_EMAIL, passwordHash],
            );
        }
        return existing.rows[0].id;
    }

    const passwordHash = await bcrypt.hash(
        requireFixturePassword('create fixture client'),
        10,
    );
    const inserted = await client.query(
        `INSERT INTO "users"
             (email, password, name, role, phone, "firstName", "lastName",
              "receiveNotifications", "notifyPanel", "gdprConsent",
              "gdprConsentDate", "termsConsent", "termsConsentDate",
              "createdAt", "updatedAt")
         VALUES
             ($1, $2, 'Codex Reschedule QA', 'client', '+48123000000',
              'Codex', 'Reschedule QA', true, true, true, now(), true, now(),
              now(), now())
         RETURNING id`,
        [CLIENT_EMAIL, passwordHash],
    );
    return inserted.rows[0].id;
}

async function pickEmployeeService(client) {
    const result = await client.query(
        `SELECT
             u.id AS "employeeId",
             s.id AS "serviceId",
             COALESCE(es."customDuration", s.duration, 60) AS duration
         FROM employee_services es
         JOIN "users" u ON u.id = es."employeeId"
         JOIN services s ON s.id = es."serviceId"
         WHERE es."isActive" = true
           AND s."isActive" = true
           AND s."onlineBooking" = true
           AND u.role IN ('employee', 'admin', 'receptionist')
         ORDER BY u.id ASC, s."sortOrder" ASC, s.id ASC
         LIMIT 1`,
    );
    if (result.rowCount === 0) {
        throw new Error('No active employee/service assignment found.');
    }
    return result.rows[0];
}

async function upsertAppointment(client, fixture) {
    const previousStart = nextFixturePreviousStart();
    const newStart = addMinutes(previousStart, 25);
    const duration = Number(fixture.duration || 60);
    const newEnd = addMinutes(newStart, duration);
    const previousEnd = addMinutes(previousStart, duration);

    const existing = await client.query(
        `SELECT id FROM appointments
         WHERE "clientId" = $1
           AND "internalNote" = $2
         ORDER BY id DESC
         LIMIT 1`,
        [fixture.clientId, FIXTURE_TAG],
    );

    if (existing.rowCount > 0) {
        const id = existing.rows[0].id;
        await client.query(
            `UPDATE appointments
             SET "employeeId" = $2,
                 "serviceId" = $3,
                 "startTime" = $4,
                 "endTime" = $5,
                 status = 'rescheduled_pending',
                 "reschedulePreviousStartTime" = $6,
                 "reschedulePreviousEndTime" = $7,
                 "staffRecommendations" = $8,
                 "clientComment" = $9,
                 "updatedAt" = now()
             WHERE id = $1`,
            [
                id,
                fixture.employeeId,
                fixture.serviceId,
                newStart,
                newEnd,
                previousStart,
                previousEnd,
                'QA: klient musi zaakceptować nowy termin.',
                'QA fixture: proszę o widoczny stary i nowy termin.',
            ],
        );
        return id;
    }

    const inserted = await client.query(
        `INSERT INTO appointments
             ("clientId", "employeeId", "serviceId", "startTime", "endTime",
              status, "staffRecommendations", "clientComment", "reservedOnline",
              "onlineDurationNeedsVerification", "internalNote",
              "reschedulePreviousStartTime", "reschedulePreviousEndTime",
              "createdAt", "updatedAt")
         VALUES
             ($1, $2, $3, $4, $5, 'rescheduled_pending', $6, $7, true,
              false, $8, $9, $10, now(), now())
         RETURNING id`,
        [
            fixture.clientId,
            fixture.employeeId,
            fixture.serviceId,
            newStart,
            newEnd,
            'QA: klient musi zaakceptować nowy termin.',
            'QA fixture: proszę o widoczny stary i nowy termin.',
            FIXTURE_TAG,
            previousStart,
            previousEnd,
        ],
    );
    return inserted.rows[0].id;
}

async function main() {
    const config = dbConfig();
    assertConfigured(config);
    const client = new Client(config);
    await client.connect();
    try {
        await client.query('BEGIN');
        const clientId = await ensureClient(client);
        const employeeService = await pickEmployeeService(client);
        const appointmentId = await upsertAppointment(client, {
            clientId,
            employeeId: employeeService.employeeId,
            serviceId: employeeService.serviceId,
            duration: employeeService.duration,
        });
        await client.query('COMMIT');
        console.log(
            JSON.stringify(
                {
                    ok: true,
                    appointmentId,
                    clientEmail: CLIENT_EMAIL,
                    visitUrl: `https://panel.salon-bw.pl/visits?visitId=${appointmentId}`,
                },
                null,
                2,
            ),
        );
    } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
