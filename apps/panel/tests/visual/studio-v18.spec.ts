import { expect, test } from '@playwright/test';

// Deterministic browser test for the real Studio V18 route using synthetic
// data. The preview remains admin-only. No production data or credentials.
const origin =
    process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Fixture browser audit runs only on an explicitly configured local DEV build',
);

test.use({
    httpCredentials: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : { username: 'studio-fixture', password: 'studio-fixture-password' },
});

test.beforeEach(async ({ context, page }) => {
    // This is a test-only UI session marker. Every API response below is
    // intercepted; the fixture never authenticates against a real backend.
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);

    // Local fixture runs over HTTP. The actual DEV host uses HTTPS.
    // Strip only HTTPS-upgrade headers in this test response, rather than
    // weakening the application's production CSP/HSTS configuration.
    await page.route('**/studio-v18', async (route) => {
        const response = await route.fetch();
        const headers = response.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\\s*;?\\s*upgrade-insecure-requests\\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response, headers });
    });

    await page.route('**/api/**', async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        const path = pathname.replace(/^\/api/, '');

        const respond = async (data: unknown) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(data),
            });

        if (path === '/users/profile') {
            await respond({
                id: 1801,
                name: 'Administrator testowy',
                role: 'admin',
                email: 'admin@example.invalid',
            });
        } else if (path === '/employees') {
            await respond([
                { id: 1, firstName: 'Anna', name: 'Anna Testowa' },
                { id: 2, firstName: 'Ewa', name: 'Ewa Testowa' },
                { id: 3, firstName: 'Maja', name: 'Maja Testowa' },
            ]);
        } else if (path === '/dashboard') {
            await respond({
                onlinePendingCount: 3,
                upcomingAppointments: [
                    {
                        id: 501,
                        clientName: 'Klient testowy',
                        serviceName: 'Strzyżenie',
                        startTime: '2031-01-10T09:00:00.000Z',
                    },
                ],
            });
        } else if (path === '/statistics/dashboard') {
            await respond({
                todayAppointments: 8,
                todayRevenue: 980,
                monthRevenue: 16200,
                pendingAppointments: 3,
                monthDailyRevenue: [
                    { date: '2026-11-01', totalRevenue: 620 },
                    { date: '2026-11-02', totalRevenue: 970 },
                    { date: '2026-11-03', totalRevenue: 1190 },
                ],
            });
        } else if (path === '/stock-alerts/summary') {
            await respond({ lowStockCount: 2, outOfStockCount: 0 });
        } else {
            await route.fulfill({ status: 404, body: 'Unmocked fixture API' });
        }
    });
});

test('reference layout, date navigation and no horizontal overflow', async ({
    page,
}, testInfo) => {
    await page.goto('/studio-v18');
    await expect(page.getByTestId('studio-v18-reference')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Dzień dobry!' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Studio V18' }),
    ).toHaveAttribute('aria-current', 'page');

    await expect(page.getByText('Wizyty dziś')).toBeVisible();
    await expect(page.getByText('Zaplanowane spotkania')).toBeVisible();
    const calendarDay = page
        .getByRole('link', { name: /^Kalendarz, dzień / })
        .first();
    await expect(calendarDay).toHaveAttribute(
        'href',
        /^\/calendar\?date=\d{4}-\d{2}-\d{2}$/,
    );

    const hasNoHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    );
    expect(hasNoHorizontalOverflow).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('studio-v18-overview.png'),
        fullPage: true,
    });
});

test('module bookmarks are functional and persist after reload', async ({
    page,
}, testInfo) => {
    await page.goto('/studio-v18');
    await expect(page.getByTestId('studio-v18-reference')).toBeVisible();
    await page.getByRole('button', { name: 'Moje moduły' }).click();
    await page
        .getByRole('button', { name: 'Zapisz Kalendarz wizyt na później' })
        .click();
    await page.getByRole('button', { name: 'Zapisane' }).click();
    await expect(
        page.getByRole('link', { name: /Kalendarz wizyt/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: /Baza klientów/ }),
    ).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId('studio-v18-reference')).toBeVisible();
    await page.getByRole('button', { name: 'Moje moduły' }).click();
    await page.getByRole('button', { name: 'Zapisane' }).click();
    await expect(
        page.getByRole('button', { name: 'Usuń Kalendarz wizyt z zapisanych' }),
    ).toBeVisible();
    await page.screenshot({
        path: testInfo.outputPath('studio-v18-saved-modules.png'),
        fullPage: true,
    });
});
