import { writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';

/**
 * P0 full-stack UAT: real Chromium -> real Next API proxy -> real NestJS
 * -> disposable PostgreSQL. No intercepted /api responses or hosted domains.
 */
const origin = 'http://127.0.0.1:3100';
const receipt = '/tmp/salonbw-owner-real-stack-receipt.json';
const ownerEmail = 'owner-browser-uat@example.invalid';
const clientEmail = 'client-browser-uat@example.invalid';
const password = 'SyntheticLocalOnly2026!';

if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.CI !== 'true' ||
    process.env.QA_OWNER_E2E_MODE !== '1' ||
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.API_PROXY_URL !== 'http://127.0.0.1:3200' ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_' ||
    process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
    process.env.SMSAPI_ENABLED !== 'false'
) {
    throw new Error('OWNER_BROWSER_STACK_BLOCKED: isolated localhost CI only');
}

test.use({
    baseURL: origin,
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
});

function dateInWarsaw(date: Date): string {
    const items = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const get = (part: 'year' | 'month' | 'day') =>
        items.find((item) => item.type === part)?.value;
    return [get('year'), get('month'), get('day')].join('-');
}

function isLocal(url: string): boolean {
    try {
        return new URL(url).origin === origin;
    } catch {
        return false;
    }
}

function restrictBrowserNetwork(page: Page, writes: string[]): Promise<void> {
    return page.route('**/*', async (route) => {
        const req = route.request();
        const url = req.url();
        const path = new URL(url).pathname;
        const method = req.method();
        if (!isLocal(url)) {
            await route.abort('blockedbyclient');
            return;
        }
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            const safe =
                (method === 'POST' && path === '/api/auth/login') ||
                (method === 'POST' && path === '/api/appointments') ||
                (method === 'PATCH' && /^\/api\/appointments\/\d+\/(reschedule|cancel)$/.test(path));
            writes.push(method + ' ' + path);
            if (!safe) {
                await route.abort('blockedbyclient');
                throw new Error('Unexpected browser write: ' + method + ' ' + path);
            }
        }
        await route.continue();
    });
}

async function signIn(page: Page, email: string): Promise<void> {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Hasło').fill(password);
    await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/);
}

async function csrf(page: Page): Promise<string> {
    const cookie = (await page.context().cookies(origin)).find(
        (item) => item.name === 'dev_XSRF-TOKEN',
    );
    expect(cookie?.value).toBeTruthy();
    return cookie!.value;
}

async function assertClientCannotForceOverlap(
    browser: Browser,
    requestBody: Record<string, unknown>,
): Promise<void> {
    const context = await browser.newContext({
        baseURL: origin,
        httpCredentials: {
            username: 'studio-fixture',
            password: 'studio-fixture-password',
        },
    });
    try {
        const page = await context.newPage();
        await signIn(page, clientEmail);
        const denied = await page.request.post('/api/appointments', {
            headers: { 'X-XSRF-TOKEN': await csrf(page) },
            data: {
                employeeId: requestBody.employeeId,
                serviceId: requestBody.serviceId,
                startTime: requestBody.startTime,
                forceOverlap: true,
            },
        });
        expect(denied.status()).toBe(403);
    } finally {
        await context.close();
    }
}

