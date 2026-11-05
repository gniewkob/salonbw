import { expect, test } from '@playwright/test';

const origin = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';
test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Only local, synthetic V18 preview is eligible for screenshots',
);
test.use({
    httpCredentials: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : { username: 'studio-fixture', password: 'studio-fixture-password' },
});

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);
    await page.route('**/studio-v18/customer-list-lab', async (route) => {
        const response = await route.fetch();
        const headers = response.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\s*;?\s*upgrade-insecure-requests\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response, headers });
    });
    await page.route('**/api/**', async (route) => {
        if (new URL(route.request().url()).pathname === '/api/users/profile') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1801,
                    name: 'Administrator testowy',
                    role: 'admin',
                    email: 'admin@example.invalid',
                }),
            });
            return;
        }
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unexpected fixture endpoint' }),
        });
    });
});

test('search, server-query controls, pagination and keyboard work without live API', async ({
    page,
}, testInfo) => {
    const customerCalls: string[] = [];
    page.on('request', (request) => {
        if (/\/api\/customers(?:\?|\/|$)/.test(request.url())) {
            customerCalls.push(request.url());
        }
    });

    await page.goto('/studio-v18/customer-list-lab');
    await expect(
        page.getByRole('heading', { name: 'Lista klientów V18' }),
    ).toBeVisible();
    await expect(page.getByText('Klient testowy 01')).toBeVisible();
    // Synthetic IDs must never navigate to real customer or booking routes.
    await expect(page.getByRole('link', { name: 'Klient testowy 01' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Umów', exact: true })).toHaveCount(0);
    await expect(page.getByText(/Strona 1 z 4/)).toBeVisible();
    await page.getByRole('button', { name: 'Następna' }).click();
    await expect(page.getByText('Klient testowy 21')).toBeVisible();
    await page
        .getByRole('searchbox', { name: 'Wyszukaj klienta' })
        .fill('testowy 03');
    await expect(page.getByText('Klient testowy 03')).toBeVisible();
    await expect(page.getByText(/Strona 1 z 1/)).toBeVisible();
    await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
    await page.getByRole('button', { name: 'Klient', exact: true }).click();
    await expect(page.getByText('Klient testowy 63')).toBeVisible();
    await expect(
        page.getByRole('columnheader', { name: 'Klient' }),
    ).toHaveAttribute('aria-sort', 'descending');
    expect(customerCalls).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('v18-customer-list-lab.png'),
        fullPage: true,
    });
});
