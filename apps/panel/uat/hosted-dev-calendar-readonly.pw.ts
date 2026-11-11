/**
 * Hosted DEV calendar acceptance: authenticated read-only, pinned releases.
 *
 * No appointments, clients or time blocks may be modified. Never record
 * screenshots, traces, videos or API bodies containing customer information.
 */
import { expect, test, type Page } from '@playwright/test';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const PANEL_SHA = 'b009255c2efc45da8325343620e0fd9c7fe49f27';
const API_SHA = 'abc68723460dd1fa5ad21ce2554bd2a4f492c16f';
const STAFF_EMAIL = 'stylist@salonbw.example.test';
const DATE = '2026-11-11';

type CalendarApiData = {
    events: unknown[];
    employees: unknown[];
    dateRange: { start: string; end: string };
};

function ensureScope(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.GITHUB_REF !== 'refs/heads/qa/v18-postdeploy-calendar-readonly-20261111' ||
        process.env.PLAYWRIGHT_BASE_URL !== PANEL ||
        process.env.CALENDAR_DEV_READ_ONLY_ACK !== 'APPROVED_READ_ONLY' ||
        process.env.DEV_ACCESS_USER !== 'uat' ||
        !process.env.DEV_ACCESS_PASSWORD ||
        process.env.E2E_ADMIN_EMAIL !== STAFF_EMAIL ||
        !process.env.E2E_ADMIN_PASSWORD
    ) {
        throw new Error('CALENDAR_UAT_BLOCKED: wrong scope, origin or test identity');
    }
}

async function verifyRelease(page: Page) {
    const result = await page.request.get(PANEL + '/__release.json', {
        maxRedirects: 0,
        headers: { 'Cache-Control': 'no-cache' },
    });
    expect(result.status(), 'panel DEV release').toBe(200);
    const panel = (await result.json()) as { sha?: string; environment?: string };
    expect(panel.sha).toBe(PANEL_SHA);
    expect(panel.environment).toBe('development');

    const credentials = Buffer.from(
        process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    const resultApi = await page.request.get(API + '/healthz', {
        maxRedirects: 0,
        headers: {
            Authorization: 'Basic ' + credentials,
            'Cache-Control': 'no-cache',
        },
    });
    expect(resultApi.status(), 'API DEV health').toBe(200);
    expect(resultApi.headers()['x-salonbw-release']).toBe(API_SHA);
    const api = (await resultApi.json()) as {
        status?: string;
        services?: { database?: { status?: string } };
    };
    expect(api.status).toBe('ok');
    expect(api.services?.database?.status).toBe('ok');
}

function validateRange(data: CalendarApiData, view: 'day' | 'week' | 'month') {
    expect(Array.isArray(data.events)).toBe(true);
    expect(Array.isArray(data.employees)).toBe(true);
    const start = Date.parse(data.dateRange?.start);
    const end = Date.parse(data.dateRange?.end);
    expect(Number.isFinite(start) && Number.isFinite(end) && end > start).toBe(true);
    const days = (end - start) / 86_400_000;
    // The response uses ISO/UTC Date serializations; DST may change by 1 hour.
    if (view === 'day') expect(days).toBeGreaterThan(0.9);
    if (view === 'day') expect(days).toBeLessThan(1.1);
    if (view === 'week') expect(days).toBeGreaterThan(6.9);
    if (view === 'week') expect(days).toBeLessThan(7.1);
    // FullCalendar month includes spillover weeks.
    if (view === 'month') expect(days).toBeGreaterThan(27.9);
    if (view === 'month') expect(days).toBeLessThan(42.1);
}

test.describe('Hosted DEV calendar — actual API read-only acceptance', () => {
    test.describe.configure({ retries: 0 });
    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
            origin: PANEL,
        },
    });

    test('staff roles, period integrity, V18 responsive UI', async ({ page }) => {
        test.setTimeout(120_000);
        ensureScope();
        await verifyRelease(page);

        // All browser-origin mutations except the intentional login are denied.
        await page.route('**/*', async (route) => {
            const request = route.request();
            const method = request.method().toUpperCase();
            const url = new URL(request.url());
            if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                await route.continue();
                return;
            }
            if (
                method === 'POST' &&
                ((url.origin === PANEL && url.pathname === '/api/auth/login') ||
                    (url.origin === API && url.pathname === '/auth/login'))
            ) {
                await route.continue();
                return;
            }
            await route.abort('blockedbyclient');
        });

        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill(STAFF_EMAIL);
        await page.locator('input[name="password"]').fill(
            process.env.E2E_ADMIN_PASSWORD!,
        );
        await page.getByRole('button', { name: 'Zaloguj się' }).click();
        await expect
            .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
            .not.toBe('/auth/login');
        const user = await page.request.get(PANEL + '/api/users/profile', {
            maxRedirects: 0,
        });
        expect(user.status()).toBe(200);
        const identity = (await user.json()) as {
            email?: string;
            role?: string;
            isSystemAdmin?: boolean;
        };
        expect(identity.email).toBe(STAFF_EMAIL);
        expect(identity.role).toBe('admin');
        expect(identity.isSystemAdmin).toBe(false);

        for (const view of ['day', 'week', 'month'] as const) {
            const response = await page.request.get(
                PANEL + '/api/calendar/events?date=' + DATE +
                    '&view=' + (view === 'day' ? 'reception' : view),
                { maxRedirects: 0 },
            );
            expect(response.status(), 'calendar ' + view + ' range').toBe(200);
            validateRange((await response.json()) as CalendarApiData, view);
        }

        for (const width of [1366, 390]) {
            await page.setViewportSize({
                width,
                height: width === 390 ? 844 : 900,
            });
            await page.goto('/studio-v18/calendar');
            const pilot = page.getByTestId('v18-calendar-pilot');
            await expect(pilot).toBeVisible();
            await expect(
                pilot.getByRole('heading', { name: 'Kalendarz', exact: true }),
            ).toBeVisible();
            for (const [name, period] of [
                ['Tydzień', 'week'],
                ['Miesiąc', 'month'],
                ['Dzień', 'day'],
            ] as const) {
                // Arm the observer before clicking, to avoid missing the request.
                // Day was already fetched on mount and may be served from
                // React Query's 60-second cache; direct API was checked above.
                const query = period === 'day'
                    ? null
                    : page.waitForResponse((response) => {
                        const url = new URL(response.url());
                        return (
                            url.pathname === '/api/calendar/events' &&
                            url.searchParams.get('view') === period
                        );
                    }, { timeout: 12_000 });
                await page.getByRole('button', { name, exact: true }).click();
                await expect(
                    page.getByRole('button', { name, exact: true }),
                ).toHaveAttribute('aria-pressed', 'true');
                if (query) expect((await query).status()).toBe(200);
                await expect(pilot.getByRole('alert')).toHaveCount(0);
            }
            expect(
                await page.evaluate(
                    () =>
                        document.documentElement.scrollWidth <=
                        window.innerWidth + 1,
                ),
            ).toBe(true);
        }
        console.log('HOSTED_DEV_CALENDAR_READONLY=PASS (no appointment writes)');
    });
});
