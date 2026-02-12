import { test, expect } from '@playwright/test';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

async function login(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator(
        'input[name="email"], input[type="email"], input[placeholder*="Email"], input[aria-label*="Email"]',
    );
    const passwordInput = page.locator(
        'input[name="password"], input[type="password"], input[placeholder*="Password"], input[aria-label*="Password"]',
    );

    await emailInput.first().waitFor({ state: 'visible', timeout: 20_000 });
    await emailInput.first().fill(email);
    await passwordInput.first().fill(password);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
        page.click(
            'button[type="submit"], button:has-text("Sign in"), button:has-text("Zaloguj"), button:has-text("Zaloguj się")',
        ),
    ]);

    await expect(page).not.toHaveURL(/\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/);
}

test.describe('PROD smoke: warehouse layout parity', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('warehouse submodules render inside Versum shell', async ({ page }) => {
        await login(page);

        const urls = [
            '/products',
            '/sales/new',
            '/use/new',
            '/use/planned',
            '/deliveries/new',
            '/stock-alerts',
            '/suppliers',
            '/manufacturers',
            '/orders/new',
            '/inventory',
        ];

        for (const url of urls) {
            await page.goto(url);
            await page.waitForLoadState('domcontentloaded');

            // VersumShell structure.
            await expect(page.locator('#main-container')).toBeVisible();
            await expect(page.locator('#sidebar')).toBeVisible();
            await expect(page.locator('#main-content')).toBeVisible();

            // Products module pages should set body id to "products".
            await expect(page.locator('body')).toHaveAttribute('id', 'products');

            // Warehouse pages should include the products wrapper.
            await expect(page.locator('#products_main')).toBeVisible();
            await expect(page.locator('.products-top-tabs')).toBeVisible();
        }
    });
});
