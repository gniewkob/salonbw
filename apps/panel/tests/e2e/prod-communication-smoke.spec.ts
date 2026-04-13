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

test.describe('PROD smoke: communication navigation', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('communication subpages load from secondary nav links', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/communication');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="communication-page"]'),
        ).toBeVisible();

        const nav = page.locator('#sidenav');
        await expect(
            nav.getByRole('link', { name: 'Nieprzeczytane wiadomości' }),
        ).toBeVisible();
        await expect(
            nav.getByRole('link', { name: 'Wiadomości masowe' }),
        ).toBeVisible();
        await expect(
            nav.getByRole('link', { name: 'Szablony wiadomości' }),
        ).toBeVisible();
        await expect(
            nav.getByRole('link', { name: 'Przypomnienia' }),
        ).toBeVisible();

        await nav.getByRole('link', { name: 'Wiadomości masowe' }).click();
        await expect(page).toHaveURL(/\/communication\/mass/);
        await expect(
            page.locator('h1:has-text("Łączność / Wyślij wiadomość masową")'),
        ).toBeVisible();

        await nav.getByRole('link', { name: 'Szablony wiadomości' }).click();
        await expect(page).toHaveURL(/\/communication\/templates/);
        await expect(
            page.locator('h1:has-text("Łączność / Szablony wiadomości")'),
        ).toBeVisible();

        await nav.getByRole('link', { name: 'Przypomnienia' }).click();
        await expect(page).toHaveURL(/\/communication\/reminders/);
        await expect(
            page.locator('h1:has-text("Łączność / Automatyczne przypomnienia")'),
        ).toBeVisible();
    });
});
