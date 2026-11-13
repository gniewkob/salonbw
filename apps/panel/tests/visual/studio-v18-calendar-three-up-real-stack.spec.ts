import { mkdirSync, readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Source-locked, localhost-only Studio V18 visual acceptance. Three real
 * appointment POSTs flow through Next.js -> NestJS -> disposable PostgreSQL.
 * The test never touches hosted DEV or production, nor external transports.
 */
const ORIGIN = 'http://127.0.0.1:3100';
const FIXTURE = '/tmp/salonbw-calendar-drag-fixture.json';

if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.CI !== 'true' ||
    process.env.QA_OWNER_E2E_MODE !== '1' ||
    process.env.API_PROXY_URL !== 'http://127.0.0.1:3200' ||
    process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
    process.env.SMSAPI_ENABLED !== 'false' ||
    process.env.EMAIL_ENABLED !== 'false' ||
    process.env.WHATSAPP_ENABLED !== 'false' ||
    process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
    process.env.PLAYWRIGHT_BASE_URL
) {
    throw new Error('V18_THREE_UP_BLOCKED: isolated CI runner only');
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
    trace: 'retain-on-failure',
});

function warsawDay(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const part = (kind: 'year' | 'month' | 'day') =>
        parts.find((value) => value.type === kind)?.value;
    return [part('year'), part('month'), part('day')].join('-');
}

type Seed = {
    ownerId: number;
    clientId: number;
    serviceId: number;
};

test('Studio V18 renders three parallel visits in distinct monochrome columns with vivid markers', async ({
    page,
}) => {
    await page.route('**/*', async (route) => {
        if (new URL(route.request().url()).origin !== ORIGIN) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });

    const seed = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Seed;
    expect(
        [seed.ownerId, seed.clientId, seed.serviceId].every(
            (id) => Number.isSafeInteger(id) && id > 0,
        ),
    ).toBe(true);

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('owner-browser-uat@example.invalid');
    await page.getByLabel('Hasło').fill('SyntheticLocalOnly2026!');
    await page
        .getByRole('button', { name: 'Zaloguj się', exact: true })
        .click();
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const csrfCookie = (await page.context().cookies(ORIGIN)).find(
        (cookie) => cookie.name === 'dev_XSRF-TOKEN',
    );
    expect(csrfCookie?.value).toBeTruthy();

    const date = new Date(Date.now() + 42 * 86_400_000);
    while ([0, 6].includes(date.getUTCDay())) {
        date.setUTCDate(date.getUTCDate() + 1);
    }
    const day = warsawDay(date);
    const start = new Date(day + 'T10:00:00Z');
    const starts = [
        start.toISOString(),
        start.toISOString(),
        new Date(start.getTime() + 15 * 60_000).toISOString(),
    ];
    const createdIds: number[] = [];

    try {
        for (const [index, startTime] of starts.entries()) {
            const response = await page.request.post('/api/appointments', {
                headers: { 'X-XSRF-TOKEN': csrfCookie!.value },
                data: {
                    employeeId: seed.ownerId,
                    clientId: seed.clientId,
                    serviceId: seed.serviceId,
                    startTime,
                    ...(index === 0 ? {} : { forceOverlap: true }),
                },
            });
            expect(response.status()).toBe(201);
            const appointment = (await response.json()) as { id: number };
            expect(Number.isSafeInteger(appointment.id)).toBe(true);
            createdIds.push(appointment.id);
        }

        await page.goto('/studio-v18/calendar?view=day&date=' + day);
        const root = page.getByTestId('v18-calendar-pilot');
        await expect(root).toBeVisible();
        const fontFamily = await root.evaluate(
            (element) => getComputedStyle(element).fontFamily,
        );
        expect(fontFamily).toContain('Inter');
        const background = await root.evaluate(
            (element) => getComputedStyle(element).backgroundColor,
        );
        expect(background).toBe('rgb(250, 250, 250)');
        await expect(page.getByRole('heading', { name: 'Zespół' })).toHaveCount(
            0,
        );

        const visits = page.locator('.fc-timegrid-event').filter({
            hasText: 'Klient Syntetyczny',
        });
        await expect(visits).toHaveCount(3);
        const bounds = await Promise.all(
            (await visits.all()).map((visit) => visit.boundingBox()),
        );
        expect(bounds.every((bound) => bound !== null)).toBe(true);
        const columns = bounds
            .filter(
                (bound): bound is NonNullable<typeof bound> => bound !== null,
            )
            .sort((a, b) => a.x - b.x);

        // TimeGrid must not render concurrent cards in the same horizontal
        // space: this reproduces the owner's "always in the middle" defect.
        for (let i = 1; i < columns.length; i += 1) {
            expect(columns[i - 1].x + columns[i - 1].width).toBeLessThanOrEqual(
                columns[i].x + 2,
            );
        }
        const cards = visits.locator('[data-appointment-status]');
        await expect(cards).toHaveCount(3);
        for (const card of await cards.all()) {
            const appearance = await card.evaluate((element) => {
                const styles = getComputedStyle(element);
                return {
                    background: styles.backgroundColor,
                    statusStripe: styles.borderLeftColor,
                };
            });
            expect(appearance.background).toBe('rgb(255, 255, 255)');
            expect(appearance.statusStripe).toBe('rgb(37, 99, 235)');
        }

        mkdirSync('test-results', { recursive: true });
        await page.screenshot({
            path: 'test-results/studio-v18-three-up-desktop.png',
            fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
        await page.screenshot({
            path: 'test-results/studio-v18-three-up-mobile-390.png',
            fullPage: true,
        });
        console.log('V18_THREE_UP_POSTGRES_BW_VIVID_LAYOUT=PASS');
    } finally {
        for (const id of createdIds) {
            const response = await page.request.patch(
                '/api/appointments/' + id + '/cancel',
                { headers: { 'X-XSRF-TOKEN': csrfCookie!.value } },
            );
            expect(response.status()).toBe(200);
        }
    }
});
