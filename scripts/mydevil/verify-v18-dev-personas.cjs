'use strict';

/**
 * Private DEV-only smoke test: authenticates synthetic owner and system admin
 * against live DEV API and verifies server-enforced role access.
 * Credentials are read only on the MyDevil host and never sent to CI logs.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
require('dotenv').config({ path: path.join(process.cwd(), '.env'), quiet: true });

const BASE_URL = 'https://dev-api.salon-bw.pl';
const FIXTURE_FILE = path.join(
    os.homedir(),
    '.deployment-private',
    'v18-personas',
    'DEV-V18-LOGIN.txt',
);

function fail() {
    throw new Error('DEV_PERSONAS_AUTH_SMOKE_BLOCKED');
}

async function getPrivateCredentials() {
    if (process.env.APP_ENV !== 'development' ||
        !process.cwd().includes('api_salonbw_dev')) fail();

    const input = fs.readFileSync(FIXTURE_FILE, 'utf8');
    const lines = input.split(/\r?\n/);
    const entries = [];
    let email = null;
    for (const line of lines) {
        if (line.startsWith('Login: ')) {
            email = line.slice('Login: '.length).trim();
        } else if (line.startsWith('Password: ') && email) {
            entries.push({ email, password: line.slice('Password: '.length) });
            email = null;
        }
    }
    if (
        entries.length !== 2 ||
        !entries.some((e) => e.email === 'v18.owner@dev.salon-bw.pl') ||
        !entries.some((e) => e.email === 'v18.system-admin@dev.salon-bw.pl')
    ) fail();
    return entries;
}

async function readJson(url, options, stage) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            redirect: 'error',
        });
        if (!response.ok) {
            throw new Error(stage + ':HTTP_' + response.status);
        }
        return response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function main() {
    const credentials = await getPrivateCredentials();
    const results = [];
    for (const credential of credentials) {
        const login = await readJson(BASE_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credential),
        }, 'login');
        if (typeof login.access_token !== 'string' || !login.access_token) fail();

        const headers = { Authorization: 'Bearer ' + login.access_token };
        const profile = await readJson(BASE_URL + '/users/profile', { headers }, 'profile');
        const calendar = await readJson(
            BASE_URL + '/calendar/events?date=2026-11-12&view=day',
            { headers },
            'calendar',
        );
        await readJson(BASE_URL + '/employees', { headers }, 'staff');
        if (
            !profile ||
            profile.role !== 'admin' ||
            !Array.isArray(calendar.employees)
        ) fail();

        const technical = credential.email === 'v18.system-admin@dev.salon-bw.pl';
        if (profile.isSystemAdmin !== technical) {
            throw new Error('profile:technical-flag-mismatch');
        }

        const inCalendar = calendar.employees.some(
            (employee) => employee.id === profile.id,
        );
        if (inCalendar === technical) {
            throw new Error('calendar:provider-scope-mismatch');
        }

        results.push({
            persona: technical ? 'system_admin' : 'owner_stylist',
            role: profile.role,
            technical,
            inCalendar,
            login: 'PASS',
            userProfile: 'PASS',
            staffListPermission: 'PASS',
            calendarPermission: 'PASS',
        });
    }

    console.log(JSON.stringify({
        status: 'DEV_PERSONAS_AUTH_SMOKE_PASS',
        productionTouched: false,
        passwordsLogged: false,
        results,
    }));
}

main().catch((error) => {
    const safeMessage = error instanceof Error ? error.message : 'unknown';
    // Only fixed stage names and HTTP statuses are emitted, never credentials.
    console.error(
        'DEV_PERSONAS_AUTH_SMOKE_FAILED: ' +
            (/^(login|profile|calendar|staff):(?:HTTP_[0-9]{3}|[a-z-]+)$/.test(safeMessage)
                ? safeMessage
                : 'unexpected'),
    );
    process.exitCode = 1;
});
