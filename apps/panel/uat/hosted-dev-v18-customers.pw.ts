/**
 * Authenticated, read-only UAT of the REAL Customers V18 pilot on isolated DEV.
 * No mocks, screenshots, traces, customer exports, booking actions or customer writes.
 * The ONLY permitted state-changing request is the synthetic account login.
 */
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const TEST_BRANCH = 'refs/heads/test/wdi2-hosted-v18-customers-uat-20261105';
const TEST_EMAIL = 'stylist@salonbw.example.test';

type PanelRelease = { sha?: string; environment?: string };
type TestProfile = { email?: string; role?: string; isSystemAdmin?: boolean };
type CustomerQuery = {
    search: string | null;
    limit: string | null;
    sortBy: string | null;
    groupId: string | null;
};

function assertScope(): string {
    const sha = process.env.EXPECTED_PANEL_RELEASE_SHA ?? '';
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.GITHUB_REPOSITORY !== 'gniewkob/salonbw' ||
        process.env.GITHUB_REF !== TEST_BRANCH ||
        process.env.PLAYWRIGHT_BASE_URL !== PANEL ||
        process.env.DEV_ACCESS_USER !== 'uat' ||
        !process.env.DEV_ACCESS_PASSWORD ||
        process.env.E2E_ADMIN_EMAIL !== TEST_EMAIL ||
        !process.env.E2E_ADMIN_PASSWORD ||
        !/^[0-9a-f]{40}$/.test(sha)
    ) {
        throw new Error('V18_HOSTED_UAT_BLOCKED: unexpected environment or missing prerequisites');
    }
    return sha;
}

async function assertPanelRelease(page: Page, expectedSha: string): Promise<void> {
    const response = await page.request.get(PANEL + '/__release.json', {
        maxRedirects: 0,
        headers: { 'Cache-Control': 'no-store' },
    });
    expect(response.status(), 'DEV panel release endpoint').toBe(200);
    const release = (await response.json()) as PanelRelease;
    expect(release.environment, 'DEV panel environment').toBe('development');
    expect(release.sha, 'exact deployed DEV panel SHA').toBe(expectedSha);
}

