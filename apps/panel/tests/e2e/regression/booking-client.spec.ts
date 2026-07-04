/**
 * booking-client.spec.ts — client booking wizard regression
 *
 * Verifies: client login → /booking shows step 1 heading "Wybierz usługę"
 * and at least one service card.
 * Read-only: no appointment is created.
 * Credentials: E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD (env).
 */

import { test, expect } from '@playwright/test';
import { loginAsClient } from '../helpers/auth';

function credentialsPresent(): boolean {
    return Boolean(
        process.env.E2E_CLIENT_EMAIL && process.env.E2E_CLIENT_PASSWORD,
    );
}

test.describe('Client booking wizard', () => {
    test.beforeEach(async ({ page }) => {
        if (!credentialsPresent()) {
            test.skip(
                true,
                'Missing E2E_CLIENT_EMAIL or E2E_CLIENT_PASSWORD',
            );
            return;
        }
        await loginAsClient(page);
    });

    test('step 1 heading is visible and at least one service card exists', async ({
        page,
    }) => {
        await page.goto('/booking', { waitUntil: 'domcontentloaded' });

        // The booking wizard renders a per-step <h2> — step 1 = "Wybierz usługę"
        await expect(
            page.getByRole('heading', { name: 'Wybierz usługę' }),
        ).toBeVisible({ timeout: 20_000 });

        // Wait for service cards to load (they arrive from /services/online-booking)
        const serviceCard = page.locator('.booking-service-card').first();
        await expect(serviceCard).toBeVisible({ timeout: 20_000 });
    });

    test('category filter chips are visible', async ({ page }) => {
        await page.goto('/booking', { waitUntil: 'domcontentloaded' });

        // "Wszystkie" is always the first chip
        await expect(
            page
                .locator('.booking-cat-chip')
                .filter({ hasText: 'Wszystkie' })
                .first(),
        ).toBeVisible({ timeout: 20_000 });
    });
});
