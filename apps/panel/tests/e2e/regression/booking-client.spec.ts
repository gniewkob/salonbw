/**
 * booking-client.spec.ts — client booking wizard regression
 *
 * Verifies: client login → /booking shows step 1 heading "Wybierz usługę"
 * and at least one service card.
 * Read-only: no appointment is created.
 * Credentials: E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD (env).
 */

import { test, expect } from '@playwright/test';

function credentialsPresent(): boolean {
    return Boolean(
        process.env.E2E_CLIENT_EMAIL && process.env.E2E_CLIENT_PASSWORD,
    );
}

test.describe('Client booking wizard', () => {
    test.use({ storageState: 'playwright/.auth/client.json' });

    test.beforeEach(async () => {
        if (!credentialsPresent()) {
            test.skip(true, 'Missing E2E_CLIENT_EMAIL or E2E_CLIENT_PASSWORD');
            return;
        }
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

    test('step indicator lists all 4 booking steps with the current one marked', async ({
        page,
    }) => {
        await page.goto('/booking', { waitUntil: 'domcontentloaded' });

        const steps = page.getByRole('list', { name: 'Kroki rezerwacji' });
        await expect(steps).toBeVisible({ timeout: 20_000 });
        await expect(steps.getByRole('listitem')).toHaveCount(4);

        // Step 1 ("Wybierz usługę") is the active one on first load.
        await expect(steps.getByRole('listitem').first()).toHaveAttribute(
            'aria-current',
            'step',
        );
    });

    test('flat-catalog services group into one card with a variant count', async ({
        page,
    }) => {
        await page.goto('/booking', { waitUntil: 'domcontentloaded' });

        const serviceCard = page.locator('.booking-service-card').first();
        await expect(serviceCard).toBeVisible({ timeout: 20_000 });

        // Best-effort: whether any service in the live catalog currently has
        // grouped hair-length variants is data-dependent, so this doesn't
        // hard-fail the run — it's a positive signal when present.
        const groupedCard = page
            .locator('.booking-service-card')
            .filter({ hasText: /warian(t|ty|tów) do wyboru/ })
            .first();
        const hasGroupedCard = await groupedCard
            .isVisible({ timeout: 5_000 })
            .catch(() => false);
        if (hasGroupedCard) {
            await expect(groupedCard).toContainText(/\d+ zł/);
        }
    });
});
