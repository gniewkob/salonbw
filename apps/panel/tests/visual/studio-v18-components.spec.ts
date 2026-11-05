import { expect, test } from '@playwright/test';

// Only the locally built DEV app may run this fixture. Never browse real client
// data or save authenticated browser traces from the hosted salon environment.
const origin =
    process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'V18 component catalog QA is strictly local and synthetic',
);

test.use({
    httpCredentials: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : { username: 'studio-fixture', password: 'studio-fixture-password' },
});

test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);

    // The real DEV environment serves HTTPS. Strip the HTTPS-upgrade directive
    // only for the synthetic HTTP loopback document under test, not on DEV.
    await page.route('**/studio-v18/components', async (route) => {
        const response = await route.fetch();
        const headers = response.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\s*;?\s*upgrade-insecure-requests\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response, headers });
    });

    await page.route('**/api/**', async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/api/users/profile') {
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
            body: JSON.stringify({ error: 'No fixture endpoint' }),
        });
    });
});

test('catalog renders reusable components without page overflow', async ({
    page,
}, testInfo) => {
    const customerRequests: string[] = [];
    page.on('request', (request) => {
        if (/\/api\/customers(?:\?|\/|$)/.test(request.url())) {
            customerRequests.push(request.url());
        }
    });

    await page.goto('/studio-v18/components');

    await expect(
        page.getByRole('heading', { name: 'Biblioteka komponentów V18' }),
    ).toBeVisible();
    const table = page.getByRole('table', {
        name: 'Demonstracyjna tabela klientów',
    });
    await expect(table).toBeVisible();
    await expect(table.getByText('Anna Przykład')).toBeVisible();
    await expect(page.getByText('Dane wyłącznie demonstracyjne')).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Biblioteka komponentów' }),
    ).toHaveAttribute('aria-current', 'page');

    expect(customerRequests).toEqual([]);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
    ).toBe(true);

    await page.screenshot({
        path: testInfo.outputPath('v18-components-overview.png'),
        fullPage: true,
    });
});

test('demo filtering and the primary action are interactive', async ({
    page,
}, testInfo) => {
    await page.goto('/studio-v18/components');
    await expect(
        page.getByRole('heading', { name: 'Biblioteka komponentów V18' }),
    ).toBeVisible();

    await page
        .getByRole('searchbox', { name: 'Filtruj przykładowe rekordy' })
        .fill('Ola');
    const table = page.getByRole('table', {
        name: 'Demonstracyjna tabela klientów',
    });
    await expect(table.getByText('Ola Demo')).toBeVisible();
    await expect(table.getByText('Anna Przykład')).toHaveCount(0);

    await page.getByRole('button', { name: 'Przetestuj działanie' }).click();
    await expect(page.getByText('Przykładowa akcja wykonana')).toBeVisible();

    await page.getByRole('button', { name: 'Zresetuj przykład' }).click();
    await expect(table.getByText('Anna Przykład')).toBeVisible();
    await expect(page.getByText('Przykładowa akcja wykonana')).toHaveCount(0);

    await page.screenshot({
        path: testInfo.outputPath('v18-components-interaction.png'),
        fullPage: true,
    });
});
