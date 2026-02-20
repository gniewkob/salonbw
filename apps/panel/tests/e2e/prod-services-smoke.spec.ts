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

test.describe('PROD smoke: services details tabs', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('services list loads and links to details', async ({ page }) => {
        await login(page);

        await page.goto('/services');
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('[data-testid="services-page"]')).toBeVisible();

        const firstServiceLink = page.locator(
            'table.versum-table tbody tr td a.versum-link[href^="/services/"]',
        );
        await expect(firstServiceLink.first()).toBeVisible({ timeout: 20_000 });

        const detailsHref = await firstServiceLink.first().getAttribute('href');
        expect(detailsHref).toBeTruthy();

        await page.goto(String(detailsHref));
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('[data-testid="service-details-page"]')).toBeVisible();
    });

    test('comments and commissions tabs render expected controls', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/services');
        await page.waitForLoadState('domcontentloaded');

        const firstServiceLink = page.locator(
            'table.versum-table tbody tr td a.versum-link[href^="/services/"]',
        );
        await expect(firstServiceLink.first()).toBeVisible({ timeout: 20_000 });
        const detailsHref = await firstServiceLink.first().getAttribute('href');
        await page.goto(String(detailsHref));
        await page.waitForLoadState('domcontentloaded');

        await page.click('a:has-text("komentarze")');
        await expect(
            page.locator('h3:has-text("Dodaj komentarz")'),
        ).toBeVisible();
        await expect(
            page.locator('button:has-text("dodaj komentarz")'),
        ).toBeVisible();
        await expect(
            page.locator('table.versum-table th:has-text("Komentarz")'),
        ).toBeVisible();

        await page.click('a:has-text("prowizje")');
        await expect(
            page.locator('table.versum-table th:has-text("Prowizja (%)")'),
        ).toBeVisible();
        await expect(
            page.locator('button:has-text("zapisz prowizje")'),
        ).toBeVisible();
    });
});
