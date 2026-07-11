/**
 * visual-sweep.spec.ts — Z8 (docs/SONNET_EXECUTION_PLAN.md)
 *
 * Visits every panel route reachable by admin/client (and employee, when
 * credentials exist) at two viewports and saves a full-page screenshot for
 * manual review. Read-only: navigation + in-page tab switches only, no
 * mutations.
 *
 * This spec is NOT meant to run as part of the normal test suite or the
 * existing `regression` project — it's deliberately gated behind
 * `VISUAL_SWEEP=1` (set only by the dispatch-only `e2e-visual-sweep.yml`
 * workflow) so a bare `playwright test` locally or in another workflow
 * never picks it up. It also does its own login per role (rather than
 * reusing the `regression-setup` storageState files) to stay fully
 * decoupled from the regression suite's auth plumbing.
 *
 * Login is throttled server-side (5/min) — each role logs in exactly ONCE
 * in `beforeAll` and every route in that role's list reuses the same
 * authenticated page.
 */

import {
    test,
    expect,
    type Browser,
    type BrowserContext,
    type Page,
} from '@playwright/test';
import { loginAs } from './helpers/auth';

const SWEEP_ENABLED = process.env.VISUAL_SWEEP === '1';

const VIEWPORTS = [
    { name: '1366x768', width: 1366, height: 768 },
    { name: '390x844', width: 390, height: 844 },
] as const;

interface RouteSpec {
    name: string;
    path: string;
}

const ADMIN_ROUTES: RouteSpec[] = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'calendar-day', path: '/calendar?view=day' },
    { name: 'calendar-week', path: '/calendar?view=week' },
    { name: 'calendar-month', path: '/calendar?view=month' },
    { name: 'calendar-reception', path: '/calendar?view=reception' },
    { name: 'appointments', path: '/appointments' },
    { name: 'customers', path: '/customers' },
    { name: 'services', path: '/services' },
    { name: 'products', path: '/products' },
    { name: 'inventory', path: '/inventory' },
    { name: 'orders-history', path: '/orders/history' },
    { name: 'deliveries-history', path: '/deliveries/history' },
    { name: 'manufacturers', path: '/manufacturers' },
    { name: 'suppliers', path: '/suppliers' },
    { name: 'stock-alerts', path: '/stock-alerts' },
    { name: 'sales-history', path: '/sales/history' },
    { name: 'sales-gift-cards', path: '/sales/gift-cards' },
    { name: 'loyalty', path: '/loyalty' },
    { name: 'communication-templates', path: '/communication/templates' },
    { name: 'communication-mass', path: '/communication/mass' },
    { name: 'communication-campaigns', path: '/communication/campaigns' },
    { name: 'communication-automatic', path: '/communication/automatic' },
    { name: 'statistics', path: '/statistics' },
    { name: 'statistics-register', path: '/statistics/register' },
    { name: 'statistics-customers', path: '/statistics/customers' },
    { name: 'statistics-tips', path: '/statistics/tips' },
    { name: 'statistics-worktime', path: '/statistics/worktime' },
    {
        name: 'statistics-customers-origins',
        path: '/statistics/customers/origins',
    },
    {
        name: 'statistics-customers-returning',
        path: '/statistics/customers/returning',
    },
    { name: 'statistics-services', path: '/statistics/services' },
    { name: 'statistics-comments', path: '/statistics/comments' },
    { name: 'statistics-commissions', path: '/statistics/commissions' },
    { name: 'statistics-employees', path: '/statistics/employees' },
    { name: 'statistics-follow-up', path: '/statistics/follow-up' },
    {
        name: 'statistics-warehouse-changes',
        path: '/statistics/warehouse/changes',
    },
    {
        name: 'statistics-warehouse-value',
        path: '/statistics/warehouse/value',
    },
    { name: 'reviews', path: '/reviews' },
    { name: 'invoices', path: '/invoices' },
    { name: 'notifications', path: '/notifications' },
    { name: 'helps-new', path: '/helps/new' },
    { name: 'settings', path: '/settings' },
    { name: 'settings-branch', path: '/settings/branch' },
    { name: 'settings-calendar', path: '/settings/calendar' },
    { name: 'settings-customers', path: '/settings/customers' },
    { name: 'settings-customer-groups', path: '/settings/customer-groups' },
    { name: 'settings-customer-origins', path: '/settings/customer-origins' },
    { name: 'settings-extra-fields', path: '/settings/extra-fields' },
    { name: 'settings-trades', path: '/settings/trades' },
    {
        name: 'settings-data-protection',
        path: '/settings/data-protection',
    },
    {
        name: 'settings-data-protection-logs',
        path: '/settings/data-protection/logs',
    },
    { name: 'settings-employees', path: '/settings/employees' },
    { name: 'settings-features', path: '/settings/features' },
    { name: 'settings-online-booking', path: '/settings/online-booking' },
    {
        name: 'settings-payment-configuration',
        path: '/settings/payment-configuration',
    },
    { name: 'settings-privacy', path: '/settings/privacy' },
    { name: 'settings-sms', path: '/settings/sms' },
    {
        name: 'settings-service-categories',
        path: '/settings/service-categories',
    },
    { name: 'settings-categories', path: '/settings/categories' },
    { name: 'settings-timetable-branch', path: '/settings/timetable/branch' },
    {
        name: 'settings-timetable-employees',
        path: '/settings/timetable/employees',
    },
    {
        name: 'settings-timetable-templates',
        path: '/settings/timetable/templates',
    },
];

