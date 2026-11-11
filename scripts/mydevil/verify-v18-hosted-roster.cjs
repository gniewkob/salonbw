'use strict';

/** Read-only hosted DEV API acceptance test; credentials never leave MyDevil. */
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve('.env'), quiet: true });

function guard(condition, name) {
    if (!condition) throw new Error('HOSTED_ROSTER_' + name);
}

function loadLogins() {
    const content = fs.readFileSync(
        path.join(os.homedir(), '.deployment-private', 'v18-personas', 'DEV-V18-LOGIN.txt'),
        'utf8',
    );
    const accounts = [];
    let email;
    for (const line of content.split(/\r?\n/)) {
        if (line.startsWith('Login: ')) email = line.slice(7).trim();
        if (line.startsWith('Password: ') && email) {
            accounts.push({ email, password: line.slice(10) });
            email = undefined;
        }
    }
    guard(accounts.length === 2, 'CREDENTIAL_COUNT');
    return accounts;
}

async function request(pathname, init = {}) {
    const res = await fetch('https://dev-api.salon-bw.pl' + pathname, {
        redirect: 'error',
        signal: AbortSignal.timeout(18_000),
        ...init,
    });
    guard(res.ok, 'HTTP_' + res.status);
    return res;
}

async function main() {
    guard(
        process.env.APP_ENV === 'development' &&
            process.cwd().includes('/apps/nodejs/api_salonbw_dev'),
        'ENV',
    );
    const expected = process.env.EXPECTED_V18_SHA;
    guard(/^[a-f\d]{40}$/.test(expected || ''), 'EXPECTED_SHA');
    const basicUser = process.env.DEV_ACCESS_USER;
    const basicPassword = process.env.DEV_ACCESS_PASSWORD;
    guard(basicUser && basicPassword, 'GATEWAY_CONFIG');
    const gateway =
        'Basic ' + Buffer.from(basicUser + ':' + basicPassword).toString('base64');
    const health = await request('/healthz', {
        headers: { Authorization: gateway },
    });
    guard(health.headers.get('x-salonbw-release') === expected, 'API_RELEASE');

    const accounts = loadLogins();
    const results = [];
    for (const account of accounts) {
        const login = await request('/auth/login', {
            method: 'POST',
            headers: {
                Authorization: gateway,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(account),
        });
        const data = await login.json();
        guard(typeof data.access_token === 'string', 'TOKEN_MISSING');
        const cookies = login.headers
            .getSetCookie()
            .map((s) => s.split(';')[0])
            .filter((s) => s.includes('='));
        guard(cookies.length > 0, 'COOKIE_MISSING');
        const headers = {
            Authorization: gateway,
            Cookie: cookies.join('; '),
        };
        const me = await (await request('/users/profile', { headers })).json();
        const performers = await (
            await request('/calendar/performers', { headers })
        ).json();
        const calendar = await (
            await request('/calendar/events?date=2026-11-12&view=day', {
                headers,
            })
        ).json();
        await request('/employees', { headers });
        guard(me.role === 'admin', 'ROLE');
        guard(Array.isArray(performers), 'PERFORMERS_SCHEMA');
        guard(Array.isArray(calendar?.employees), 'CALENDAR_SCHEMA');
        guard(performers.length === 1, 'PERFORMER_COUNT');
        guard(calendar.employees.length === 1, 'CALENDAR_ROSTER_COUNT');
        const technical = account.email === 'v18.system-admin@dev.salon-bw.pl';
        guard(me.isSystemAdmin === technical, 'TECHNICAL_FLAG');
        const owner = accounts.find(
            (entry) => entry.email === 'v18.owner@dev.salon-bw.pl',
        );
        guard(Boolean(owner), 'OWNER_MISSING');
        if (!technical) {
            guard(performers[0].id === me.id, 'OWNER_PROVIDER');
            guard(calendar.employees[0].id === me.id, 'OWNER_CALENDAR');
        } else {
            guard(performers[0].id !== me.id, 'TECHNICAL_PROVIDER');
            guard(calendar.employees[0].id !== me.id, 'TECHNICAL_CALENDAR');
        }
        results.push({
            persona: technical ? 'technical_admin' : 'owner_stylist',
            fullAdminRole: true,
            technical,
            providerCount: performers.length,
            calendarProviders: calendar.employees.length,
            userProfile: 'PASS',
            employeeList: 'PASS',
        });
    }
    console.log(JSON.stringify({
        status: 'V18_HOSTED_API_ROSTER_PASS',
        expectedAPISha: expected,
        environment: 'development',
        testOnlyData: true,
        productionModified: false,
        secretsLogged: false,
        results,
    }));
}

main().catch((err) => {
    const detail = String(err?.message ?? '');
    // Errors are restricted to fixed machine states; never print credentials.
    console.error(
        /^HOSTED_ROSTER_[A-Z0-9_]+$/.test(detail) ? detail : 'HOSTED_ROSTER_UNEXPECTED',
    );
    process.exitCode = 1;
});
