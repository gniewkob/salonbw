/**
 * Hosted DEV calendar acceptance: authenticated read-only, pinned releases.
 *
 * No appointments, clients or time blocks may be modified. Never record
 * screenshots, traces, videos or API bodies containing customer information.
 */
import { expect, test, type Page } from '@playwright/test';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const EXPECTED_PANEL_COMMIT = '727f0e861213842c6c1594d3843d923224141ba8';
const EXPECTED_API_COMMIT = 'fc1fbfec73170c09c09e9bc09db314126971a03e';
const STAFF_EMAIL = 'stylist@salonbw.example.test';
const DATE = '2026-11-09';

type CalendarApiData = {
    events: unknown[];
    employees: unknown[];
    dateRange: { start: string; end: string };
};

function ensureScope(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.GITHUB_REF !== 'refs/heads/qa/v18-owner-availability-20261110' ||
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
    expect(panel.sha).toBe(EXPECTED_PANEL_COMMIT);
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
    expect(resultApi.headers()['x-salonbw-release']).toBe(EXPECTED_API_COMMIT);
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
            id?: number;
            email?: string;
            role?: string;
            isSystemAdmin?: boolean;
        };
        expect(identity.email).toBe(STAFF_EMAIL);
        expect(identity.role).toBe('admin');
        expect(identity.isSystemAdmin).toBe(false);
        expect(Number.isInteger(identity.id)).toBe(true);

        // Read-only availability contract using real DEV catalog and owner.
        // A non-empty slot result is not required: actual appointments or
        // work schedules may legitimately occupy/close the chosen day.
        const catalogResponse = await page.request.get(
            PANEL + '/api/services/online-booking',
            { maxRedirects: 0 },
        );
        expect(catalogResponse.status()).toBe(200);
        const services = (await catalogResponse.json()) as Array<{
            id?: number;
        }>;
        expect(Array.isArray(services)).toBe(true);
        const firstService = services.find(
            (item) => Number.isInteger(item.id) && (item.id ?? 0) > 0,
        );
        if (firstService?.id) {
            const nextDate = new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'Europe/Warsaw',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date(Date.now() + 8 * 24 * 60 * 60_000));
            const url =
                PANEL +
                '/api/calendar/available-slots?serviceId=' +
                String(firstService.id) +
                '&date=' +
                nextDate;
            const available = await page.request.get(url, {
                maxRedirects: 0,
            });
            expect(available.status()).toBe(200);
            const slots = (await available.json()) as Array<{
                employeeId?: number;
                employeeName?: string;
                time?: string;
            }>;
            expect(Array.isArray(slots)).toBe(true);
            for (const slot of slots) {
                expect(Number.isInteger(slot.employeeId)).toBe(true);
                expect(Number.isFinite(Date.parse(slot.time ?? ''))).toBe(true);
            }
            console.log(
                'HOSTED_DEV_OWNER_AVAILABILITY_API=PASS (slots=' +
                    slots.length +
                    ', no mutations)',
            );
        } else {
            console.log(
                'HOSTED_DEV_OWNER_AVAILABILITY_API=BLOCKED_NO_ACTIVE_SERVICE',
            );
        }

        for (const view of ['day', 'week', 'month'] as const) {
            const response = await page.request.get(
                PANEL + '/api/calendar/events?date=' + DATE +
                    '&view=' + (view === 'day' ? 'reception' : view),
                { maxRedirects: 0 },
            );
            expect(response.status(), 'calendar ' + view + ' range').toBe(200);
            const calendar = (await response.json()) as CalendarApiData;
            validateRange(calendar, view);
            if (view === 'day') {
                const staffIds = calendar.employees.map((item) =>
                    typeof item === 'object' && item !== null
                        ? (item as { id?: number }).id
                        : undefined,
                );
                expect(staffIds).toContain(identity.id);
                console.log('HOSTED_DEV_SALON_OWNER_IN_STAFF=PASS');
            }
        }

        for (const width of [1366, 390, 375, 320]) {
            await page.setViewportSize({
                width,
                height: width <= 390 ? 844 : 900,
            });
            await page.goto('/studio-v18/calendar');
            const pilot = page.getByTestId('v18-calendar-pilot');
            await expect(pilot).toBeVisible();
            await expect(
                page.getByRole('heading', { name: 'Kalendarz' }),
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
                if (period === 'week') {
                    const agenda = page.getByTestId('v18-mobile-week-agenda');
                    if (width <= 760) {
                        await expect(agenda).toBeVisible();
                        await expect(agenda.locator('section[data-day]')).toHaveCount(7);
                        await expect(page.getByRole('link', {
                            name: 'Klienci', exact: true,
                        })).toBeVisible();
                        await expect(page.getByRole('link', {
                            name: 'Wizyty', exact: true,
                        })).toBeVisible();

                        // Check the actual rendered status palette, not the
                        // API payload. Never export screenshots/customer text.
                        const backgrounds = await agenda.locator(
                            '[data-testid="v18-mobile-agenda-event"]',
                        ).evaluateAll((items) => items.map(
                            (item) => getComputedStyle(item).backgroundColor,
                        ));
                        expect(
                            backgrounds.length,
                            'at least one hosted DEV appointment/block card must be visible',
                        ).toBeGreaterThan(0);
                        console.log('HOSTED_WEEK_EVENT_COUNT=' + backgrounds.length);
                        for (const color of backgrounds) {
                            const channels = (color.match(/[0-9]+/g) ?? [])
                                .slice(0, 3).map(Number);
                            expect(channels).toHaveLength(3);
                            expect(channels.every((channel) => channel >= 220))
                                .toBe(true);
                        }
                    } else {
                        await expect(agenda).toBeHidden();
                    }
                }
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
