/**
 * auth.spec.ts — login regression
 *
 * Verifies: admin login form → post-login redirect lands outside /auth/login.
 * Read-only: no writes to DB.
 * Credentials: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (env).
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const SKIP_REASON = 'Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD';

function credentialsPresent(): boolean {
    return Boolean(
        (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL) &&
            (process.env.E2E_ADMIN_PASSWORD ??
                process.env.PANEL_LOGIN_PASSWORD),
    );
}

test.describe('Admin login', () => {
    test('redirects to dashboard after successful login', async ({ page }) => {
        if (!credentialsPresent()) {
            test.skip(true, SKIP_REASON);
            return;
        }

        await loginAsAdmin(page);

        // Admin lands on /dashboard (getPostLoginRoute('admin') === '/dashboard')
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    });

    test('login page renders email and password fields', async ({ page }) => {
        await page.goto('/auth/login');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('input[name="email"], input[type="email"]').first(),
        ).toBeVisible({ timeout: 15_000 });

        await expect(
            page
                .locator('input[name="password"], input[type="password"]')
                .first(),
        ).toBeVisible({ timeout: 10_000 });

        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
});