const CLIENT_ROUTES: RouteSpec[] = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'visits', path: '/visits' },
    { name: 'booking', path: '/booking' },
    { name: 'account', path: '/account' },
    { name: 'notifications', path: '/notifications' },
    { name: 'helps-new', path: '/helps/new' },
];

// Employees can manage appointments/customers/calendar/own schedule but are
// blocked (legitimately, by RouteGuard) from the services catalog, products,
// statistics, communication, and most of /settings — reusing ADMIN_ROUTES
// here would make assertHealthy's "Nie masz uprawnień" check fail on those,
// which isn't a bug, just a role boundary. Keep this list to what an
// employee account is actually expected to reach.
const EMPLOYEE_ROUTES: RouteSpec[] = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'calendar-day', path: '/calendar?view=day' },
    { name: 'calendar-week', path: '/calendar?view=week' },
    { name: 'calendar-month', path: '/calendar?view=month' },
    { name: 'calendar-reception', path: '/calendar?view=reception' },
    { name: 'appointments', path: '/appointments' },
    { name: 'customers', path: '/customers' },
    { name: 'notifications', path: '/notifications' },
    { name: 'helps-new', path: '/helps/new' },
    { name: 'schedule', path: '/schedule' },
];

const CUSTOMER_CARD_TABS: RouteSpec[] = [
    { name: 'customer-card-overview', path: '' },
    { name: 'customer-card-personal', path: '?tab_name=personal_data' },
    { name: 'customer-card-history', path: '?tab_name=events_history' },
    { name: 'customer-card-statistics', path: '?tab_name=statistics' },
    { name: 'customer-card-notes', path: '?tab_name=opinions' },
    {
        name: 'customer-card-communication',
        path: '?tab_name=communication_preferences',
    },
    { name: 'customer-card-gallery', path: '?tab_name=gallery' },
    { name: 'customer-card-files', path: '?tab_name=files' },
];

const SERVICE_CARD_TABS: RouteSpec[] = [
    { name: 'service-card-summary', path: '' },
    { name: 'service-card-stats', path: '?tab=stats' },
    { name: 'service-card-history', path: '?tab=history' },
    { name: 'service-card-employees', path: '?tab=employees' },
    { name: 'service-card-comments', path: '?tab=comments' },
    { name: 'service-card-commissions', path: '?tab=commissions' },
    { name: 'service-card-recipe', path: '?tab=recipe' },
];

function adminCredsPresent(): boolean {
    return Boolean(
        (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL) &&
            (process.env.E2E_ADMIN_PASSWORD ??
                process.env.PANEL_LOGIN_PASSWORD),
    );
}

