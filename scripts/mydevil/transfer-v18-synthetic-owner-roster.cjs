'use strict';

/**
 * One-time, auditable, DEV-only synthetic owner roster configuration.
 * Does not delete users, visits, time blocks, financial records or assignments.
 * No durable snapshots are created; provider backups are owner's DEV choice.
 * Usage: --dry-run (default) or --execute (controlled CI after review).
 */
const path = require('node:path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve('.env'), quiet: true });

const EXPECTED_DB = 'p11522_salonbw_d';
const OWNER_EMAIL = 'v18.owner@dev.salon-bw.pl';
const SYNTHETIC_NAME = 'Ola — DEV (syntetyczna)';
const EXECUTE = process.argv.includes('--execute');

function guard(ok, reason) {
    if (!ok) throw new Error('ROSTER_GUARD_' + reason);
}

async function main() {
    guard(
        process.env.APP_ENV === 'development' &&
            process.cwd().includes('/apps/nodejs/api_salonbw_dev'),
        'ENVIRONMENT',
    );
    guard(
        !EXECUTE ||
            process.env.SALONBW_V18_ROSTER_APPROVED === '2026-11-11-DEV-only',
        'APPROVAL',
    );
    const configuredName = process.env.DATABASE_URL
        ? new URL(process.env.DATABASE_URL).pathname.slice(1)
        : process.env.DB_NAME || process.env.PGDATABASE;
    guard(configuredName === EXPECTED_DB, 'DB_IDENTITY');

    const cfg = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
              host: process.env.DB_HOST || process.env.PGHOST,
              port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
              user: process.env.DB_USER || process.env.PGUSER,
              password: process.env.DB_PASS || process.env.PGPASSWORD,
              database: configuredName,
          };
    const db = new Client(cfg);
    await db.connect();
    try {
        await db.query('BEGIN');
        await db.query("SET LOCAL lock_timeout='5s'");
        await db.query("SET LOCAL statement_timeout='20000ms'");
        const name = await db.query('SELECT current_database() AS name');
        guard(name.rows[0]?.name === EXPECTED_DB, 'CONNECTED_DB');
        await db.query(
            "SELECT pg_advisory_xact_lock(hashtext('salonbw:dev-v18-owner-roster'))",
        );

        const ownerResult = await db.query(
            `SELECT id, role::text AS role, "isSystemAdmin" AS tech
            FROM users WHERE email=$1 FOR UPDATE`,
            [OWNER_EMAIL],
        );
        guard(
            ownerResult.rowCount === 1 &&
                ownerResult.rows[0].role === 'admin' &&
                ownerResult.rows[0].tech === false,
            'OWNER_MISSING_OR_UNSAFE',
        );
        const ownerId = Number(ownerResult.rows[0].id);

        const allEligible = await db.query(`
            SELECT u.id,
                   COUNT(es.id)::integer AS services
            FROM users u
            JOIN employee_services es
                ON es."employeeId" = u.id AND es."isActive" = true
            JOIN services s
                ON s.id=es."serviceId" AND s."isActive" = true
            WHERE u.role::text IN ('admin','employee')
              AND u."isSystemAdmin" = false
            GROUP BY u.id
            ORDER BY u.id
        `);
        const catalog = await db.query(
            'SELECT COUNT(*)::integer AS count FROM services WHERE "isActive"=true',
        );
        const totalActive = Number(catalog.rows[0]?.count);
        guard(totalActive > 0, 'EMPTY_SERVICE_CATALOG');

        if (
            allEligible.rows.length === 1 &&
            Number(allEligible.rows[0].id) === ownerId
        ) {
            const t = await db.query(`
                SELECT COUNT(*)::integer AS count
                FROM timetables
                WHERE "employeeId"=$1 AND "isActive"=true
                  AND "validFrom"<=CURRENT_DATE
                  AND ("validTo" IS NULL OR "validTo">=CURRENT_DATE)
            `, [ownerId]);
            guard(Number(t.rows[0].count) === 1, 'OWNER_TIMETABLE');
            await db.query('ROLLBACK');
            console.log(JSON.stringify({
                state: 'ALREADY_CONFIGURED',
                effectiveProviders: 1,
                activeOwnerServices: Number(allEligible.rows[0].services),
                ownerHasTimetable: true,
                dataDeleted: false,
            }));
            return;
        }

        guard(allEligible.rows.length === 1, 'NOT_ONE_SOURCE');
        const sourceId = Number(allEligible.rows[0].id);
        guard(sourceId !== ownerId, 'SAME_SOURCE_AND_OWNER');
        guard(
            Number(allEligible.rows[0].services) === totalActive,
            'SOURCE_CATALOG_MISMATCH',
        );
        const source = await db.query(
            `SELECT name, role::text AS role, "isSystemAdmin" AS tech
            FROM users WHERE id=$1 FOR UPDATE`,
            [sourceId],
        );
        guard(
            source.rowCount === 1 &&
                source.rows[0].tech === false &&
                /test|synthetic|migracyjn|uat|e2e/i.test(source.rows[0].name),
            'SOURCE_NOT_SYNTHETIC',
        );

        const oldOwnerRows = await db.query(
            'SELECT COUNT(*)::integer AS count FROM employee_services WHERE "employeeId"=$1',
            [ownerId],
        );
        guard(Number(oldOwnerRows.rows[0].count) === 0, 'OWNER_ALREADY_ASSIGNED');

        const activeTimetable = await db.query(`
            SELECT t.id, COUNT(sl.id)::integer AS slots
            FROM timetables t
            LEFT JOIN timetable_slots sl ON sl."timetableId"=t.id
            WHERE t."employeeId"=$1 AND t."isActive"=true
              AND t."validFrom"<=CURRENT_DATE
              AND (t."validTo" IS NULL OR t."validTo">=CURRENT_DATE)
            GROUP BY t.id
        `, [sourceId]);
        guard(
            activeTimetable.rowCount === 1 &&
                Number(activeTimetable.rows[0].slots) >= 5,
            'SOURCE_TIMETABLE_INVALID',
        );
        const oldOwnerTimetable = await db.query(
            'SELECT COUNT(*)::integer AS count FROM timetables WHERE "employeeId"=$1',
            [ownerId],
        );
        guard(Number(oldOwnerTimetable.rows[0].count) === 0, 'OWNER_HAS_TIMETABLE');

        // Safe read-only plan: all preconditions, database identity, service
        // assignment cardinality and timetable availability were checked.
        if (!EXECUTE) {
            await db.query('ROLLBACK');
            console.log(JSON.stringify({
                state: 'READY',
                operation: 'DEV_ONLY_TRANSFER_ROSTER',
                expectedActiveServices: totalActive,
                timetableSlots: Number(activeTimetable.rows[0].slots),
                effectiveProvidersBefore: allEligible.rows.length,
                expectedProvidersAfter: 1,
                historicVisitsModified: false,
                usersDeleted: false,
                snapshotsCreated: false,
            }));
            return;
        }

        await db.query(
            'UPDATE users SET name=$2, "updatedAt"=NOW() WHERE id=$1',
            [ownerId, SYNTHETIC_NAME],
        );

        const transfer = await db.query(`
            INSERT INTO employee_services (
                "employeeId","serviceId","serviceVariantId",
                "customDuration","customPrice","commissionPercent",
                "isActive","createdAt"
            )
            SELECT $1,es."serviceId",es."serviceVariantId",
                   es."customDuration",es."customPrice",es."commissionPercent",
                   true,NOW()
            FROM employee_services es
            JOIN services s ON s.id=es."serviceId" AND s."isActive"=true
            WHERE es."employeeId"=$2 AND es."isActive"=true
            RETURNING id
        `, [ownerId, sourceId]);
        guard(transfer.rowCount === totalActive, 'COPIED_ASSIGNMENTS');

        const t = await db.query(`
            INSERT INTO timetables (
                "employeeId","name","description",
                "validFrom","validTo","isActive","createdAt","updatedAt"
            )
            SELECT $1,'V18 synthetic owner timetable',t."description",
                   CURRENT_DATE,t."validTo",true,NOW(),NOW()
            FROM timetables t WHERE id=$2
            RETURNING id
        `, [ownerId, activeTimetable.rows[0].id]);
        guard(t.rowCount === 1, 'COPIED_TIMETABLE');

        const slots = await db.query(`
            INSERT INTO timetable_slots (
                "timetableId","dayOfWeek","startTime","endTime",
                "isBreak","notes","createdAt"
            )
            SELECT $1,"dayOfWeek","startTime","endTime",
                   "isBreak","notes",NOW()
            FROM timetable_slots WHERE "timetableId"=$2
            RETURNING id
        `, [t.rows[0].id, activeTimetable.rows[0].id]);
        guard(
            slots.rowCount === Number(activeTimetable.rows[0].slots),
            'COPIED_TIMETABLE_SLOTS',
        );

        const deactivated = await db.query(`
            UPDATE employee_services SET "isActive"=false
            WHERE "employeeId"=$1 AND "isActive"=true
            RETURNING id
        `, [sourceId]);
        guard(deactivated.rowCount === totalActive, 'SOURCE_NOT_DEACTIVATED');

        const after = await db.query(`
            SELECT u.id,COUNT(es.id)::integer AS services
            FROM users u
            JOIN employee_services es
              ON es."employeeId"=u.id AND es."isActive"=true
            JOIN services s
              ON s.id=es."serviceId" AND s."isActive"=true
            WHERE u.role::text IN ('admin','employee')
              AND u."isSystemAdmin"=false
            GROUP BY u.id
        `);
        guard(
            after.rowCount === 1 &&
                Number(after.rows[0].id) === ownerId &&
                Number(after.rows[0].services) === totalActive,
            'POSTCONDITION',
        );
        await db.query('COMMIT');
        console.log(JSON.stringify({
            state: 'APPLIED',
            effectiveProviders: 1,
            activeOwnerServices: totalActive,
            transferredTimetableSlots: slots.rowCount,
            oldProviderAssignmentsDisabled: deactivated.rowCount,
            usersDeleted: false,
            appointmentsUpdated: false,
            providerBackupsUsed: false,
        }));
    } catch (error) {
        await db.query('ROLLBACK').catch(() => undefined);
        throw error;
    } finally {
        await db.end();
    }
}

main().catch((e) => {
    const allowed = /^ROSTER_GUARD_[A-Z_]+$/.test(e?.message ?? '');
    console.error(
        allowed ? e.message : 'DEV_ROSTER_OPERATION_FAILED (private details suppressed)',
    );
    process.exitCode = 1;
});
