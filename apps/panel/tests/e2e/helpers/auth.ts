import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    // Adjust selectors based on actual login form
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    // Wait for navigation or dashboard element
    await expect(page).toHaveURL('/');
}
