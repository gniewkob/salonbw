import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Source contract only. The actual DB preflight must also run on a disposable
// PostgreSQL; this test does not connect to any database or launch the fixture.
const source = readFileSync(
    resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../backend/salonbw-backend/scripts/qa-owner-browser-postgres.ts',
    ),
    'utf8',
);

test('browser UAT fixture never drops an existing schema', () => {
    assert.match(source, /dropSchema:\s*false\s*,/);
    assert.doesNotMatch(source, /dropSchema:\s*(?:true|mode\s*===\s*['"]seed['"])/);
    assert.match(source, /migrationsRun:\s*mode\s*===\s*['"]seed['"]/);
});

test('seed first checks a fresh disposable database in a read-only transaction', () => {
    assert.match(source, /BEGIN TRANSACTION READ ONLY/);
    assert.match(source, /current_database\(\)/);
    assert.match(source, /current_user/);
    assert.match(source, /pg_catalog\.pg_class/);
    assert.match(source, /user_object_count\s*!==\s*0/);
    assert.match(source, /extra_schema_count\s*!==\s*0/);
    const preflightCall = source.indexOf('await assertFreshDisposableDatabase()');
    const datasourceCreation = source.indexOf('new DataSource(');
    assert.ok(preflightCall > 0 && datasourceCreation > preflightCall);
});

test('fixture preserves strict synthetic CI target and disabled delivery flags', () => {
    // Both supported runners require CI=true; only Docker needs its own
    // container identity, disabled GitHub mode and immutable source SHA.
    assert.match(
        source,
        /const githubRunner\s*=\s*process\.env\.GITHUB_ACTIONS\s*===\s*'true'\s*&&\s*process\.env\.CI\s*===\s*'true'/,
    );
    assert.match(
        source,
        /const isolatedDockerRunner\s*=\s*process\.env\.QA_ISOLATED_DOCKER\s*===\s*'1'/,
    );
    assert.match(source, /process\.env\.GITHUB_ACTIONS\s*!==\s*'true'/);
    assert.match(source, /process\.env\.CI\s*===\s*'true'/);
    assert.match(source, /process\.platform\s*===\s*'linux'/);
    assert.match(source, /existsSync\('\/\.dockerenv'\)/);
    assert.match(source, /V18_QA_SOURCE_SHA/);
    assert.match(source, /\(!githubRunner\s*&&\s*!isolatedDockerRunner\)/);
    assert.match(source, /process\.env\.DATABASE_URL\s*!==\s*DATABASE_URL/);
    assert.match(source, /process\.env\.OUTBOUND_DELIVERY_ENABLED\s*!==\s*'false'/);
    assert.match(source, /process\.env\.SMSAPI_ENABLED\s*!==\s*'false'/);
    assert.match(
        source,
        /postgresql:\/\/salonbw_browser_uat:salonbw_browser_uat_local_only@127\.0\.0\.1:5432\/salonbw_browser_uat/,
    );
});
