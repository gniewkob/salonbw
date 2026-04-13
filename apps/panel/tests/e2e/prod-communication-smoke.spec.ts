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
            page.locator('h3:has-text("Kanał komunikacji")'),
        ).toBeVisible();

        await nav.getByRole('link', { name: 'Szablony wiadomości' }).click();
        await expect(page).toHaveURL(/\/communication\/templates/);
        await expect(
            page.locator('button:has-text("+ Nowy szablon")'),
        ).toBeVisible();

        await nav.getByRole('link', { name: 'Przypomnienia' }).click();
        await expect(page).toHaveURL(/\/communication\/reminders/);
        await expect(
            page.locator('h3:has-text("Statystyki (ostatnie 7 dni)")'),
        ).toBeVisible();
    });

    test('communication detail exposes actions instead of disabled placeholder', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/communication');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="communication-page"]'),
        ).toBeVisible();
        await expect(page.locator('text=Ładowanie wiadomości...')).not.toBeVisible(
            { timeout: 15_000 },
        );

        const rows = page.locator('table.table-bordered tbody tr');
        const rowCount = await rows.count();

        if (rowCount === 0) {
            await expect(
                page.locator('text=Pozycje 0 - 0 z 0'),
            ).toBeVisible();
            return;
        }

        const firstMessageLink = rows.first().locator('td a').first();

        await expect(firstMessageLink).toBeVisible();
        await firstMessageLink.click();

        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/communication\/\d+/);

        const actionsMenu = page.locator(
            'summary:has-text("operacje"), summary:has-text("Operacje")',
        );
        await expect(actionsMenu).toBeVisible();
        await actionsMenu.click();

        await expect(
            page.locator('.customer-more-dropdown__menu button:has-text("odpowiedz")'),
        ).toBeVisible();
        await expect(
            page.locator('.customer-more-dropdown__menu button:has-text("drukuj")'),
        ).toBeVisible();

        const replyAction = page.locator(
            '.customer-more-dropdown__menu button:has-text("odpowiedz")',
        );
        await replyAction.click();

        await expect(page.locator('#reply_form')).toBeVisible();
    });
});
