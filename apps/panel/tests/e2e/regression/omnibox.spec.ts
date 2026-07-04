/**
 * omnibox.spec.ts — global customer-search regression
 *
 * Verifies: typing 3+ characters in #omnibox causes #omnibox-results to appear
 * with at least one result item OR the "Brak wyników" message.
 * Read-only: search is a GET; no writes to DB.
 * Credentials: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (staff role required —
 * omnibox is hidden for client role).
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

function credentialsPresent(): boolean {
    return Boolean(
        (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL) &&
            (process.env.E2E_ADMIN_PASSWORD ??
                process.env.PANEL_LOGIN_PASSWORD),
    );
}

test.describe('Omnibox (global customer search)', () => {
    test.beforeEach(async ({ page }) => {
        if (!credentialsPresent()) {
            test.skip(
                true,
                'Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD',
            );
            return;
        }
        await loginAsAdmin(page);
        // Navigate to a staff page so the topbar (with omnibox) is mounted
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    test('dropdown appears after typing 3 characters', async ({ page }) => {
        const omnibox = page.locator('#omnibox');
        await omnibox.waitFor({ state: 'visible', timeout: 20_000 });

        // Trigger search with a generic query likely to return results or the
        // empty-state message (both are valid — we test the dropdown appears)
        await omnibox.fill('mar');

        // Wait for the results dropdown
        const results = page.locator('#omnibox-results');
        await expect(results).toBeVisible({ timeout: 15_000 });

        // Either real results or the "Brak wyników" message must be present
        const hasItems = await results
            .locator('a, .dropdown-item')
            .first()
            .isVisible()
            .catch(() => false);
        const hasNoResults = await results
            .locator('text=Brak wyników')
            .first()
            .isVisible()
            .catch(() => false);

        expect(
            hasItems || hasNoResults,
            'Results dropdown must show items or "Brak wyników"',
        ).toBe(true);
    });

    test('dropdown does not appear for 1-character query', async ({ page }) => {
        const omnibox = page.locator('#omnibox');
        await omnibox.waitFor({ state: 'visible', timeout: 20_000 });

        await omnibox.fill('a');

        // Results must NOT be visible (min query length is 2 chars)
        await expect(page.locator('#omnibox-results')).not.toBeVisible({
            timeout: 3_000,
        });
    });
});
