import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Customers Module', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should display customer list', async ({ page }) => {
        await page.goto('/customers');
        await expect(page.locator('h1')).toContainText('Klienci');
        await expect(page.locator('table')).toBeVisible();
    });

    test('should search for a customer', async ({ page }) => {
        await page.goto('/customers');
        // Assuming there's a search input with specific placeholder or selector
        const searchInput = page.getByPlaceholder(
            'Szukaj klienta, email, telefon...',
        );
        await searchInput.fill('Marzena');
        await page.keyboard.press('Enter');

        await expect(page.locator('table')).toContainText('Marzena');
    });

    test.describe('Customer Details', () => {
        test('should display summary tab', async ({ page }) => {
            await page.goto('/customers');
            // Click first customer
            await page.locator('table tbody tr').first().click();

            await expect(page.locator('h1')).toBeVisible(); // Customer name header
            await expect(page.getByText('Podsumowanie')).toBeVisible();
            await expect(page.getByText('Dane kontaktowe')).toBeVisible();
        });

        test('should display visits tab', async ({ page }) => {
            await page.goto('/customers');
            await page.locator('table tbody tr').first().click();

            await page.getByRole('tab', { name: 'Historia wizyt' }).click();
            await expect(page.getByRole('table')).toBeVisible();
            // Check for expected columns
            await expect(page.getByText('Data')).toBeVisible();
            await expect(page.getByText('Usługa')).toBeVisible();
            await expect(page.getByText('Pracownik')).toBeVisible();
        });
    });

    test('should match visual snapshot for list', async ({ page }) => {
        await page.goto('/customers');
        await expect(page).toHaveScreenshot('customers-list.png');
    });

    test('should match visual snapshot for details', async ({ page }) => {
        await page.goto('/customers');
        await page.locator('table tbody tr').first().click();
        await expect(page).toHaveScreenshot('customer-details.png');
    });
});
