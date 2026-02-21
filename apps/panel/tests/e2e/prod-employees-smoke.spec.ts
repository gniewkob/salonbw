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

test.describe('PROD smoke: employees secondary nav', () => {
    test.setTimeout(60_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('employees page renders without client exception and has dedicated secondary nav', async ({
        page,
    }) => {
        await login(page);

        await page.goto('/employees');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1200);

        await expect(page).toHaveURL(/\/employees(?:[/?#]|$)/);
        await expect(page.locator('body')).not.toContainText(
            'Application error: a client-side exception has occurred',
        );

        await expect(page.locator('#sidebar')).toHaveCount(1);
        await expect(page.locator('#sidenav')).toHaveCount(1);
        await expect(page.locator('#sidenav a[href="/employees"]')).toHaveCount(
            1,
        );
        await expect(
            page.locator('#sidenav a.active[href="/employees"]'),
        ).toHaveCount(1);
        await expect(
            page.locator('#sidenav a[href="/settings/employees/activity_logs"]'),
        ).toHaveCount(1);
    });
});
