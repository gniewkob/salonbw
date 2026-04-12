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

    await expect(page).not.toHaveURL(
        /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/,
    );
}

test.describe('PROD smoke: messages and newsletters', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('messages list and newsletter create route load', async ({ page }) => {
        await login(page);

        await page.goto('/messages');
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/messages/);
        await expect(
            page.locator(
                'h3:has-text("Historia wysłanych wiadomości i newsletterów")',
            ),
        ).toBeVisible();
        await expect(
            page.locator('a:has-text("+ nowy newsletter")'),
        ).toBeVisible();

        await page.goto('/newsletters/new');
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/newsletters\/new/);
        await expect(
            page.locator('h2:has-text("Nowy newsletter")'),
        ).toBeVisible();
        await expect(page.locator('#nl-name')).toBeVisible();
        await expect(page.locator('#nl-subject')).toBeVisible();
        await expect(page.locator('#newsletter-form')).toBeVisible();
    });
});
