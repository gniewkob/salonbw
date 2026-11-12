'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { checkQuota, parseAccountFreeKiB, REQUIRED_FREE_KIB } = require('./check-mydevil-dev-quota.cjs');

const fsFreeKiB = 15 * 1024 * 1024;

test('passes when account and filesystem each have >= 4 GiB free', () => {
    const result = checkQuota('Dysk: 42G / 50G\nRAM: 1G / 3G', fsFreeKiB);
    assert.ok(result.availableAccount > REQUIRED_FREE_KIB);
});

test('rejects account quota exhaustion even when df shows free space', () => {
    assert.throws(
        () => checkQuota('Dysk: 94,61% (47,3 GB / 50 GB)', fsFreeKiB),
        /Insufficient MyDevil disk space/,
    );
});

test('rejects too little filesystem space even when the account quota is healthy', () => {
    assert.throws(
        () => checkQuota('Storage: 20 GiB / 50 GiB', 1024),
        /Insufficient MyDevil disk space/,
    );
});

test('supports KiB, decimal GB, GiB and unit inherited from the limit', () => {
    assert.equal(parseAccountFreeKiB('Disk: 10 GiB / 20 GiB'), 10 * 1024 * 1024);
    assert.ok(parseAccountFreeKiB('Powierzchnia: 10 / 20 GB') > 9 * 1000 * 1000);
    assert.ok(parseAccountFreeKiB('Disk space: 1000 MiB / 20 GiB') > REQUIRED_FREE_KIB);
});

test('fails closed for missing, unrelated, malformed or unlimited output', () => {
    for (const output of [
        '',
        'RAM: 0.5 GB / 3 GB',
        'Dysk: 94.61%',
        'Disk: unlimited',
        'Dysk: 42 / 50',
        'Disk: 51 GB / 50 GB',
    ]) {
        assert.throws(() => checkQuota(output, fsFreeKiB), undefined, output);
    }
    assert.throws(() => checkQuota('Disk: 1 GB / 50 GB', 'NaN'));
});
