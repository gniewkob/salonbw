'use strict';

/**
 * Private DEV-only smoke test: authenticates synthetic owner and system admin
 * against live DEV API and verifies server-enforced role access.
 * Credentials are read only on the MyDevil host and never sent to CI logs.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const bcrypt = require('bcrypt');
const { Client } = require('pg');
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

async function assertCredentialsMatchDatabase(credentials) {
    const dbName = process.env.DB_NAME || process.env.PGDATABASE ||
        (process.env.DATABASE_URL
            ? new URL(process.env.DATABASE_URL).pathname.slice(1)
            : '');
    if (dbName !== 'p11522_salonbw_d') {
        throw new Error('database:identity-mismatch');
    }
    const client = new Client(process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
              host: process.env.DB_HOST || process.env.PGHOST,
              port: Number(process.env.DB_PORT || 5432),
              user: process.env.DB_USER || process.env.PGUSER,
              password: process.env.DB_PASS || process.env.PGPASSWORD,
              database: dbName,
          });
    await client.connect();
    try {
        await client.query('BEGIN TRANSACTION READ ONLY');
        for (const credential of credentials) {
            const result = await client.query(
                'SELECT "password" FROM "users" WHERE "email"=$1',
                [credential.email],
            );
            if (result.rowCount !== 1 ||
                !(await bcrypt.compare(credential.password, result.rows[0].password))) {
                throw new Error('database:credential-mismatch');
            }
        }
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
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
            const basicGate = Boolean(response.headers.get('www-authenticate'));
            let messageCode = 'OTHER';
            if (response.status === 401) {
                const responseText = (await response.text()).slice(0, 500);
                if (/invalid credentials/i.test(responseText)) messageCode = 'INVALID';
                else if (/captcha/i.test(responseText)) messageCode = 'CAPTCHA';
                else if (/locked/i.test(responseText)) messageCode = 'LOCKED';
            }
            throw new Error(
                stage + ':HTTP_' + response.status +
                (basicGate ? '_BASIC' : '') +
                '_' + messageCode,
            );
        }
        const data = await response.json();
        const cookieHeaders = response.headers.getSetCookie?.() ?? [];
        return {
            data,
            cookies: cookieHeaders
                .map((entry) => entry.split(';')[0])
                .filter((value) => value.includes('=')),
        };
    } finally {
        clearTimeout(timeout);
    }
}

async function main() {
    const credentials = await getPrivateCredentials();
    await assertCredentialsMatchDatabase(credentials);
    const devGatewayUser = process.env.DEV_ACCESS_USER;
    const devGatewayPassword = process.env.DEV_ACCESS_PASSWORD;
    if (!devGatewayUser || !devGatewayPassword) {
        throw new Error('gateway:credentials-missing');
    }
    const gatewayHeader =
        'Basic ' +
        Buffer.from(devGatewayUser + ':' + devGatewayPassword).toString('base64');
    const results = [];
    for (const credential of credentials) {
        const session = await readJson(BASE_URL + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: gatewayHeader,
            },
            body: JSON.stringify(credential),
        }, 'login');
        if (
            typeof session.data?.access_token !== 'string' ||
            !session.data.access_token ||
            session.cookies.length === 0
        ) {
            throw new Error('login:cookie-missing');
        }

        // The DEV gateway requires HTTP Basic Authorization. The application
        // authenticates independently using its HttpOnly access-token cookie.
        const headers = {
            Authorization: gatewayHeader,
            Cookie: session.cookies.join('; '),
        };
        const profile = (
            await readJson(BASE_URL + '/users/profile', { headers }, 'profile')
        ).data;
        const calendar = (
            await readJson(
                BASE_URL + '/calendar/events?date=2026-11-12&view=day',
                { headers },
                'calendar',
            )
        ).data;
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
            (/^(login|profile|calendar|staff):HTTP_[0-9]{3}(?:_BASIC)?_(?:OTHER|INVALID|CAPTCHA|LOCKED)$/.test(safeMessage) ||
            /(?:^database:(?:identity|credential)-mismatch$|^gateway:credentials-missing$|^login:cookie-missing$)/.test(safeMessage)
                ? safeMessage
                : 'unexpected'),
    );
    process.exitCode = 1;
});
