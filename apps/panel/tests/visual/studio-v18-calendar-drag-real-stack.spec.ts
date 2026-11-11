import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Desktop-only DnD acceptance against a disposable full stack:
 * Chromium -> Next.js -> NestJS -> PostgreSQL. No mocked responses.
 * The fixture contains only generated test users/services.
 */
const ORIGIN = 'http://127.0.0.1:3100';
const FIXTURE = '/tmp/salonbw-calendar-drag-fixture.json';
const PASSWORD = 'SyntheticLocalOnly2026!';
if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.CI !== 'true' ||
    process.env.QA_OWNER_E2E_MODE !== '1' ||
    process.env.API_PROXY_URL !== 'http://127.0.0.1:3200' ||
    process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
    process.env.SMSAPI_ENABLED !== 'false' ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development'
) {
    throw new Error('V18_DRAG_STACK_BLOCKED: disposable localhost CI only');
}

test.use({
    baseURL: ORIGIN,
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
    viewport: { width: 1366, height: 900 },
    isMobile: false,
    hasTouch: false,
    screenshot: 'off',
    video: 'off',
    trace: 'off',
});

type Seed = { ownerId: number; clientId: number; serviceId: number };
function readSeed(): Seed {
    const value: unknown = JSON.parse(readFileSync(FIXTURE, 'utf8'));
    if (
        !value ||
        typeof value !== 'object' ||
        !('ownerId' in value) ||
        !('clientId' in value) ||
        !('serviceId' in value) ||
        ![value.ownerId, value.clientId, value.serviceId].every(
            (id) => Number.isSafeInteger(id) && Number(id) > 0,
        )
    ) {
        throw new Error('Invalid synthetic DnD fixture IDs');
    }
    return value as Seed;
}

function warsawDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const get = (type: 'year' | 'month' | 'day') =>
        parts.find((part) => part.type === type)?.value;
    return [get('year'), get('month'), get('day')].join('-');
}

test('V18 desktop drag changes a real appointment, retains duration and cannot bypass blocks', async ({
    page,
}) => {
    await page.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== ORIGIN) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('owner-browser-uat@example.invalid');
    await page.getByLabel('Hasło').fill(PASSWORD);
    await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const cookie = (await page.context().cookies(ORIGIN)).find(
        (item) => item.name === 'dev_XSRF-TOKEN',
    );
    expect(cookie?.value).toBeTruthy();

    const seed = readSeed();
    const day = new Date(Date.now() + 35 * 86_400_000);
    while ([0, 6].includes(day.getUTCDay())) {
        day.setUTCDate(day.getUTCDate() + 1);
    }
    const date = warsawDate(day);
    // UTC 10:00 = 11:00 or 12:00 in Europe/Warsaw; both are bookable
    // weekday slots in the synthetic fixture's 09:00–17:00 schedule.
    const startTime = new Date(date + 'T10:00:00Z').toISOString();
    const createdResponse = await page.request.post('/api/appointments', {
        headers: { 'X-XSRF-TOKEN': cookie!.value },
        data: {
            employeeId: seed.ownerId,
            clientId: seed.clientId,
            serviceId: seed.serviceId,
            startTime,
        },
    });
    expect(createdResponse.status()).toBe(201);
    const created = (await createdResponse.json()) as { id: number };
    expect(created.id).toBeGreaterThan(0);

    try {
        await page.goto('/studio-v18/calendar?view=day&date=' + date);
        await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Zespół' })).toHaveCount(0);
        await expect(page.getByText('Osoby w zespole')).toHaveCount(0);

        const event = page
            .locator('.fc-timegrid-event')
            .filter({ hasText: 'Klient Syntetyczny' })
            .first();
        await expect(event).toBeVisible();

        const before = await page.request.get('/api/appointments/' + created.id);
        expect(before.status()).toBe(200);
        const existing = (await before.json()) as {
            startTime: string;
            endTime: string;
        };
        const duration =
            new Date(existing.endTime).getTime() -
            new Date(existing.startTime).getTime();
        expect(duration).toBe(45 * 60 * 1000);

        const target = page
            .locator('.fc-timegrid-slot-lane[data-time="14:00:00"]')
            .first();
        await expect(target).toBeVisible();
        const movedRequest = page.waitForResponse(
            (response) =>
                new URL(response.url()).origin === ORIGIN &&
                /^\/api\/appointments\/\d+\/reschedule$/.test(
                    new URL(response.url()).pathname,
                ) &&
                response.request().method() === 'PATCH',
        );
        await event.dragTo(target, {
            targetPosition: { x: 30, y: 3 },
            timeout: 15_000,
        });
        const response = await movedRequest;
        expect(response.status()).toBe(200);
        const payload = response.request().postDataJSON() as Record<
            string,
            unknown
        >;
        expect(payload).not.toHaveProperty('force');
        expect(payload).not.toHaveProperty('forceOverlap');

        const afterResponse = await page.request.get(
            '/api/appointments/' + created.id,
        );
        expect(afterResponse.status()).toBe(200);
        const after = (await afterResponse.json()) as {
            startTime: string;
            endTime: string;
            status: string;
        };
        expect(new Date(after.startTime).getTime()).toBeGreaterThan(
            new Date(existing.startTime).getTime(),
        );
        expect(
            new Date(after.endTime).getTime() -
                new Date(after.startTime).getTime(),
        ).toBe(duration);
        expect(after.status).toBe('rescheduled_pending');
        console.log('V18_DESKTOP_DRAG_REAL_API_PG=PASS');
    } finally {
        const cancelled = await page.request.patch(
            '/api/appointments/' + created.id + '/cancel',
            { headers: { 'X-XSRF-TOKEN': cookie!.value } },
        );
        expect(cancelled.status()).toBe(200);
    }
});