function clientCredsPresent(): boolean {
    return Boolean(
        process.env.E2E_CLIENT_EMAIL && process.env.E2E_CLIENT_PASSWORD,
    );
}

function employeeCredsPresent(): boolean {
    return Boolean(
        process.env.E2E_EMPLOYEE_EMAIL && process.env.E2E_EMPLOYEE_PASSWORD,
    );
}

/** Waits for the loading spinner to clear (best-effort, never fails the test). */
async function settle(page: Page): Promise<void> {
    await page
        .locator('[aria-label="Ładowanie"]')
        .first()
        .waitFor({ state: 'hidden', timeout: 8_000 })
        .catch(() => undefined);
    await page
        .waitForLoadState('networkidle', { timeout: 8_000 })
        .catch(() => undefined);
}

/** Minimal health assertions shared by every route in the sweep. */
async function assertHealthy(page: Page): Promise<void> {
    // toHaveCount(0) rather than not.toBeVisible() on a getByText locator:
    // the latter throws a strict-mode violation (not a clean assertion
    // failure) the moment more than one match exists on the page, which a
    // 65-route sweep is bound to hit somewhere.
    await expect(page.getByText('Application error')).toHaveCount(0);
    await expect(page.getByText('Nie masz uprawnień')).toHaveCount(0);
    // Not every page uses a literal <h1> (some rely on breadcrumbs / custom
    // heading components), so this checks for *any* rendered heading rather
    // than the stricter level-1-only assertion — the goal is "something
    // rendered, not a blank/broken page", per the Z8 acceptance criteria.
    await expect(page.getByRole('heading').first()).toBeVisible({
        timeout: 15_000,
    });
}

async function shot(page: Page, role: string, viewport: string, name: string) {
    await page.screenshot({
        path: `screenshots/${role}/${viewport}/${name}.png`,
        fullPage: true,
    });
}

async function visitAndShoot(
    page: Page,
    role: string,
    viewport: (typeof VIEWPORTS)[number],
    route: RouteSpec,
) {
    await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
    });
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await settle(page);
    // Shoot BEFORE asserting: the screenshot is the deliverable this sweep
    // exists to produce, so a route that fails assertHealthy must still
    // leave one in the artifact for review — a trace alone isn't enough.
    await shot(page, role, viewport.name, route.name);
    await assertHealthy(page);
}

type SweepRole = 'admin' | 'client' | 'employee';

// Every describe block below runs in this same file/worker (fullyParallel
// is off in playwright.config.ts, so a single file's tests run serially),
// which means the FIRST describe to need a given role's session logs in
// and every later describe for that same role (e.g. the admin card-tabs
// flows) reuses it — cutting a second admin login (and its throttle risk)
// entirely rather than just "less" of it.
const sessionCache = new Map<
    SweepRole,
    { context: BrowserContext; page: Page }
>();

async function getSessionPage(
    browser: Browser,
    role: SweepRole,
): Promise<Page> {
    const cached = sessionCache.get(role);
    if (cached) return cached.page;
    const email =
        role === 'admin'
            ? (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL)!
            : role === 'client'
              ? process.env.E2E_CLIENT_EMAIL!
              : process.env.E2E_EMPLOYEE_EMAIL!;
    const password =
        role === 'admin'
            ? (process.env.E2E_ADMIN_PASSWORD ??
                  process.env.PANEL_LOGIN_PASSWORD)!
            : role === 'client'
              ? process.env.E2E_CLIENT_PASSWORD!
              : process.env.E2E_EMPLOYEE_PASSWORD!;
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, email, password);
    sessionCache.set(role, { context, page });
    return page;
}

// Closes every cached session once, after the whole file's tests are done
// (not per-describe — sessions are shared across describes, see above).
test.afterAll(async () => {
    for (const { context } of sessionCache.values()) {
        await context.close();
    }
    sessionCache.clear();
});

