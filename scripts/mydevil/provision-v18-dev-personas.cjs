'use strict';

/**
 * SalonBW V18 — isolated DEV account provisioning.
 *
 * Executed only via a deliberately gated staging workflow on MyDevil.
 * - Never handles production data.
 * - Never writes credentials to GitHub logs or source control.
 * - Existing DEV appointments/users are preserved; only roster participation
 *   is disabled for other synthetic admin/employee fixtures.
 * - Both personas retain the existing role=admin API permission model;
 *   isSystemAdmin separates technical administration from bookable salon owner.
 */
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.join(process.cwd(), '.env'), quiet: true });

function refuse(message) {
    throw new Error('DEV_PERSONA_GUARD: ' + message);
}

function getConfig() {
    if (process.env.APP_ENV !== 'development') {
        refuse('APP_ENV must equal development');
    }
    if (process.env.SALONBW_DEV_PERSONAS_APPROVED !== '2026-11-11') {
        refuse('missing explicit DEV-only approval marker');
    }
    if (!process.cwd().includes('api_salonbw_dev')) {
        refuse('must execute from the DEV API application directory');
    }
    const databaseUrl = process.env.DATABASE_URL;
    const name = databaseUrl
        ? new URL(databaseUrl).pathname.replace(/^\//, '')
        : process.env.DB_NAME || process.env.PGDATABASE;
    // Exact DEV database name independently verified by read-only census
    // workflow 43039187406. Never infer identity from a permissive suffix.
    if (name !== 'p11522_salonbw_d') {
        refuse('database does not match the verified DEV database identity');
    }
    return databaseUrl
        ? { connectionString: databaseUrl }
        : {
              host: process.env.DB_HOST || process.env.PGHOST,
              port: Number(process.env.DB_PORT || 5432),
              user: process.env.DB_USER || process.env.PGUSER,
              password: process.env.DB_PASS || process.env.PGPASSWORD,
              database: name,
          };
}

const PERSONAS = Object.freeze([
    {
        email: 'v18.owner@dev.salon-bw.pl',
        name: 'DEV Owner Stylist (synthetic)',
        technical: false,
        bookable: true,
    },
    {
        email: 'v18.system-admin@dev.salon-bw.pl',
        name: 'DEV System Admin (synthetic)',
        technical: true,
        bookable: false,
    },
]);

async function main() {
    process.umask(0o077);
    const config = getConfig();
    const privateDir = path.join(os.homedir(), '.deployment-private', 'v18-personas');
    fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
    fs.chmodSync(privateDir, 0o700);

    // Produce credentials before changing identities; no plaintext in logs.
    const entries = await Promise.all(
        PERSONAS.map(async (persona) => {
            const password = crypto.randomBytes(36).toString('base64url');
            return { ...persona, password, hash: await bcrypt.hash(password, 12) };
        }),
    );
    const timestamp = new Date().toISOString();
    const credentialsPath = path.join(privateDir, 'DEV-V18-LOGIN.txt');
    const temporaryPath = path.join(
        privateDir,
        '.DEV-V18-LOGIN.' + process.pid + '.' + crypto.randomBytes(6).toString('hex'),
    );
    const payload = [
        'SalonBW synthetic DEV accounts — no production access',
        'Issued (UTC): ' + timestamp,
        ...entries.flatMap((entry) => [
            '',
            (entry.technical ? 'TECHNICAL ADMIN' : 'OWNER / STYLIST') + ':',
            'URL: https://dev-panel.salon-bw.pl',
            'Login: ' + entry.email,
            'Password: ' + entry.password,
        ]),
        '',
    ].join('\n');
    fs.writeFileSync(temporaryPath, payload, {
        mode: 0o600,
        flag: 'wx',
    });

    const client = new Client(config);
    let committed = false;
    try {
        await client.connect();
        const database = await client.query('SELECT current_database() AS name');
        if (database.rows[0]?.name !== 'p11522_salonbw_d') {
            refuse('connection target differs from verified DEV database');
        }
        const present = await client.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'users'
              AND column_name IN ('calendarStaffActive', 'isSystemAdmin')
        `);
        const columns = new Set(present.rows.map((row) => row.column_name));
        if (!columns.has('isSystemAdmin')) {
            refuse('system administrator identity flag is not installed');
        }
        const rosterSupported = columns.has('calendarStaffActive');

        await client.query('BEGIN');
        await client.query(
            "SELECT pg_advisory_xact_lock(hashtext('salonbw:dev-v18-personas'))",
        );

        for (const entry of entries) {
            const existing = await client.query(
                'SELECT id, name FROM "users" WHERE LOWER(email)=LOWER($1) FOR UPDATE',
                [entry.email],
            );
            if (
                existing.rowCount &&
                existing.rows[0].name !== entry.name
            ) {
                refuse('email already used by a non-fixture identity');
            }

            // Pre-provision on existing DEV API even before the additive
            // calendar roster migration is deployed. No untracked schema
            // migration is performed by this fixture seeder.
            const insertSql = rosterSupported
                ? `INSERT INTO "users" (
                    "email", "name", "password", "role", "isSystemAdmin",
                    "calendarStaffActive", "receiveNotifications", "notifyPanel",
                    "notifySms", "notifyWhatsapp", "notifyEmail",
                    "createdAt", "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4::"users_role_enum", $5,
                    $6, false, false, false, false, false, NOW(), NOW()
                )
                ON CONFLICT ("email") DO UPDATE SET
                    "password" = EXCLUDED."password",
                    "role" = EXCLUDED."role",
                    "isSystemAdmin" = EXCLUDED."isSystemAdmin",
                    "calendarStaffActive" = EXCLUDED."calendarStaffActive",
                    "receiveNotifications" = false,
                    "notifyPanel" = false,
                    "notifySms" = false,
                    "notifyWhatsapp" = false,
                    "notifyEmail" = false,
                    "updatedAt" = NOW()`
                : `INSERT INTO "users" (
                    "email", "name", "password", "role", "isSystemAdmin",
                    "receiveNotifications", "notifyPanel", "notifySms",
                    "notifyWhatsapp", "notifyEmail", "createdAt", "updatedAt"
                ) VALUES (
                    $1, $2, $3, $4::"users_role_enum", $5,
                    false, false, false, false, false, NOW(), NOW()
                )
                ON CONFLICT ("email") DO UPDATE SET
                    "password" = EXCLUDED."password",
                    "role" = EXCLUDED."role",
                    "isSystemAdmin" = EXCLUDED."isSystemAdmin",
                    "receiveNotifications" = false,
                    "notifyPanel" = false,
                    "notifySms" = false,
                    "notifyWhatsapp" = false,
                    "notifyEmail" = false,
                    "updatedAt" = NOW()`;
            const params = [
                entry.email,
                entry.name,
                entry.hash,
                'admin',
                entry.technical,
                ...(rosterSupported ? [entry.bookable] : []),
            ];
            await client.query(insertSql, params);
        }

        // Once the roster feature is deployed, deactivate synthetic
        // admin/employee fixtures but keep their complete records/history.
        let deactivatedCount = 0;
        if (rosterSupported) {
            const disabled = await client.query(
                `UPDATE "users"
                 SET "calendarStaffActive" = false
                 WHERE "role"::text IN ('admin', 'employee')
                   AND "isSystemAdmin" = false
                   AND LOWER("email") <> LOWER($1)
                   AND "calendarStaffActive" IS DISTINCT FROM false`,
                [PERSONAS[0].email],
            );
            deactivatedCount = disabled.rowCount;
        }
        const roles = await client.query(
            `SELECT "email", "role"::text AS "role",
                    "isSystemAdmin"${rosterSupported ? ', "calendarStaffActive"' : ''}
             FROM "users"
             WHERE "email" = ANY($1::text[])
             ORDER BY "email"`,
            [PERSONAS.map((persona) => persona.email)],
        );
        if (
            roles.rows.length !== 2 ||
            !roles.rows.some(
                (u) =>
                    u.email === PERSONAS[0].email &&
                    u.role === 'admin' &&
                    u.isSystemAdmin === false &&
                    (!rosterSupported || u.calendarStaffActive === true),
            ) ||
            !roles.rows.some(
                (u) =>
                    u.email === PERSONAS[1].email &&
                    u.role === 'admin' &&
                    u.isSystemAdmin === true &&
                    (!rosterSupported || u.calendarStaffActive === false),
            )
        ) {
            refuse('postcondition failed: full-role DEV personas not created');
        }
        await client.query('COMMIT');
        committed = true;

        // The existing file is replaced only after successful database commit.
        fs.renameSync(temporaryPath, credentialsPath);
        fs.chmodSync(credentialsPath, 0o600);
        console.log(JSON.stringify({
            status: 'DEV_PERSONAS_PROVISIONED',
            ownerRole: 'admin',
            adminRole: 'admin',
            ownerBookable: true,
            technicalAdminBookable: false,
            formerSyntheticStaffDeactivated: deactivatedCount,
            rosterFeatureDeployed: rosterSupported,
            passwordsLogged: false,
            credentialLocation: '~/.deployment-private/v18-personas/DEV-V18-LOGIN.txt',
        }));
    } catch (error) {
        if (!committed) {
            try { await client.query('ROLLBACK'); } catch { /* no transaction */ }
        }
        throw error;
    } finally {
        await client.end().catch(() => undefined);
        try { fs.unlinkSync(temporaryPath); } catch { /* renamed or never created */ }
    }
}

main().catch((error) => {
    // Never log database URLs, query params, credentials or plaintext passwords.
    console.error(error.message.startsWith('DEV_PERSONA_GUARD:')
        ? error.message
        : 'DEV_PERSONAS_FAILED: consult private server logs (no credentials printed)');
    process.exitCode = 1;
});
