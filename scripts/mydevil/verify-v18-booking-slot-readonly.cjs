'use strict';

/**
 * Hosted V18 DEV UAT. No appointment, staff, service or database writes.
 * Uses private synthetic DEV logins already held by the MyDevil operator;
 * GitHub logs receive only status counters and never secrets or PII.
 * Logging in produces the normal authentication audit record.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Client } = require('pg');
require('dotenv').config({path: path.join(process.cwd(), '.env'), quiet: true});

function assert(ok, code) {
    if (!ok) throw new Error('UAT_' + code);
}

function pgConfig() {
    const url = process.env.DATABASE_URL;
    const name = url ? new URL(url).pathname.slice(1) :
        process.env.DB_NAME || process.env.PGDATABASE;
    assert(name === 'p11522_salonbw_d', 'WRONG_DATABASE');
    return url ? {connectionString: url} : {
        host: process.env.DB_HOST || process.env.PGHOST,
        port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
        user: process.env.DB_USER || process.env.PGUSER,
        password: process.env.DB_PASS || process.env.PGPASSWORD,
        database: name,
    };
}

function loadPersonas() {
    const file = path.join(os.homedir(), '.deployment-private',
        'v18-personas', 'DEV-V18-LOGIN.txt');
    assert(fs.statSync(file).mode & 0o077 ? false : true, 'CREDENTIAL_PERMISSIONS');
    const entries = new Map();
    let login = null;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        if (line.startsWith('Login: ')) login = line.slice(7).trim();
        if (line.startsWith('Password: ') && login) {
            entries.set(login, line.slice(10));
            login = null;
        }
    }
    assert(entries.has('v18.owner@dev.salon-bw.pl'), 'OWNER_CREDENTIAL');
    assert(entries.has('v18.system-admin@dev.salon-bw.pl'), 'ADMIN_CREDENTIAL');
    return entries;
}

async function request(endpoint, opts = {}) {
    const response = await fetch('https://dev-api.salon-bw.pl' + endpoint, {
        ...opts,
        redirect: 'error',
        signal: AbortSignal.timeout(20000),
    });
    assert(response.ok, 'HTTP_' + response.status);
    return { data: await response.json(), cookies: response.headers.getSetCookie?.() ?? [] };
}

async function main() {
    assert(process.env.APP_ENV === 'development', 'WRONG_ENV');
    assert(process.cwd().includes('api_salonbw_dev'), 'WRONG_PATH');
    assert(process.env.DEV_ACCESS_USER && process.env.DEV_ACCESS_PASSWORD, 'NO_GATEWAY');
    const gw = 'Basic ' + Buffer.from(
        process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    const credentials = loadPersonas();
    const profiles = new Map();
    const headersByRole = new Map();

    for (const [role, email] of [
        ['owner', 'v18.owner@dev.salon-bw.pl'],
        ['admin', 'v18.system-admin@dev.salon-bw.pl'],
    ]) {
        const login = await request('/auth/login', {
            method: 'POST',
            headers: {Authorization: gw, 'Content-Type': 'application/json'},
            body: JSON.stringify({email, password: credentials.get(email)}),
        });
        assert(typeof login.data?.access_token === 'string', 'LOGIN_' + role);
        const cookies = login.cookies.map(v => v.split(';')[0]).filter(Boolean);
        assert(cookies.length > 0, 'SESSION_COOKIE_' + role);
        const headers = { Authorization: gw, Cookie: cookies.join('; ') };
        const profile = (await request('/users/profile', {headers})).data;
        assert(profile.role === 'admin' && Number.isSafeInteger(profile.id), 'PROFILE_' + role);
        assert(profile.isSystemAdmin === (role === 'admin'), 'TECHNICAL_FLAG_' + role);
        headersByRole.set(role, headers);
        profiles.set(role, profile);
    }

    const listed = (await request('/calendar/performers', {
        headers: headersByRole.get('admin'),
    })).data;
    assert(Array.isArray(listed), 'ROSTER_SHAPE');
    const ownerId = profiles.get('owner').id;
    const techId = profiles.get('admin').id;
    assert(listed.length === 1 && listed[0].id === ownerId, 'ROSTER_NOT_SINGLE_OWNER');
    assert(!listed.some(v => v.id === techId), 'TECH_ADMIN_EXPOSED_AS_PROVIDER');

    const client = new Client(pgConfig());
    await client.connect();
    let activeServiceId = null;
    let emptyServiceId = null;
    try {
        await client.query('BEGIN TRANSACTION READ ONLY');
        const assigned = await client.query(
            'SELECT es."serviceId" AS id FROM employee_services es ' +
            'JOIN services s ON s.id=es."serviceId" ' +
            'WHERE es."employeeId"=$1 AND es."isActive"=true ' +
            'AND s."isActive"=true AND s."onlineBooking"=true ' +
            'ORDER BY s.id LIMIT 1',
            [ownerId],
        );
        assert(assigned.rowCount === 1, 'OWNER_SERVICE_MISSING');
        activeServiceId = assigned.rows[0].id;

        const unassigned = await client.query(
            'SELECT s.id AS id FROM services s WHERE s."isActive"=true ' +
            'AND NOT EXISTS(SELECT 1 FROM employee_services es ' +
            'WHERE es."serviceId"=s.id AND es."isActive"=true) ORDER BY s.id LIMIT 1',
        );
        emptyServiceId = unassigned.rows[0]?.id ?? null;
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }

    const queryDate = '2026-11-17';
    const slots = (await request(
        '/calendar/available-slots?serviceId=' + encodeURIComponent(activeServiceId) +
            '&date=' + queryDate,
        {headers: headersByRole.get('owner')},
    )).data;
    assert(Array.isArray(slots), 'BOOKABLE_SLOTS_SHAPE');
    assert(slots.every(slot => slot.employeeId === ownerId), 'SYNTHETIC_PROVIDER_IN_SLOTS');

    if (emptyServiceId !== null) {
        const empty = (await request(
            '/calendar/available-slots?serviceId=' + encodeURIComponent(emptyServiceId) +
                '&date=' + queryDate,
            {headers: headersByRole.get('owner')},
        )).data;
        assert(Array.isArray(empty) && empty.length === 0, 'UNASSIGNED_SERVICE_HAS_SLOTS');
    }

    const calendar = (await request('/calendar/events?date=' + queryDate + '&view=day', {
        headers: headersByRole.get('owner'),
    })).data;
    assert(Array.isArray(calendar.employees), 'CALENDAR_RESPONSE');
    assert(calendar.employees.length === 1 &&
        calendar.employees[0].id === ownerId, 'CALENDAR_ROSTER');

    console.log(JSON.stringify({
        status: 'HOSTED_V18_BOOKING_UAT_PASS',
        syntheticPersonas: 2,
        ownerInCalendar: true,
        technicalAdminHidden: true,
        slotServiceLookup: 'PASS',
        activeServiceSlots: slots.length,
        noUnassignedServiceSlots: emptyServiceId === null ? 'NOT_APPLICABLE' : 'PASS',
        liveAppointmentsModified: false,
        rawCredentialsLogged: false,
    }));
}
main().catch((err) => {
    const reason = err instanceof Error ? err.message : 'UNKNOWN';
    console.error(/^UAT_[A-Z0-9_]+$/.test(reason) ? reason : 'UAT_UNEXPECTED');
    process.exitCode = 1;
});
