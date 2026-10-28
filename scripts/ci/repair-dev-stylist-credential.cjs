'use strict';

/**
 * ONE-FIXTURE, OWNER-APPROVED, DEV-ONLY credential synchronization.
 * Run only via an isolated staging GitHub Actions job + pinned SSH tunnel.
 * No booking mutations, account creation, SMTP, app deployment or PROD access.
 */
const { validateEnvironment, validateSyntheticFixture } = require('./verify-dev-stylist-password.cjs');

const STYLIST = 'stylist@salonbw.example.test';
const DEV_DB = 'p11522_salonbw_d';
const ADVISORY_LOCK = 681995027; // Same transaction lock as synthetic DEV seed.

/** Fail closed before connection. Do not report secret values or lengths. */
function validateRepairEnvironment(env) {
    const config = validateEnvironment(env);
    if (env.CONFIRM_DEV_SYNTHETIC_STYLIST_ONLY !== 'yes' ||
        env.APP_ENV !== 'development' ||
        typeof env.E2E_ADMIN_PASSWORD !== 'string' ||
        env.E2E_ADMIN_PASSWORD.length < 16 ||
        /[\r\n]/.test(env.E2E_ADMIN_PASSWORD)
    ) {
        throw new Error('DEV_REPAIR_PREFLIGHT_REJECTED');
    }
    return {
        ...config,
        application_name: 'salonbw_dev_stylist_one_time_credential_repair',
        statement_timeout: 10000,
    };
}

function assertTargetRow(rows) {
    // validateSyntheticFixture requires exactly one non-system salon-admin
    // and a valid bcrypt hash.
    validateSyntheticFixture(rows);
    const row = rows[0];
    if (row.email !== STYLIST ||
        !Number.isSafeInteger(row.id) || row.id <= 0 ||
        !Number.isSafeInteger(row.authVersion) || row.authVersion < 0
    ) {
        throw new Error('SYNTHETIC_STYLIST_IDENTITY_REJECTED');
    }
    return row;
}

/** A single atomic transaction changes only this fixture's password,
 * increases authVersion, and revokes its non-revoked refresh tokens.
 * ALL other tables/users (including login rate-limit history) remain intact.
 */
async function repairDevStylist(env, { Client, bcrypt }) {
    const config = validateRepairEnvironment(env);
    const client = new Client(config);
    let connected = false;
    let transactionOpen = false;

    try {
        await client.connect();
        connected = true;
        await client.query('BEGIN');
        transactionOpen = true;
        await client.query("SET LOCAL statement_timeout = '10s'");
        await client.query("SET LOCAL lock_timeout = '5s'");
        await client.query('SELECT pg_advisory_xact_lock($1)', [ADVISORY_LOCK]);

        const identity = await client.query(
            'SELECT current_database() AS db_name, current_user AS db_user',
        );
        if (identity.rows.length !== 1 ||
            identity.rows[0].db_name !== DEV_DB ||
            identity.rows[0].db_user !== DEV_DB
        ) {
            throw new Error('DEV_DATABASE_IDENTITY_REJECTED');
        }

        const selected = await client.query(
            'SELECT id, email, password, role, "isSystemAdmin", "authVersion" ' +
            'FROM users WHERE email = $1 FOR UPDATE',
            [STYLIST],
        );
        const row = assertTargetRow(selected.rows);
        const password = env.E2E_ADMIN_PASSWORD;

        // Safe re-run: do not rotate or update an account already in sync.
        if (await bcrypt.compare(password, row.password)) {
            await client.query('ROLLBACK');
            transactionOpen = false;
            return 'ALREADY_MATCH';
        }

        const replacementHash = await bcrypt.hash(password, 12);
        if (!(await bcrypt.compare(password, replacementHash))) {
            throw new Error('GENERATED_HASH_NOT_VERIFIED');
        }

        const update = await client.query(
            'UPDATE users SET password = $1, "authVersion" = "authVersion" + 1, ' +
            '"updatedAt" = NOW() WHERE id = $2 AND email = $3 AND role = $4 ' +
            'AND "isSystemAdmin" = false AND "authVersion" = $5 ' +
            'RETURNING id, "authVersion"',
            [replacementHash, row.id, STYLIST, 'admin', row.authVersion],
        );
        if (update.rowCount !== 1 ||
            update.rows.length !== 1 ||
            update.rows[0].id !== row.id ||
            update.rows[0].authVersion !== row.authVersion + 1
        ) {
            throw new Error('SYNTHETIC_STYLIST_UPDATE_REJECTED');
        }

        // No DELETE: preserve refresh-session records as an audit trail.
        // authVersion invalidates pre-existing access JWTs immediately.
        await client.query(
            'UPDATE refresh_tokens SET "revokedAt" = NOW() ' +
            'WHERE "userId" = $1 AND "revokedAt" IS NULL',
            [row.id],
        );

        const check = await client.query(
            'SELECT password, "authVersion" FROM users ' +
            'WHERE id = $1 AND email = $2 AND role = $3 AND "isSystemAdmin" = false',
            [row.id, STYLIST, 'admin'],
        );
        if (check.rows.length !== 1 ||
            check.rows[0].authVersion !== row.authVersion + 1 ||
            !(await bcrypt.compare(password, check.rows[0].password))
        ) {
            throw new Error('POST_UPDATE_VERIFICATION_FAILED');
        }
        const outstanding = await client.query(
            'SELECT COUNT(*)::int AS active FROM refresh_tokens ' +
            'WHERE "userId" = $1 AND "revokedAt" IS NULL',
            [row.id],
        );
        if (outstanding.rows.length !== 1 || outstanding.rows[0].active !== 0) {
            throw new Error('REFRESH_TOKEN_REVOCATION_FAILED');
        }

        await client.query('COMMIT');
        transactionOpen = false;
        return 'UPDATED';
    } catch (error) {
        if (transactionOpen) {
            try { await client.query('ROLLBACK'); } catch { /* keep original error */ }
        }
        throw error;
    } finally {
        if (connected) {
            try { await client.end(); } catch { /* do not reveal DB connection details */ }
        }
    }
}

async function main() {
    try {
        const { createRequire } = require('node:module');
        const { join } = require('node:path');
        const requireBackend = createRequire(
            join(__dirname, '../../backend/salonbw-backend/package.json'),
        );
        const result = await repairDevStylist(process.env, {
            Client: requireBackend('pg').Client,
            bcrypt: requireBackend('bcrypt'),
        });
        // No row, ID, hash, password, request body, cookie or connection string.
        process.stdout.write('DEV_STYLIST_CREDENTIAL_REPAIR=' + result + '\n');
    } catch {
        process.stderr.write(
            'BLOCKED: DEV-only synthetic credential repair rolled back ' +
            'or could not confirm safe completion. Do not retry blindly.\n',
        );
        process.exitCode = 2;
    }
}

module.exports = { validateRepairEnvironment, assertTargetRow, repairDevStylist };
if (require.main === module) void main();
