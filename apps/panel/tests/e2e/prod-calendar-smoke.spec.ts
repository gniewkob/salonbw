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

test.describe('PROD smoke: calendar compat migration', () => {
    test.setTimeout(180_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('calendar uses salonbw asset aliases and avoids graphql 201 compat errors', async ({
        page,
    }) => {
        const graphqlStatuses: number[] = [];
        const compatAssetErrors: string[] = [];
        const consoleErrors: string[] = [];

        page.on('response', (response) => {
            const url = response.url();
            if (url.includes('/graphql')) {
                graphqlStatuses.push(response.status());
            }
        });

        page.on('requestfailed', (request) => {
            const url = request.url();
            if (
                url.includes('/salonbw-calendar/') ||
                url.includes('/salonbw-vendor/')
            ) {
                compatAssetErrors.push(
                    `${request.method()} ${url} :: ${request.failure()?.errorText ?? 'unknown'}`,
                );
            }
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await login(page);
        await page.goto('/calendar');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(8000);

        await expect(
            page.locator('.fc-toolbar.fc-header-toolbar'),
        ).toBeVisible();
        await expect(page.locator('#mainnav')).toBeVisible();

        const runtime = await page.evaluate(() => ({
            salonbwConfig: typeof window.SalonBWConfig !== 'undefined',
            versumConfig: typeof window.VersumConfig !== 'undefined',
            sameRef:
                typeof window.SalonBWConfig !== 'undefined' &&
                window.SalonBWConfig === window.VersumConfig,
            salonbwAssetRefs: Array.from(
                document.querySelectorAll('link[href], script[src]'),
            )
                .map((el) => el.getAttribute('href') || el.getAttribute('src'))
                .filter((value): value is string => Boolean(value))
                .filter((value) => value.includes('/salonbw-')),
            versumAssetRefs: Array.from(
                document.querySelectorAll('link[href], script[src]'),
            )
                .map((el) => el.getAttribute('href') || el.getAttribute('src'))
                .filter((value): value is string => Boolean(value))
                .filter((value) => value.includes('/versum-')),
        }));

        expect(runtime.salonbwConfig).toBe(true);
        expect(runtime.versumConfig).toBe(true);
        expect(runtime.sameRef).toBe(true);
        expect(runtime.salonbwAssetRefs.length).toBeGreaterThan(0);
        expect(runtime.versumAssetRefs.length).toBe(0);
        expect(compatAssetErrors).toEqual([]);
        expect(graphqlStatuses).toContain(200);
        expect(graphqlStatuses).not.toContain(201);
        expect(
            consoleErrors.filter((entry) =>
                entry.includes('Unhandled response status error'),
            ),
        ).toEqual([]);
    });
});
