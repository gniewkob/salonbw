'use strict';

/**
 * Compare the GitHub staging E2E password with the synthetic DEV stylist's
 * bcrypt hash. SELECT-only transaction; no HTTP login, secret/hash output,
 * appointment writes, account reset or database mutation.
 *
 * This script must be used only with the dedicated, loopback SSH tunnel in
 * verify-dev-stylist-credential.yml. No production fallback is permitted.
 */
const DEV_DB_NAME = 'p11522_salonbw_d';
const DEV_DB_HOST = 'pgsql0.mydevil.net';
const STYLIST = 'stylist@salonbw.example.test';
const TUNNEL_HOST = '127.0.0.1';
const TUNNEL_PORT = 8543;

function validateEnvironment(env) {
    if (
        env.DEV_DB_NAME !== DEV_DB_NAME ||
        env.DEV_DB_USER !== DEV_DB_NAME ||
        env.DEV_DB_HOST !== DEV_DB_HOST ||
        (env.DEV_DB_PORT || '5432') !== '5432'
    ) {
        throw new Error('UNSAFE_DEV_DATABASE_TARGET');
    }
    if (
        !env.MYDEVIL_DEV_DB_PASSWORD ||
        !env.E2E_ADMIN_PASSWORD ||
        env.E2E_ADMIN_EMAIL !== STYLIST
    ) {
        throw new Error('MISSING_DEV_CREDENTIAL');
    }
    return {
        host: TUNNEL_HOST,
        port: TUNNEL_PORT,
        database: DEV_DB_NAME,
        user: DEV_DB_NAME,
        password: env.MYDEVIL_DEV_DB_PASSWORD,
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        application_name: 'salonbw_dev_stylist_readonly_check',
    };
}

function validateSyntheticFixture(rows) {
    if (!Array.isArray(rows) || rows.length !== 1) {
        throw new Error('SYNTHETIC_FIXTURE_NOT_UNIQUE');
    }
    const record = rows[0];
    if (
        record.role !== 'admin' ||
        record.isSystemAdmin !== false ||
        typeof record.password !== 'string' ||
        !/^\$2[aby]\$\d{2}\$/.test(record.password)
    ) {
        throw new Error('SYNTHETIC_FIXTURE_INVALID');
    }
    return record.password;
}

/**
 * "UNSAFE/MISSING" are preflight failures, "MISMATCH" is a conclusive
 * credential difference. Never return, print or retain the stored hash.
 */
async function verifyCredential(env, { Client, bcrypt }) {
    const connection = validateEnvironment(env);
    const client = new Client(connection);
    let connected = false;
    let inTransaction = false;
    try {
        await client.connect();
        connected = true;
        await client.query('BEGIN TRANSACTION READ ONLY');
        inTransaction = true;
        await client.query("SET LOCAL statement_timeout = '10s'");
        const identity = await client.query(
            'SELECT current_database() AS db_name, current_user AS db_user',
        );
        if (
            identity.rows.length !== 1 ||
            identity.rows[0].db_name !== DEV_DB_NAME ||
            identity.rows[0].db_user !== DEV_DB_NAME
        ) {
            throw new Error('DATABASE_IDENTITY_MISMATCH');
        }
        const result = await client.query(
            'SELECT password, role, "isSystemAdmin" FROM users WHERE email = $1 LIMIT 2',
            [STYLIST],
        );
        const hash = validateSyntheticFixture(result.rows);
        const matches = await bcrypt.compare(env.E2E_ADMIN_PASSWORD, hash);
        return matches === true ? 'MATCH' : 'MISMATCH';
    } finally {
        if (connected && inTransaction) {
            try {
                await client.query('ROLLBACK');
            } catch {
                // Preserve original error; connection is always closed below.
            }
        }
        if (connected) {
            try {
                await client.end();
            } catch {
                // Do not expose connection strings or client error metadata.
            }
        }
    }
}

async function main() {
    try {
        // Resolve pnpm dependencies from the backend package (not the monorepo root).
        // The workflow does not run backend code or alter its deployment.
        const { createRequire } = require('node:module');
        const { join } = require('node:path');
        const requireBackend = createRequire(
            join(__dirname, '../../backend/salonbw-backend/package.json'),
        );
        const result = await verifyCredential(process.env, {
            Client: requireBackend('pg').Client,
            bcrypt: requireBackend('bcrypt'),
        });
        // The only positive output. No hash, password, rows or session data.
        process.stdout.write('DEV_SYNTHETIC_STYLIST_PASSWORD=' + result + '\n');
        if (result !== 'MATCH') process.exitCode = 3;
    } catch {
        process.stderr.write(
            'BLOCKED: fixture comparison could not be completed; ' +
            'verify DEV-only configuration and tunnel, without exposing secrets.\n',
        );
        process.exitCode = 2;
    }
}

module.exports = {
    validateEnvironment,
    validateSyntheticFixture,
    verifyCredential,
};
if (require.main === module) void main();
