import { Page, expect } from '@playwright/test';

const LOGIN_URL_RE = /\/login(\?|$)|\/auth\/login(\?|$)/;

/**
 * Generic login helper. Handles throttle retries (up to 4 attempts).
 * Throws if still on the login page after all attempts.
 */
export async function loginAs(
    page: Page,
    email: string,
    password: string,
): Promise<void> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');

        await page
            .locator('input[name="email"], input[type="email"]')
            .first()
            .fill(email);
        await page
            .locator('input[name="password"], input[type="password"]')
            .first()
            .fill(password);

        await Promise.all([
            page
                .waitForNavigation({ waitUntil: 'domcontentloaded' })
                .catch(() => null),
            page.click('button[type="submit"]'),
        ]);

        if (!LOGIN_URL_RE.test(page.url())) {
            return;
        }

        // Back-off if throttled
        const throttled = await page
            .locator('text=Too Many Requests')
            .first()
            .isVisible()
            .catch(() => false);
        await page.waitForTimeout(throttled ? 35_000 : 1_000);
    }

    await expect(
        page,
        'Should have left login page after 4 attempts',
    ).not.toHaveURL(LOGIN_URL_RE);
}

/**
 * Login as admin using env vars E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 * Falls back to PANEL_LOGIN_EMAIL / PANEL_LOGIN_PASSWORD for backward compat.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
    const email =
        process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL ?? '';
    const password =
        process.env.E2E_ADMIN_PASSWORD ??
        process.env.PANEL_LOGIN_PASSWORD ??
        '';
    if (!email || !password) {
        throw new Error(
            'Missing admin credentials: set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD',
        );
    }
    await loginAs(page, email, password);
}

/**
 * Login as client using env vars E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD.
 */
export async function loginAsClient(page: Page): Promise<void> {
    const email = process.env.E2E_CLIENT_EMAIL ?? '';
    const password = process.env.E2E_CLIENT_PASSWORD ?? '';
    if (!email || !password) {
        throw new Error(
            'Missing client credentials: set E2E_CLIENT_EMAIL and E2E_CLIENT_PASSWORD',
        );
    }
    await loginAs(page, email, password);
}
