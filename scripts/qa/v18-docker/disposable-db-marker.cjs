'use strict';

// Operates only inside the Docker Compose private namespace with a tmpfs PG.
// Tests that non-empty database seed is rejected WITHOUT losing marker data.
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { Client } = createRequire(
    path.resolve(__dirname, '../../../backend/salonbw-backend/package.json'),
)('pg');

const EXPECTED =
    'postgresql://salonbw_browser_uat:salonbw_browser_uat_local_only@127.0.0.1:5432/salonbw_browser_uat';
const MARKER = 3210123;
const CATALOG_COUNT = [
    'SELECT count(*)::integer AS total FROM pg_catalog.pg_class c',
    'JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace',
    "WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')",
    "AND n.nspname NOT LIKE 'pg_toast%'",
    "AND n.nspname NOT LIKE 'pg_temp_%'",
    "AND c.relkind IN ('r', 'p', 'v', 'm', 'f', 'S')",
].join(' ');

function assertContainerScope() {
    if (
        process.platform !== 'linux' ||
        !fs.existsSync('/.dockerenv') ||
        process.env.QA_ISOLATED_DOCKER !== '1' ||
        process.env.CI !== 'true' ||
        process.env.GITHUB_ACTIONS === 'true' ||
        !/^[a-f0-9]{40}$/.test(process.env.V18_QA_SOURCE_SHA || '') ||
        process.env.DATABASE_URL !== EXPECTED
    ) {
        throw new Error('Docker disposable PostgreSQL guard refused the environment');
    }
}

async function main() {
    assertContainerScope();
    const mode = process.argv[2];
    if (!['mark-nonempty', 'assert-unchanged-and-clear'].includes(mode)) {
        throw new Error('Unexpected disposable DB marker mode');
    }
    const client = new Client({
        connectionString: EXPECTED,
        connectionTimeoutMillis: 8000,
        query_timeout: 10000,
        application_name: 'salonbw_disposable_marker',
    });
    await client.connect();
    try {
        const identity = await client.query(
            'SELECT current_database() AS db, current_user AS rol',
        );
        if (
            identity.rows.length !== 1 ||
            identity.rows[0].db !== 'salonbw_browser_uat' ||
            identity.rows[0].rol !== 'salonbw_browser_uat'
        ) {
            throw new Error('Disposable DB identity mismatch');
        }

        if (mode === 'mark-nonempty') {
            const objects = await client.query(CATALOG_COUNT);
            if (objects.rows[0]?.total !== 0) {
                throw new Error('Disposable DB is already populated');
            }
            await client.query('BEGIN');
            try {
                await client.query(
                    'CREATE TABLE public.__salonbw_disposable_guard_marker (code integer NOT NULL)',
                );
                await client.query(
                    'INSERT INTO public.__salonbw_disposable_guard_marker (code) VALUES ($1)',
                    [MARKER],
                );
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
            process.stdout.write('DISPOSABLE_DB_NEGATIVE_MARKER=CREATED\n');
            return;
        }

        const rows = await client.query(
            'SELECT code FROM public.__salonbw_disposable_guard_marker',
        );
        if (rows.rows.length !== 1 || rows.rows[0].code !== MARKER) {
            throw new Error('Non-empty preflight altered the marker');
        }
        const objects = await client.query(CATALOG_COUNT);
        if (objects.rows[0]?.total !== 1) {
            throw new Error('Non-empty seed unexpectedly created objects');
        }
        process.stdout.write('DISPOSABLE_DB_NEGATIVE_NO_DATA_LOSS=PASS\n');
        // Remove only our exact marker inside the verified disposable DB.
        await client.query('DROP TABLE public.__salonbw_disposable_guard_marker');
        process.stdout.write('DISPOSABLE_DB_READY_FOR_SEED=PASS\n');
    } finally {
        await client.end();
    }
}
void main().catch(() => {
    // Do not expose credentials or driver error details.
    process.stderr.write('DISPOSABLE_DB_NEGATIVE_GUARD=BLOCKED\n');
    process.exitCode = 1;
});
