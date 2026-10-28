'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const {
    validateRepairEnvironment,
    assertTargetRow,
    repairDevStylist,
} = require('./repair-dev-stylist-credential.cjs');

const env = Object.freeze({
    DEV_DB_NAME: 'p11522_salonbw_d',
    DEV_DB_USER: 'p11522_salonbw_d',
    DEV_DB_HOST: 'pgsql0.mydevil.net',
    DEV_DB_PORT: '5432',
    MYDEVIL_DEV_DB_PASSWORD: randomBytes(24).toString('hex'),
    E2E_ADMIN_EMAIL: 'stylist@salonbw.example.test',
    E2E_ADMIN_PASSWORD: randomBytes(24).toString('hex'),
    CONFIRM_DEV_SYNTHETIC_STYLIST_ONLY: 'yes',
    APP_ENV: 'development',
});

const oldHash = '$2b$12$' + 'A'.repeat(53);
const newHash = '$2b$12$' + 'B'.repeat(53);
const fixture = Object.freeze({
    id: 21,
    email: 'stylist@salonbw.example.test',
    password: oldHash,
    role: 'admin',
    isSystemAdmin: false,
    authVersion: 4,
});

function mock({ matched = false, rows = [fixture], wrongDb = false,
    updateCount = 1, activeTokens = 0, hashVerified = true, failAt = '' } = {}) {
    const statements = [];
    let mutated = false;
    class Client {
        constructor(config) {
            assert.equal(config.host, '127.0.0.1');
            assert.equal(config.port, 8543);
            assert.equal(config.database, 'p11522_salonbw_d');
        }
        async connect() { statements.push('connect'); }
        async end() { statements.push('end'); }
        async query(sql, params = []) {
            statements.push({ sql, params: [...params] });
            if (failAt && sql.startsWith(failAt)) throw new Error('fake failure');
            if (sql.startsWith('SELECT current_database()')) {
                return { rows: [{
                    db_name: wrongDb ? 'prod' : 'p11522_salonbw_d',
                    db_user: 'p11522_salonbw_d',
                }] };
            }
            if (sql.startsWith('SELECT id, email, password')) {
                assert.deepEqual(params, ['stylist@salonbw.example.test']);
                return { rows };
            }
            if (sql.startsWith('UPDATE users')) {
                mutated = true;
                assert.deepEqual(params.slice(1), [
                    fixture.id, fixture.email, 'admin', fixture.authVersion,
                ]);
                assert.equal(params[0], newHash);
                return {
                    rowCount: updateCount,
                    rows: updateCount ? [{
                        id: fixture.id,
                        authVersion: fixture.authVersion + 1,
                    }] : [],
                };
            }
            if (sql.startsWith('UPDATE refresh_tokens')) {
                assert.deepEqual(params, [fixture.id]);
                return { rowCount: 2 };
            }
            if (sql.startsWith('SELECT ') && sql.includes('WHERE id = $1 AND email = $2 AND role = $3')) {
                assert.deepEqual(params, [fixture.id, fixture.email, 'admin']);
                return { rows: [{
                    password: newHash,
                    authVersion: fixture.authVersion + 1,
                }] };
            }
            if (sql.startsWith('SELECT COUNT(*)::int')) {
                assert.deepEqual(params, [fixture.id]);
                return { rows: [{ active: activeTokens }] };
            }
            return { rows: [], rowCount: 0 };
        }
    }
    const bcrypt = {
        async compare(p, hash) {
            assert.equal(p, env.E2E_ADMIN_PASSWORD);
            if (hash === oldHash) return matched;
            if (hash === newHash) return hashVerified;
            throw new Error('unexpected mock hash');
        },
        async hash(p, rounds) {
            assert.equal(p, env.E2E_ADMIN_PASSWORD);
            assert.equal(rounds, 12);
            return newHash;
        },
    };
    return { Client, bcrypt, statements, get mutated() { return mutated; } };
}

function statementsOf(deps) {
    return deps.statements.filter(x => typeof x === 'object').map(x => x.sql);
}

