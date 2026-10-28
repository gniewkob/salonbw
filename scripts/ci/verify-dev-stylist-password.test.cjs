'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    validateEnvironment,
    validateSyntheticFixture,
    verifyCredential,
} = require('./verify-dev-stylist-password.cjs');

const env = Object.freeze({
    DEV_DB_NAME: 'p11522_salonbw_d',
    DEV_DB_USER: 'p11522_salonbw_d',
    DEV_DB_HOST: 'pgsql0.mydevil.net',
    DEV_DB_PORT: '5432',
    MYDEVIL_DEV_DB_PASSWORD: 'local-fixture-db-secret',
    E2E_ADMIN_EMAIL: 'stylist@salonbw.example.test',
    E2E_ADMIN_PASSWORD: 'local-fixture-stylist-secret',
});

function fakeDependencies({ match = true, rows, db = env.DEV_DB_NAME } = {}) {
    const operations = [];
    const record = {
        password: '$2b$12$' + 'A'.repeat(53),
        role: 'admin',
        isSystemAdmin: false,
    };
    class Client {
        constructor(config) {
            assert.equal(config.host, '127.0.0.1');
            assert.equal(config.port, 8543);
        }
        async connect() {
            operations.push('connect');
        }
        async query(sql, params) {
            operations.push(sql);
            if (sql.startsWith('SELECT current_database()')) {
                return { rows: [{ db_name: db, db_user: db }] };
            }
            if (sql.startsWith('SELECT password')) {
                assert.deepEqual(params, ['stylist@salonbw.example.test']);
                return { rows: rows ?? [record] };
            }
            return { rows: [] };
        }
        async end() {
            operations.push('end');
        }
    }
    const bcrypt = {
        compare: async (password, hash) => {
            assert.equal(password, env.E2E_ADMIN_PASSWORD);
            assert.equal(hash, record.password);
            operations.push('bcrypt-compare');
            return match;
        },
    };
    return { operations, Client, bcrypt };
}

test('accepts only the isolated DEV DB via loopback and requires synthetic account secret', () => {
    const connection = validateEnvironment(env);
    assert.equal(connection.database, env.DEV_DB_NAME);
    assert.equal(connection.host, '127.0.0.1');
    assert.throws(
        () => validateEnvironment({ ...env, DEV_DB_NAME: 'salonbw_prod' }),
        /UNSAFE_DEV_DATABASE_TARGET/,
    );
    assert.throws(
        () => validateEnvironment({ ...env, DEV_DB_HOST: 'other.example' }),
        /UNSAFE_DEV_DATABASE_TARGET/,
    );
    assert.throws(
        () => validateEnvironment({ ...env, E2E_ADMIN_EMAIL: 'admin@salonbw.example.test' }),
        /MISSING_DEV_CREDENTIAL/,
    );
    assert.throws(
        () => validateEnvironment({ ...env, E2E_ADMIN_PASSWORD: '' }),
        /MISSING_DEV_CREDENTIAL/,
    );
});

test('rejects missing, duplicate, system-admin or malformed synthetic stylist', () => {
    const valid = { password: '$2b$12$' + 'A'.repeat(53), role: 'admin', isSystemAdmin: false };
    assert.equal(validateSyntheticFixture([valid]), valid.password);
    for (const rows of [
        [],
        [valid, valid],
        [{ ...valid, isSystemAdmin: true }],
        [{ ...valid, role: 'client' }],
        [{ ...valid, password: 'not a bcrypt hash' }],
    ]) {
        assert.throws(() => validateSyntheticFixture(rows));
    }
});

test('MATCH and MISMATCH are computed inside a read-only transaction', async () => {
    for (const [match, expected] of [[true, 'MATCH'], [false, 'MISMATCH']]) {
        const deps = fakeDependencies({ match });
        const result = await verifyCredential(env, deps);
        assert.equal(result, expected);
        assert.deepEqual(
            deps.operations.filter((item) =>
                typeof item === 'string' &&
                /^(BEGIN|SELECT|SET|ROLLBACK)/.test(item),
            ),
            [
                'BEGIN TRANSACTION READ ONLY',
                "SET LOCAL statement_timeout = '10s'",
                'SELECT current_database() AS db_name, current_user AS db_user',
                'SELECT password, role, "isSystemAdmin" FROM users WHERE email = $1 LIMIT 2',
                'ROLLBACK',
            ],
        );
        assert.equal(deps.operations.at(-1), 'end');
    }
});

test('wrong DB identity refuses comparison, rolls back and closes', async () => {
    const deps = fakeDependencies({ db: 'production_database' });
    await assert.rejects(() => verifyCredential(env, deps), /DATABASE_IDENTITY_MISMATCH/);
    assert.ok(deps.operations.includes('ROLLBACK'));
    assert.equal(deps.operations.at(-1), 'end');
    assert.ok(!deps.operations.includes('bcrypt-compare'));
});
