import { test, expect } from '@playwright/test';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

async function login(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    for (let attempt = 0; attempt < 4; attempt += 1) {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle').catch(() => null);

        if (!/\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/.test(page.url())) {
            return;
        }

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

        if (!/\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/.test(page.url())) {
            return;
        }

        const throttled = await page
            .locator('text=Too Many Requests, text=ThrottlerException')
            .first()
            .isVisible()
            .catch(() => false);
        if (throttled) {
            await page.waitForTimeout(35_000);
            continue;
        }
        await page.waitForTimeout(1000);
    }

    await expect(page).not.toHaveURL(
        /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/,
    );
}

test.describe('PROD smoke: statistics module', () => {
    test.setTimeout(180_000);

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
        await expect(page.locator('.breadcrumb')).toContainText('Statystyki');
        await expect(page.locator('.breadcrumb')).toContainText('Raport finansowy');
        await expect(page.locator('text=Sprzedaż usług').first()).toBeVisible();
        await expect(
            page.locator(
                'h2:has-text("Dane w podziale na pracowników"), table th:has-text("Pracownik")',
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
        await expect(page.locator('.breadcrumb')).toContainText('Statystyki');
        await expect(page.locator('.breadcrumb')).toContainText('Aktywność pracowników');

        const dateInput = page
            .locator(
                'input[aria-label="Data"], input[aria-label="Data raportu"], input[type="date"]',
            )
            .first();
        await expect(dateInput).toBeVisible();
        const before = await dateInput.inputValue();

        const nextDayTrigger = page
            .getByRole('link', { name: /Następny dzień|›/ })
            .first();
        await expect(nextDayTrigger).toBeVisible();
        await nextDayTrigger.click();
        await page.waitForTimeout(350);
        let after = await dateInput.inputValue();
        if (after === before) {
            await nextDayTrigger.click();
            await page.waitForTimeout(350);
            after = await dateInput.inputValue();
        }

        expect(after).not.toBe(before);
    });
});