async function assertDevApiHealth(page: Page): Promise<void> {
    // Forward gateway credentials only to the exact DEV API origin.
    const basic = Buffer.from(
        process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    const response = await page.request.get(API + '/healthz', {
        maxRedirects: 0,
        headers: {
            Authorization: 'Basic ' + basic,
            'Cache-Control': 'no-store',
        },
    });
    expect(response.status(), 'DEV API health').toBe(200);
    const health = (await response.json()) as {
        status?: string;
        services?: { database?: { status?: string } };
    };
    expect(health.status).toBe('ok');
    expect(health.services?.database?.status).toBe('ok');
}

test.describe('Hosted DEV — Customers V18, read-only', () => {
    test.describe.configure({ retries: 0 });

    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
            origin: PANEL,
        },
    });

    test('real admin login, filters, sorting, modal and mobile', async ({ page }) => {
        test.setTimeout(150_000);
        const sha = assertScope();
        await assertPanelRelease(page, sha);
        await assertDevApiHealth(page);

        // Browser requests may read; only the pinned DEV login may POST.
        // Never allow incidental writes to customers, bookings or notifications.
        let blockedWrites = 0;
        await page.route('**/*', async (route) => {
            const request = route.request();
            const method = request.method().toUpperCase();
            if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                await route.continue();
                return;
            }
            const url = new URL(request.url());
            const syntheticLogin =
                method === 'POST' &&
                ((url.origin === PANEL && url.pathname === '/api/auth/login') ||
                    (url.origin === API && url.pathname === '/auth/login'));
            if (syntheticLogin) {
                await route.continue();
                return;
            }
            blockedWrites += 1;
            await route.abort('blockedbyclient');
        });

        await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
        await page.locator('input[name="email"]').fill(TEST_EMAIL);
        await page.locator('input[name="password"]').fill(
            process.env.E2E_ADMIN_PASSWORD!,
        );
        await page.getByRole('button', { name: 'Zaloguj się' }).click();
        await expect
            .poll(() => new URL(page.url()).pathname, { timeout: 20_000 })
            .not.toBe('/auth/login');

        const profileResponse = await page.request.get(
            PANEL + '/api/users/profile',
            { maxRedirects: 0 },
        );
        expect(profileResponse.status(), 'synthetic account profile').toBe(200);
        const profile = (await profileResponse.json()) as TestProfile;
        expect(profile.email).toBe(TEST_EMAIL);
        expect(profile.role).toBe('admin');
        expect(profile.isSystemAdmin).toBe(false);

        const queries: CustomerQuery[] = [];
        page.on('request', (request) => {
            const url = new URL(request.url());
            if (
                url.origin !== PANEL ||
                url.pathname !== '/api/customers' ||
                request.method() !== 'GET'
            ) {
                return;
            }
            // Record only query parameters, NEVER returned customer data.
            queries.push({
                search: url.searchParams.get('search'),
                limit: url.searchParams.get('limit'),
                sortBy: url.searchParams.get('sortBy'),
                groupId: url.searchParams.get('groupId'),
            });
        });

        const firstCustomers = page.waitForResponse((response) => {
            const url = new URL(response.url());
            return (
                url.origin === PANEL &&
                url.pathname === '/api/customers' &&
                response.request().method() === 'GET'
            );
        });
        await page.goto('/studio-v18/customers', { waitUntil: 'domcontentloaded' });
        const customers = await firstCustomers;
        expect(customers.status(), 'real DEV customers API').toBe(200);

        await expect(
            page.getByRole('heading', { name: 'Klienci V18' }),
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Pełny moduł Klienci' }),
        ).toHaveAttribute('href', '/customers');
        await expect(
            page.getByRole('button', { name: 'Dodaj klienta', exact: true }),
        ).toBeVisible();

        // The view must work even on a DEV instance with zero customers.
        const size = page.getByLabel('Na stronie');
        await size.selectOption('50');
        await expect
            .poll(() => queries.some((q) => q.limit === '50'))
            .toBe(true);
        await page.getByRole('button', { name: 'Sortuj po e-mailu' }).click();
        await expect
            .poll(() => queries.some((q) => q.sortBy === 'email'))
            .toBe(true);

        const group = page.getByLabel('Grupa klientów');
        const groupValues = await group.locator('option').evaluateAll((options) =>
            options
                .map((option) => (option as HTMLOptionElement).value)
                .filter((value) => /^[1-9]\d*$/.test(value)),
        );
        if (groupValues.length > 0) {
            await group.selectOption(groupValues[0]);
            await expect
                .poll(() =>
                    queries.some((q) => q.groupId === groupValues[0]),
                )
                .toBe(true);
        }

        // A unique, unmatchable marker proves live server-side search/empty UI
        // without printing or modifying any existing customer data.
        const noMatch = 'wdi2-readonly-' + randomUUID();
        await page
            .getByRole('searchbox', { name: 'Wyszukaj klienta' })
            .fill(noMatch);
        await expect
            .poll(() => queries.some((q) => q.search === noMatch))
            .toBe(true);
        await expect(
            page.getByText('Brak klientów spełniających kryteria.'),
        ).toBeVisible();

        await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
        await expect(size).toHaveValue('20');

        // Check reusable form behavior without saving or altering any customer.
        await page.getByRole('button', { name: 'Dodaj klienta', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Nowy klient')).toBeVisible();
        const submit = dialog.getByRole('button', {
            name: 'dodaj klienta',
            exact: true,
        });
        await expect(submit).toBeDisabled();
        await dialog.locator('#modal-customer-first-name').fill('WDI');
        await expect(submit).toBeEnabled();
        await dialog.getByRole('button', { name: 'anuluj' }).click();
        await expect(dialog).toHaveCount(0);

        for (const width of [1440, 390]) {
            await page.setViewportSize({ width, height: 844 });
            await expect(
                page.getByRole('heading', { name: 'Klienci V18' }),
            ).toBeVisible();
            expect(
                await page.evaluate(
                    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
                ),
                'no page-level horizontal overflow at ' + width + 'px',
            ).toBe(true);
        }

        await assertPanelRelease(page, sha);
        expect(blockedWrites, 'unexpected browser mutation attempts').toBe(0);
        console.log(
            'HOSTED_DEV_V18_READ_ONLY_UAT=PASS: exact release, synthetic admin, live customers API, filters, search, sort, form states, desktop/mobile',
        );
    });
});
