'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
    assessFreeBsdDevCapacity,
    NOMINAL_PLAN_KIB,
    MIN_HEADROOM_KIB,
    UNOBSERVED_RESERVE_KIB,
} = require('./check-freebsd-dev-storage-budget.cjs');

const fsFree = 896_954_001;

test('accepts a measured 31,521,497 KiB HOME with a reserve and free filesystem', () => {
    const result = assessFreeBsdDevCapacity('31521497', String(fsFree));
    assert.equal(result.accounting, 'CONSERVATIVE_ESTIMATE_NOT_PROVIDER_QUOTA');
    assert.ok(result.estimatedFreeKib >= MIN_HEADROOM_KIB);
});

test('rejects prior near-full HOME usage despite ample shared df', () => {
    assert.throws(
        () => assessFreeBsdDevCapacity('49133356', String(fsFree)),
        /safety budget exceeded/,
    );
});

test('rejects a full filesystem despite free estimated account budget', () => {
    assert.throws(
        () => assessFreeBsdDevCapacity('31521497', '250000'),
        /safety budget exceeded/,
    );
});

test('accepts exact conservative threshold and rejects one KiB beyond it', () => {
    const limit = NOMINAL_PLAN_KIB - UNOBSERVED_RESERVE_KIB - MIN_HEADROOM_KIB;
    assert.equal(
        assessFreeBsdDevCapacity(String(limit), String(MIN_HEADROOM_KIB)).estimatedFreeKib,
        MIN_HEADROOM_KIB,
    );
    assert.throws(
        () => assessFreeBsdDevCapacity(String(limit + 1), String(MIN_HEADROOM_KIB)),
        /safety budget exceeded/,
    );
});

test('rejects missing, negative, nonnumeric and unsafe integer input', () => {
    for (const bad of [undefined, '', '31G', '-1', 'NaN', '1.2', '9007199254740992']) {
        assert.throws(
            () => assessFreeBsdDevCapacity(bad, String(fsFree)),
            /integer|out of range/,
            String(bad),
        );
        assert.throws(
            () => assessFreeBsdDevCapacity('31521497', bad),
            /integer|out of range/,
            String(bad),
        );
    }
});
