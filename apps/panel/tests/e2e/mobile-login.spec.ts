import { test, expect } from '@playwright/test';

/**
 * Minimal mobile-viewport smoke test for the panel login page.
 *
 * The login page itself doesn't use SalonShell (it's a standalone form),
 * but it's the entry point for every receptionist on mobile, and a
 * regression here means literally no one can sign in. This spec validates
 * a few invariants that are easy to break in a CSS sweep:
 *
 *   - The form renders without horizontal scroll at 390px (no element
 *     wider than the viewport).
 *   - The submit button is present and meets the 44pt touch-target rule.
 *   - The submit button label is the live "Zaloguj się" — catches
 *     accidental brand/UI-copy changes that pass typecheck.
 *
 * Add full mobile-shell flow specs (login → /calendar → hamburger →
 * MobileReceptionListView) here once the backend mocking story for
 * mobile is in place. For now this is the wedge.
 */

test.describe.configure({ mode: 'serial' });

test.use({});

test('login renders at 390px without horizontal overflow', async ({ page }) => {
    await page.goto('/auth/login');

    // No element should be wider than the viewport.
    const viewportWidth = page.viewportSize()?.width ?? 0;
    expect(viewportWidth).toBeGreaterThan(0);

    const docWidth = await page.evaluate(
        () => document.documentElement.scrollWidth,
    );
    expect(docWidth).toBeLessThanOrEqual(viewportWidth);
});

test('login submit button is touch-friendly (≥44pt) and labelled', async ({
    page,
}) => {
    await page.goto('/auth/login');

    const submit = page.getByRole('button', { name: /zaloguj się/i });
    await expect(submit).toBeVisible();

    const box = await submit.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
    }
});
