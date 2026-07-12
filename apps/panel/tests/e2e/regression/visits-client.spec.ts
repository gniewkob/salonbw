/**
 * visits-client.spec.ts — client visits page regression
 *
 * Verifies: client login → /visits shows h1 "Moje wizyty" and the
 * "Nadchodzące wizyty" section (either with appointments or empty state).
 * Read-only: no writes to DB.
 * Credentials: E2E_CLIENT_EMAIL / E2E_CLIENT_PASSWORD (env).
 *
 * Z7 (2026-07-10): the two-level inline-expand on this page was replaced by
 * a slide-in details panel (role=dialog). The "never shows a price" check
 * below still applies to the row list only — the panel isn't opened for it.
 */

import { test, expect } from '@playwright/test';

function credentialsPresent(): boolean {
    return Boolean(
        process.env.E2E_CLIENT_EMAIL && process.env.E2E_CLIENT_PASSWORD,
    );
}

test.describe('Client visits page', () => {
    test.use({ storageState: 'playwright/.auth/client.json' });

    test.beforeEach(async () => {
        if (!credentialsPresent()) {
            test.skip(true, 'Missing E2E_CLIENT_EMAIL or E2E_CLIENT_PASSWORD');
            return;
        }
    });

    test('h1 "Moje wizyty" is visible', async ({ page }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });

        await expect(
            page.getByRole('heading', { level: 1, name: 'Moje wizyty' }),
        ).toBeVisible({ timeout: 20_000 });
    });

    test('"Nadchodzące wizyty" section is rendered', async ({ page }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });

        // The section heading is an h2 — it always renders even when the list
        // is empty (shows "Brak zaplanowanych wizyt.")
        await expect(
            page.getByRole('heading', {
                name: /Nadchodzące wizyty/,
            }),
        ).toBeVisible({ timeout: 20_000 });
    });

    test('page is accessible to client role (no 403 Forbidden)', async ({
        page,
    }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });

        // RouteGuard must NOT show the Forbidden component
        await expect(page.getByText('Nie masz uprawnień')).not.toBeVisible({
            timeout: 10_000,
        });
    });

    test('"Odbyte wizyty" section is rendered', async ({ page }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });

        // Renders even when empty (shows "Nie masz jeszcze odbytych wizyt.")
        await expect(
            page.getByRole('heading', { name: /Odbyte wizyty/ }),
        ).toBeVisible({ timeout: 20_000 });
    });

    test('visit rows never show a price (client must not see amounts)', async ({
        page,
    }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });

        // Wait for the page to settle past the loading state before scanning.
        await expect(
            page.getByRole('heading', { name: /Nadchodzące wizyty/ }),
        ).toBeVisible({ timeout: 20_000 });

        const sections = page.locator('.salonbw-appointments-list');
        const sectionCount = await sections.count();
        for (let i = 0; i < sectionCount; i++) {
            const text = (await sections.nth(i).innerText()).trim();
            expect(text).not.toMatch(/\d+([.,]\d{2})?\s*zł/);
        }
    });

    test('clicking "Szczegóły" opens the visit details panel as a dialog', async ({
        page,
    }) => {
        await page.goto('/visits', { waitUntil: 'domcontentloaded' });
        await expect(
            page.getByRole('heading', { name: /Nadchodzące wizyty/ }),
        ).toBeVisible({ timeout: 20_000 });

        // Data-dependent: only assert the panel opens when there is at
        // least one visit row to click (best-effort, like the omnibox
        // listbox soft-check in omnibox.spec.ts).
        const detailsButton = page
            .getByRole('button', { name: 'Szczegóły' })
            .first();
        const hasVisit = await detailsButton
            .isVisible({ timeout: 5_000 })
            .catch(() => false);
        if (!hasVisit) return;

        await detailsButton.click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible({ timeout: 10_000 });
        // Focus lands on the panel's heading on open.
        await expect(dialog.getByRole('heading')).toBeFocused();
    });
});
