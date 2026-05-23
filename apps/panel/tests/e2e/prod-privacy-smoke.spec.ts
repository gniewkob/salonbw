import { expect, test } from '@playwright/test';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
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

test.describe('PROD smoke: privacy settings resilience', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('error -> retry -> save flow works without unintended overwrite', async ({
        page,
    }) => {
        await login(page);

        let profileCalls = 0;
        let consentPatched = false;

        await page.route('**/api/users/profile', async (route) => {
            profileCalls += 1;
            if (profileCalls === 1) {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'forced profile load error',
                    }),
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    role: 'client',
                    gdprConsent: true,
                    gdprConsentDate: '2026-05-01T00:00:00.000Z',
                    smsConsent: false,
                    emailConsent: false,
                }),
            });
        });

        await page.route('**/api/users/profile/consent', async (route) => {
            consentPatched = true;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    smsConsent: false,
                    emailConsent: false,
                }),
            });
        });

        await page.goto('/settings/privacy');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.getByText(
                'Nie udało się załadować aktualnych zgód. Spróbuj ponownie.',
            ),
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Spróbuj ponownie' }),
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Zapisz ustawienia' }),
        ).toHaveCount(0);

        expect(consentPatched).toBe(false);

        await page.getByRole('button', { name: 'Spróbuj ponownie' }).click();

        await expect(
            page.getByRole('button', { name: 'Zapisz ustawienia' }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Zapisz ustawienia' }).click();

        await expect(
            page.getByText('Ustawienia zostały zapisane.'),
        ).toBeVisible();
        expect(consentPatched).toBe(true);
    });
});
