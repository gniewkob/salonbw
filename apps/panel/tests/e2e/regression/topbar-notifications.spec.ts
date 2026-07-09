/**
 * topbar-notifications.spec.ts — notification bell badge regression
 *
 * Verifies: the topbar bell's "unread" styling and data-unread_notifications
 * attribute agree — the badge/pulse class is present only when the pending
 * count is greater than zero (see the 2026-07-08 fix: the badge used to
 * mirror the whole feed length, not the actionable pending-bookings count).
 * Read-only: no writes to DB.
 * Credentials: E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (staff role required —
 * the bell is hidden for client role).
 */

import { test, expect } from '@playwright/test';

function credentialsPresent(): boolean {
    return Boolean(
        (process.env.E2E_ADMIN_EMAIL ?? process.env.PANEL_LOGIN_EMAIL) &&
            (process.env.E2E_ADMIN_PASSWORD ??
                process.env.PANEL_LOGIN_PASSWORD),
    );
}

test.describe('Topbar notification bell', () => {
    test.use({ storageState: 'playwright/.auth/admin.json' });

    test.beforeEach(async ({ page }) => {
        if (!credentialsPresent()) {
            test.skip(true, 'Missing E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD');
            return;
        }
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    });

    test('unread styling matches the pending-count data attribute', async ({
        page,
    }) => {
        const icon = page.locator('#notification_center_navbar_icon');
        await icon.waitFor({ state: 'visible', timeout: 20_000 });

        const countAttr = await icon.getAttribute('data-unread_notifications');
        const count = Number(countAttr ?? '0');
        expect(Number.isNaN(count)).toBe(false);
        expect(count).toBeGreaterThanOrEqual(0);

        const hasUnreadClass = await icon.evaluate((el) =>
            el.classList.contains('notifications_unread'),
        );
        expect(hasUnreadClass).toBe(count > 0);
    });

    test('bell links to the notifications page', async ({ page }) => {
        await expect(
            page.getByRole('link', { name: 'Powiadomienia' }),
        ).toHaveAttribute('href', '/notifications');
    });
});
