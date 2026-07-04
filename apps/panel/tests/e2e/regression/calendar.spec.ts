/**
 * calendar.spec.ts — calendar view-switch regression
 *
 * Verifies: /calendar renders FullCalendar grid; view-toggle buttons
 * (Tydzień, Miesiąc) update the ?view= URL param.
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

test.describe('Calendar view switching', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test.beforeEach(async () => {
        if (!credentialsPresent()) {
            test.skip(
                true,
                'Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD',
            );
            return;
        }
    });

    test('FullCalendar grid is visible on /calendar', async ({ page }) => {
        await page.goto('/calendar', { waitUntil: 'domcontentloaded' });

        // FullCalendar renders a table-based grid with role="grid"
        // or a .fc-view-harness wrapper.
        await expect(
            page
                .locator('.fc-view-harness, [role="grid"], .fc-daygrid, .fc-timegrid')
                .first(),
        ).toBeVisible({ timeout: 30_000 });
    });

    test('Tydzień button sets view=week in URL', async ({ page }) => {
        await page.goto('/calendar?view=day', { waitUntil: 'domcontentloaded' });

        // CalendarHeader renders a group labelled "Widok kalendarza"
        // with buttons "Dzień", "Tydzień", "Miesiąc"
        const weekBtn = page.getByRole('group', { name: 'Widok kalendarza' }).getByRole('button', { name: 'Tydzień' });
        await weekBtn.waitFor({ state: 'visible', timeout: 20_000 });
        await weekBtn.click();

        await expect(page).toHaveURL(/[?&]view=week/, { timeout: 15_000 });
    });

    test('Miesiąc button sets view=month in URL', async ({ page }) => {
        await page.goto('/calendar?view=day', { waitUntil: 'domcontentloaded' });

        const monthBtn = page.getByRole('group', { name: 'Widok kalendarza' }).getByRole('button', { name: 'Miesiąc' });
        await monthBtn.waitFor({ state: 'visible', timeout: 20_000 });
        await monthBtn.click();

        await expect(page).toHaveURL(/[?&]view=month/, { timeout: 15_000 });
    });
});
