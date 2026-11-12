'use strict';

const fs = require('node:fs');

const REQUIRED_FREE_KIB = 4 * 1024 * 1024;
const SIZE = String.raw`(\d+(?:[.,]\d+)?)\s*([KMGT](?:i?B)?)?`;
const SIZE_PAIR = new RegExp(SIZE + String.raw`\s*(?:\/|\bz\b|\bof\b)\s*` + SIZE, 'i');
const DISK_LABEL = /(?:dysk|disk|storage|powierzchni|powierzchnia|przestrze[nń]|miejsce)/i;

function kib(value, unit) {
    const quantity = Number(value.replace(',', '.'));
    const type = unit.toUpperCase();
    const exp = { K: 1, M: 2, G: 3, T: 4 }[type[0]];
    if (!Number.isFinite(quantity) || quantity < 0 || !exp) {
        throw new Error('Invalid MyDevil quota quantity');
    }
    const base = type.includes('I') ? 1024 : 1000;
    return (quantity * (base ** exp)) / 1024;
}

function parseAccountFreeKiB(output) {
    const normalized = output.replace(/\u001b\[[0-9;]*m/g, '');
    const matching = normalized.split(/\r?\n/)
        .filter((line) => DISK_LABEL.test(line))
        .map((line) => line.match(SIZE_PAIR))
        .filter(Boolean);
    if (matching.length === 0) {
        throw new Error('MyDevil disk quota is not machine-readable');
    }
    const free = matching.map((m) => {
        const unit = m[2] || m[4];
        if (!unit) throw new Error('Unknown quota size units');
        const used = kib(m[1], m[2] || unit);
        const limit = kib(m[3], m[4] || unit);
        if (!Number.isFinite(limit) || limit <= 0 || used > limit) {
            throw new Error('Invalid MyDevil account quota values');
        }
        return Math.floor(limit - used);
    });
    return Math.min(...free);
}

function checkQuota(output, filesystemFreeKiB, thresholdKiB = REQUIRED_FREE_KIB) {
    const availableFilesystem = Number(filesystemFreeKiB);
    if (!Number.isSafeInteger(availableFilesystem) || availableFilesystem < 0) {
        throw new Error('Filesystem free space is not an integer KiB value');
    }
    const availableAccount = parseAccountFreeKiB(output);
    if (availableFilesystem < thresholdKiB || availableAccount < thresholdKiB) {
        throw new Error('Insufficient MyDevil disk space: account or filesystem below 4 GiB');
    }
    return { availableFilesystem, availableAccount };
}

if (require.main === module) {
    try {
        const data = fs.readFileSync(0, 'utf8');
        const checked = checkQuota(data, process.env.MYDEVIL_FILESYSTEM_FREE_KIB);
        process.stdout.write(String(checked.availableAccount) + '\n');
    } catch (error) {
        process.stderr.write('MyDevil DEV quota preflight BLOCKED: ' + error.message + '\n');
        process.exitCode = 1;
    }
}

module.exports = { checkQuota, parseAccountFreeKiB, REQUIRED_FREE_KIB };