test('fail closed before opening any database connection for wrong environment, secret or target', () => {
    assert.equal(validateRepairEnvironment(env).database, 'p11522_salonbw_d');
    for (const bad of [
        { DEV_DB_NAME: 'prod' }, { DEV_DB_USER: 'prod' },
        { DEV_DB_HOST: 'prod.example' }, { DEV_DB_PORT: '5434' },
        { E2E_ADMIN_EMAIL: 'admin@salonbw.example.test' },
        { E2E_ADMIN_PASSWORD: env.E2E_ADMIN_PASSWORD.slice(0, 4) },
        { CONFIRM_DEV_SYNTHETIC_STYLIST_ONLY: 'no' },
        { APP_ENV: 'production' },
    ]) assert.throws(() => validateRepairEnvironment({ ...env, ...bad }));
});

test('reject other identities even if a bcrypt password hash exists', () => {
    assert.equal(assertTargetRow([fixture]).id, 21);
    for (const rows of [
        [], [fixture, fixture],
        [{ ...fixture, email: 'admin@salonbw.example.test' }],
        [{ ...fixture, role: 'client' }],
        [{ ...fixture, isSystemAdmin: true }],
        [{ ...fixture, authVersion: null }],
        [{ ...fixture, password: 'not a bcrypt hash' }],
    ]) assert.throws(() => assertTargetRow(rows));
});

test('MISMATCH -> atomic single-user update, session revocation, readback then COMMIT', async () => {
    const deps = mock();
    const result = await repairDevStylist(env, deps);
    assert.equal(result, 'UPDATED');
    const sql = statementsOf(deps);
    assert.deepEqual(sql.slice(0, 5), [
        'BEGIN',
        "SET LOCAL statement_timeout = '10s'",
        "SET LOCAL lock_timeout = '5s'",
        'SELECT pg_advisory_xact_lock($1)',
        'SELECT current_database() AS db_name, current_user AS db_user',
    ]);
    assert.equal(sql.filter(s => s.startsWith('UPDATE users')).length, 1);
    assert.equal(sql.filter(s => s.startsWith('UPDATE refresh_tokens')).length, 1);
    assert.equal(sql.at(-1), 'COMMIT');
    assert.equal(deps.statements.at(-1), 'end');
    assert.ok(sql.every(s => !/(appointments|customers|INSERT|DELETE|ALTER|DROP)/i.test(s)));
});

test('already matching password is a true no-op with transaction ROLLBACK', async () => {
    const deps = mock({ matched: true });
    assert.equal(await repairDevStylist(env, deps), 'ALREADY_MATCH');
    assert.ok(!deps.mutated);
    assert.equal(statementsOf(deps).at(-1), 'ROLLBACK');
    assert.ok(!statementsOf(deps).some(s => s.startsWith('UPDATE')));
});

for (const [title, options, error] of [
    ['wrong database', { wrongDb: true }, /DEV_DATABASE_IDENTITY_REJECTED/],
    ['wrong fixture role', { rows: [{ ...fixture, isSystemAdmin: true }] }, /SYNTHETIC_FIXTURE_INVALID/],
    ['multiple fixtures', { rows: [fixture, fixture] }, /SYNTHETIC_FIXTURE_NOT_UNIQUE/],
    ['zero update rows', { updateCount: 0 }, /SYNTHETIC_STYLIST_UPDATE_REJECTED/],
    ['hash verification failure', { hashVerified: false }, /GENERATED_HASH_NOT_VERIFIED/],
    ['unrevoked sessions remain', { activeTokens: 1 }, /REFRESH_TOKEN_REVOCATION_FAILED/],
    ['SQL statement error', { failAt: 'UPDATE refresh_tokens' }, /fake failure/],
]) {
    test(title + ' -> rollback and close, never COMMIT', async () => {
        const deps = mock(options);
        await assert.rejects(() => repairDevStylist(env, deps), error);
        const sql = statementsOf(deps);
        assert.ok(sql.includes('ROLLBACK'));
        assert.ok(!sql.includes('COMMIT'));
        assert.equal(deps.statements.at(-1), 'end');
    });
}
