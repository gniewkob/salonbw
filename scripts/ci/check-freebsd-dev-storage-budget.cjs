'use strict';

// Conservative DEV capacity proxy while the MyDevil account-quota API is unavailable.
// This is not an authoritative billing/account-quota read. The nominal 50 GB
// allocation is owner-reported; reserve 8 GiB for provider-managed/unseen usage
// and require an additional 4 GiB of observable deployment headroom.
const NOMINAL_PLAN_BYTES = 50_000_000_000;
const KIB = 1024;
const UNOBSERVED_RESERVE_KIB = 8 * KIB * KIB;
const MIN_HEADROOM_KIB = 4 * KIB * KIB;
const NOMINAL_PLAN_KIB = Math.floor(NOMINAL_PLAN_BYTES / KIB);

function parseKib(value, label) {
    const input = String(value ?? '');
    if (!/^\d+$/.test(input)) {
        throw new Error(label + ' must be an integer number of KiB');
    }
    const parsed = Number(input);
    if (!Number.isSafeInteger(parsed) || parsed < 0) {
        throw new Error(label + ' is out of range');
    }
    return parsed;
}

function assessFreeBsdDevCapacity(homeUsedKib, filesystemFreeKib) {
    const homeUsed = parseKib(homeUsedKib, 'HOME usage');
    const filesystemFree = parseKib(filesystemFreeKib, 'Filesystem free');
    // The sum is intentionally strict and fails even when df reports huge
    // shared-filesystem capacity but HOME usage approaches the plan limit.
    const estimatedFreeKib = NOMINAL_PLAN_KIB - homeUsed - UNOBSERVED_RESERVE_KIB;
    if (estimatedFreeKib < MIN_HEADROOM_KIB || filesystemFree < MIN_HEADROOM_KIB) {
        throw new Error('DEV disk safety budget exceeded: manual cleanup or provider quota check required');
    }
    return {
        homeUsedKib: homeUsed,
        filesystemFreeKib: filesystemFree,
        estimatedFreeKib,
        accounting: 'CONSERVATIVE_ESTIMATE_NOT_PROVIDER_QUOTA',
    };
}

if (require.main === module) {
    try {
        const result = assessFreeBsdDevCapacity(
            process.env.FREEBSD_HOME_USED_KIB,
            process.env.FREEBSD_FILESYSTEM_FREE_KIB,
        );
        process.stdout.write(String(result.estimatedFreeKib) + '\n');
    } catch (error) {
        process.stderr.write('DEV_FREEBSD_STORAGE_PRECHECK_BLOCKED: ' + error.message + '\n');
        process.exitCode = 1;
    }
}

module.exports = {
    assessFreeBsdDevCapacity,
    NOMINAL_PLAN_KIB,
    MIN_HEADROOM_KIB,
    UNOBSERVED_RESERVE_KIB,
};