function runSweep(
    describeName: string,
    role: SweepRole,
    routes: RouteSpec[],
    credsPresent: () => boolean,
) {
    test.describe(describeName, () => {
        let page: Page | null = null;

        test.beforeAll(async ({ browser }) => {
            // loginAs backs off up to 35s on a throttle hit; the default
            // hook timeout (30s) can't survive that — see the identical
            // comment/pattern in regression/auth.setup.ts.
            test.setTimeout(180_000);
            if (!SWEEP_ENABLED || !credsPresent()) return;
            page = await getSessionPage(browser, role);
        });

        for (const route of routes) {
            for (const viewport of VIEWPORTS) {
                test(`${route.name} @ ${viewport.name}`, async () => {
                    test.setTimeout(60_000);
                    test.skip(!SWEEP_ENABLED, 'VISUAL_SWEEP not enabled');
                    test.skip(!credsPresent(), `Missing ${role} credentials`);
                    if (!page) throw new Error('Login did not complete');
                    await visitAndShoot(page, role, viewport, route);
                });
            }
        }
    });
}

runSweep('Visual sweep — admin', 'admin', ADMIN_ROUTES, adminCredsPresent);
runSweep('Visual sweep — client', 'client', CLIENT_ROUTES, clientCredsPresent);
runSweep(
    'Visual sweep — employee (optional)',
    'employee',
    EMPLOYEE_ROUTES,
    employeeCredsPresent,
);

// Data-dependent flows: only meaningful once at least one row exists to open.
// Best-effort (soft-check), matching the existing regression spec pattern.
test.describe('Visual sweep — admin customer/service card tabs', () => {
    let page: Page | null = null;

    test.beforeAll(async ({ browser }) => {
        test.setTimeout(180_000);
        if (!SWEEP_ENABLED || !adminCredsPresent()) return;
        // Reuses the session the "Visual sweep — admin" describe above
        // already logged in with (same file, same worker, runs first) —
        // no second admin login here.
        page = await getSessionPage(browser, 'admin');
    });

    for (const viewport of VIEWPORTS) {
        test(`customer card tabs @ ${viewport.name}`, async () => {
            // 8+ navigations with settle() (up to ~16s each) plus
            // fullpage screenshots in one test blow past the default 30s.
            test.setTimeout(240_000);
            test.skip(!SWEEP_ENABLED, 'VISUAL_SWEEP not enabled');
            test.skip(!adminCredsPresent(), 'Missing admin credentials');
            if (!page) throw new Error('Login did not complete');
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
            await page.goto('/customers', { waitUntil: 'domcontentloaded' });
            await settle(page);
            const firstRow = page.locator('.row-title').first();
            const hasRow = await firstRow
                .isVisible({ timeout: 5_000 })
                .catch(() => false);
            if (!hasRow) return;
            await firstRow.click();
            await page.waitForURL(/\/customers\/\d+/, { timeout: 20_000 });
            const base = page.url().split('?')[0];
            for (const tab of CUSTOMER_CARD_TABS) {
                await page.goto(`${base}${tab.path}`, {
                    waitUntil: 'domcontentloaded',
                });
                await settle(page);
                await shot(page, 'admin', viewport.name, tab.name);
                await assertHealthy(page);
            }
        });

        test(`service card tabs @ ${viewport.name}`, async () => {
            test.setTimeout(240_000);
            test.skip(!SWEEP_ENABLED, 'VISUAL_SWEEP not enabled');
            test.skip(!adminCredsPresent(), 'Missing admin credentials');
            if (!page) throw new Error('Login did not complete');
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
            await page.goto('/services', { waitUntil: 'domcontentloaded' });
            await settle(page);
            const firstRow = page.locator('td.link_body a').first();
            const hasRow = await firstRow
                .isVisible({ timeout: 5_000 })
                .catch(() => false);
            if (!hasRow) return;
            await firstRow.click();
            await page.waitForURL(/\/services\/\d+/, { timeout: 20_000 });
            const base = page.url().split('?')[0];
            for (const tab of SERVICE_CARD_TABS) {
                await page.goto(`${base}${tab.path}`, {
                    waitUntil: 'domcontentloaded',
                });
                await settle(page);
                await shot(page, 'admin', viewport.name, tab.name);
                await assertHealthy(page);
            }
        });
    }
});
