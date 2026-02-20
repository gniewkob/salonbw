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

test.describe('PROD smoke: statistics module', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('statistics overview renders summary widgets and table', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/statistics');
        await page.waitForLoadState('domcontentloaded');

        await expect(page.locator('[data-testid="statistics-page"]')).toBeVisible();
        await expect(
            page.locator('h1:has-text("Statystyki / Raport finansowy")'),
        ).toBeVisible();
        await expect(
            page.locator('table.versum-table td:has-text("Sprzedaż usług brutto")'),
        ).toBeVisible();
        await expect(
            page.locator(
                'table.versum-table th:has-text("DANE W PODZIALE NA PRACOWNIKÓW"), table.versum-table th:has-text("Pracownik")',
            ).first(),
        ).toBeVisible();
    });

    test('employee activity page renders and date navigation works', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/statistics/employees');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="employee-activity-page"]'),
        ).toBeVisible();
        await expect(
            page.locator('h1:has-text("Statystyki / Aktywność pracowników")'),
        ).toBeVisible();

        const dateInput = page.locator('input[type="date"]').first();
        await expect(dateInput).toBeVisible();
        const before = await dateInput.inputValue();

        await page.click('button:has-text("▶")');
        await page.waitForTimeout(250);
        const after = await dateInput.inputValue();

        expect(after).not.toBe(before);
    });
});