test('P0 browser -> Next -> Nest -> PostgreSQL: owner creates, reschedules and cancels', async ({
    page,
    browser,
}) => {
    const writes: string[] = [];
    await restrictBrowserNetwork(page, writes);
    await signIn(page, ownerEmail);

    const targetDate = dateInWarsaw(new Date(Date.now() + 28 * 86_400_000));
    await page.goto('/studio-v18/calendar');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    const employees = await page.request.get(
        '/api/calendar/events?view=day&date=' + targetDate,
    );
    expect(employees.status()).toBe(200);
    const calendar = (await employees.json()) as {
        employees?: Array<{ name: string }>;
    };
    expect(calendar.employees?.map((item) => item.name)).toContain('Aleksandra');
    expect(calendar.employees?.map((item) => item.name)).not.toContain(
        'Administrator techniczny',
    );

    const staffResponse = await page.request.get('/api/employees');
    expect(staffResponse.status()).toBe(200);
    const staff = (await staffResponse.json()) as Array<{
        id: number;
        name: string;
        role: string;
        isSystemAdmin?: boolean;
    }>;
    console.log('OWNER_STAFF_ENDPOINT=', JSON.stringify(
        staff.map(({ id, name, role, isSystemAdmin }) => ({
            id, name, role, isSystemAdmin,
        })),
    ));
    expect(staff).toHaveLength(1);
    expect(staff[0]?.name).toBe('Aleksandra');

    await page.getByLabel('Przejdź do daty').fill(targetDate);
    await page.getByRole('button', { name: 'Nowa wizyta' }).click();

    const create = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(create).toBeVisible();
    console.log(
        'OWNER_STAFF_COMBOBOX=',
        await create.getByRole('combobox', { name: 'Pracownik' }).innerText(),
    );
    await expect(create.getByText('Aleksandra')).toBeVisible();
    await create.locator('#appointment-service').click();
    await create.getByRole('option', { name: /Strzyżenie testowe/ }).click();
    await create.getByRole('combobox', { name: 'Szukaj klienta' }).fill('Klient');
    await create.getByRole('option', { name: /Klient Syntetyczny/ }).click();
    await expect(create.getByTestId('v18-selected-customer')).toBeVisible();

    const creating = page.waitForResponse(
        (response) =>
            isLocal(response.url()) &&
            new URL(response.url()).pathname === '/api/appointments' &&
            response.request().method() === 'POST',
    );
    await create.getByRole('button', { name: 'Utwórz wizytę' }).click();
    const createdResponse = await creating;
    expect(createdResponse.status()).toBe(201);
    // POST /appointments contract intentionally returns only {id};
    // verify the start time through a separate authenticated database read.
    const created = (await createdResponse.json()) as { id: number };
    expect(created.id).toBeGreaterThan(0);
    const creationBody = createdResponse.request().postDataJSON() as Record<
        string,
        unknown
    >;
    const createdStart = String(creationBody.startTime ?? '');
    expect(Date.parse(createdStart)).not.toBeNaN();
    expect(creationBody).not.toHaveProperty('forceOverlap');

    const persistedResponse = await page.request.get(
        '/api/appointments/' + created.id,
    );
    expect(persistedResponse.status()).toBe(200);
    const persistedCreated = (await persistedResponse.json()) as {
        startTime: string;
    };
    expect(new Date(persistedCreated.startTime).getTime()).toBe(
        new Date(createdStart).getTime(),
    );
    await expect(create).toBeHidden();

    const duplicate = await page.request.post('/api/appointments', {
        headers: { 'X-XSRF-TOKEN': await csrf(page) },
        data: creationBody,
    });
    expect(duplicate.status()).toBe(409);
    await assertClientCannotForceOverlap(browser, creationBody);

    await page.getByRole('button', { name: 'Tydzień', exact: true }).click();
    await expect
        .poll(() => new URL(page.url()).searchParams.get('date'))
        .toBe(targetDate);
    await expect
        .poll(() => new URL(page.url()).searchParams.get('view'))
        .toBe('week');
    const agenda = page.getByTestId('v18-mobile-week-agenda');
    await expect(agenda).toContainText('Klient Syntetyczny');
    await agenda.getByRole('link', {
        name: 'Otwórz kartę klienta Klient Syntetyczny',
    }).click();
    await expect(page).toHaveURL(/\/studio-v18\/customers\/\d+$/);
    await page.goBack();
    await expect(page).toHaveURL(/\\/studio-v18\\/calendar\\?/);
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    // Returning from the customer card must restore the selected date/week
    // without manual re-selection; both dimensions are URL-backed.
    await expect(page.getByLabel('Przejdź do daty')).toHaveValue(targetDate);
    await expect(
        page.getByRole('button', { name: 'Tydzień', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(agenda).toContainText('Klient Syntetyczny');

    await agenda.getByRole('button', { name: /Otwórz wizytę/ }).click();
    const quick = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await quick.getByRole('button', { name: 'Otwórz szczegóły' }).click();
    const edit = page.getByRole('dialog', { name: 'Appointment' });
    await expect(edit).toBeVisible();
    await edit.getByLabel('Start wizyty').fill(targetDate + 'T15:30');

    const rescheduling = page.waitForResponse(
        (response) =>
            isLocal(response.url()) &&
            new URL(response.url()).pathname ===
                '/api/appointments/' + created.id + '/reschedule' &&
            response.request().method() === 'PATCH',
    );
    await edit.getByRole('button', { name: 'Zapisz zmiany' }).click();
    const movedResponse = await rescheduling;
    expect(movedResponse.status()).toBe(200);
    const moved = (await movedResponse.json()) as {
        status: string;
        startTime: string;
    };
    expect(moved.status).toBe('rescheduled_pending');
    expect(Date.parse(moved.startTime)).not.toBeNaN();
    expect(new Date(moved.startTime).getTime()).not.toBe(
        new Date(createdStart).getTime(),
    );
    await expect(edit).toBeHidden();

    await expect(agenda).toContainText('Zmiana do potwierdzenia');
    await agenda.getByRole('button', { name: /Otwórz wizytę/ }).click();
    const nextQuick = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await nextQuick.getByRole('button', { name: 'Anuluj wizytę' }).click();
    const confirmation = page.getByRole('dialog', {
        name: 'Anulować wizytę?',
    });
    await expect(confirmation.getByRole('button', {
        name: 'Anuluj',
        exact: true,
    })).toBeFocused();

    const cancelling = page.waitForResponse(
        (response) =>
            isLocal(response.url()) &&
            new URL(response.url()).pathname ===
                '/api/appointments/' + created.id + '/cancel' &&
            response.request().method() === 'PATCH',
    );
    await confirmation.getByRole('button', { name: 'Anuluj wizytę' }).click();
    const cancelledResponse = await cancelling;
    expect(cancelledResponse.status()).toBe(200);

    expect(writes).toEqual([
        'POST /api/auth/login',
        'POST /api/appointments',
        'PATCH /api/appointments/' + created.id + '/reschedule',
        'PATCH /api/appointments/' + created.id + '/cancel',
    ]);

    writeFileSync(
        receipt,
        JSON.stringify({
            appointmentId: created.id,
            createdStart,
            rescheduledStart: moved.startTime,
        }),
        { mode: 0o600 },
    );
    console.log('OWNER_BROWSER_REAL_API=PASS');
    console.log('OWNER_BROWSER_ROLE_403_CONFLICT_409=PASS');
    console.log('OWNER_BROWSER_UI_390=PASS');
});
