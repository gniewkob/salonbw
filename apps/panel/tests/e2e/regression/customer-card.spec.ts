/**
 * customer-card.spec.ts — staff customer detail page regression
 *
 * Verifies: the customer card hero (avatar-or-initials) renders, and
 * switching between the in-page tabs (Przegląd/Dane/Historia/...) updates
 * the URL's tab_name query param without navigating away from the card.
 * Read-only: no writes to DB.
 * Credentials: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (env).
 */

import { test, expect } from '@playwright/test';

function credentialsPresent(): boolean {
    return Boolean(
        (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL) &&
            (process.env.E2E_ADMIN_PASSWORD ??
                process.env.PANEL_LOGIN_PASSWORD),
    );
}

test.describe('Customer card', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test.beforeEach(async ({ page }) => {
        if (!credentialsPresent()) {
            test.skip(true, 'Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD');
            return;
        }
    });

    test('hero renders and tabs switch without leaving the card', async ({
        page,
    }) => {
        await page.goto('/customers', { waitUntil: 'domcontentloaded' });

        const firstCustomer = page.locator('.row-title').first();
        await expect(firstCustomer).toBeVisible({ timeout: 20_000 });
        await firstCustomer.click();

        await expect(page).toHaveURL(/\/customers\/\d+/, {
            timeout: 20_000,
        });

        const hero = page.locator('.customer-detail-hero');
        await expect(hero).toBeVisible({ timeout: 20_000 });
        await expect(
            page.locator('.customer-detail-hero__avatar'),
        ).toBeVisible();

        const tabs = page.getByRole('navigation', {
            name: 'Sekcje karty klienta',
        });
        await expect(tabs).toBeVisible();

        await tabs.getByRole('link', { name: 'Historia' }).click();

        await expect(page).toHaveURL(/tab_name=events_history/, {
            timeout: 10_000,
        });
        // Still on the same customer card, not routed elsewhere.
        await expect(page).toHaveURL(/\/customers\/\d+/);
        await expect(hero).toBeVisible();
    });
});
