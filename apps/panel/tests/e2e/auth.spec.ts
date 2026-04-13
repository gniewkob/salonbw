import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    test('should register and then login', async ({ page }) => {
        // 1. Register
        await page.goto('/auth/register');
        await page.fill('input[placeholder="Adres e-mail"]', testEmail);
        await page.fill('input[placeholder="Hasło"]', testPassword);
        await page.fill('input[placeholder="Imię i nazwisko"]', 'Test Playwright User');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard or login
        await expect(page).toHaveURL(/\/dashboard|\/calendar/);

        // 2. Logout (assuming there is a logout button in the sidebar or menu)
        // For now, let's just clear cookies and try to login
        await page.context().clearCookies();
        await page.goto('/auth/login');

        // 3. Login
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Should redirect to dashboard or calendar
        await expect(page).toHaveURL(/\/dashboard|\/calendar/);
    });

    test('should show error on invalid login', async ({ page }) => {
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for the specific error message container
        const errorMessage = page.locator('form p[role="alert"]').last();
        await expect(errorMessage).toBeVisible();
    });

    test('should show social login buttons', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page.getByText('Konto Google')).toBeVisible();
        await expect(page.getByText('Konto Facebook')).toBeVisible();
        await expect(page.getByText('Konto Apple')).toBeVisible();
    });
});
