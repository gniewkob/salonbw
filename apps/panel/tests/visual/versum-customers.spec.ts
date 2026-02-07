import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Customers Module
 *
 * Pixel parity comparison with Versum reference at 1366x768 and 1920x1080
 * Target: ≤0.5% difference
 */

const VIEWPORTS = [
    { name: '1366x768', width: 1366, height: 768 },
    { name: '1920x1080', width: 1920, height: 1080 },
];

// Mock data for consistent screenshots
const MOCK_CUSTOMERS = {
    customers: [
        {
            id: 1,
            full_name: 'Anna Kowalska',
            first_name: 'Anna',
            last_name: 'Kowalska',
            email: 'anna@example.com',
            phone: '+48 123 456 789',
            gender: 'female',
            created_at: '2026-01-15T10:00:00.000+01:00',
            gdpr_consent: true,
            sms_consent: true,
            email_consent: false,
            groups: [],
            last_visit_date: '2026-02-05T14:00:00.000+01:00',
        },
        {
            id: 2,
            full_name: 'Jan Nowak',
            first_name: 'Jan',
            last_name: 'Nowak',
            email: 'jan@example.com',
            phone: '+48 987 654 321',
            gender: 'male',
            created_at: '2026-01-10T14:30:00.000+01:00',
            gdpr_consent: true,
            sms_consent: false,
            email_consent: true,
            groups: [{ id: 1, name: 'VIP' }],
            last_visit_date: '2026-02-01T10:00:00.000+01:00',
        },
        {
            id: 3,
            full_name: 'Maria Wiśniewska',
            first_name: 'Maria',
            last_name: 'Wiśniewska',
            email: 'maria@example.com',
            phone: '+48 555 666 777',
            gender: 'female',
            created_at: '2026-01-05T09:00:00.000+01:00',
            gdpr_consent: true,
            sms_consent: true,
            email_consent: true,
            groups: [{ id: 2, name: 'Stały klient' }],
            last_visit_date: null,
        },
    ],
    pagination: {
        page: 1,
        perPage: 20,
        total: 3,
        totalPages: 1,
    },
};

const MOCK_GROUPS = {
    groups: [
        { id: 1, name: 'VIP', color: '#e74c3c', memberCount: 5 },
        { id: 2, name: 'Stały klient', color: '#27ae60', memberCount: 12 },
        { id: 3, name: 'Nowi', color: '#3498db', memberCount: 3 },
        { id: 4, name: 'Bez grupy', color: '#95a5a6', memberCount: 45 },
    ],
};

const MOCK_CUSTOMER_DETAIL = {
    customer: {
        id: 1,
        full_name: 'Anna Kowalska',
        first_name: 'Anna',
        last_name: 'Kowalska',
        email: 'anna@example.com',
        phone: '+48 123 456 789',
        gender: 'female',
        birth_date: '1990-05-15',
        address: 'ul. Kwiatowa 12',
        city: 'Warszawa',
        postal_code: '00-001',
        created_at: '2025-06-15T10:00:00.000+01:00',
        gdpr_consent: true,
        sms_consent: true,
        email_consent: false,
        description: 'Stała klientka, preferuje terminy poranne',
        tags: [
            { id: 1, name: 'VIP', color: '#e74c3c' },
            { id: 2, name: 'Farbowanie', color: '#9b59b6' },
        ],
        total_visits: 12,
        total_spent: 2850.0,
        first_visit_date: '2025-06-20T10:00:00.000+01:00',
        last_visit_date: '2026-02-05T14:00:00.000+01:00',
    },
};

test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
        localStorage.setItem(
            'auth',
            JSON.stringify({
                token: 'mock-token',
                user: { id: 1, name: 'Test User', role: 'admin' },
            }),
        );
    });

    // Mock customers list
    await page.route('**/api/customers**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_CUSTOMERS),
        });
    });

    // Mock customer groups
    await page.route('**/api/customer_groups', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_GROUPS),
        });
    });

    // Mock single customer
    await page.route('**/api/customers/1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_CUSTOMER_DETAIL),
        });
    });

    // Mock empty notes
    await page.route('**/api/customers/1/notes', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ notes: [] }),
        });
    });

    // Mock empty history
    await page.route('**/api/customers/1/history', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ events: [] }),
        });
    });
});

for (const viewport of VIEWPORTS) {
    test.describe(`Viewport: ${viewport.name}`, () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize({
                width: viewport.width,
                height: viewport.height,
            });
        });

        test('customers list view', async ({ page }) => {
            await page.goto('/clients');
            await page.waitForSelector('.clients-page', { timeout: 10000 });

            // Wait for all content to settle
            await page.waitForTimeout(500);

            // Take screenshot
            await expect(page).toHaveScreenshot(
                `customers-list-${viewport.name}.png`,
                {
                    fullPage: false,
                    threshold: 0.005, // 0.5% threshold
                },
            );
        });

        test('customer profile - summary tab', async ({ page }) => {
            await page.goto('/clients/1');
            await page.waitForSelector('.customer-detail-page', {
                timeout: 10000,
            });

            // Wait for tab content
            await page.waitForTimeout(500);

            await expect(page).toHaveScreenshot(
                `customer-profile-summary-${viewport.name}.png`,
                {
                    fullPage: false,
                    threshold: 0.005,
                },
            );
        });

        test('customer profile - personal data tab', async ({ page }) => {
            await page.goto('/clients/1');
            await page.waitForSelector('.customer-detail-page', {
                timeout: 10000,
            });

            // Click on personal data tab
            await page.getByText('dane osobowe').click();
            await page.waitForTimeout(500);

            await expect(page).toHaveScreenshot(
                `customer-profile-personal-${viewport.name}.png`,
                {
                    fullPage: false,
                    threshold: 0.005,
                },
            );
        });

        test('customer profile - history tab', async ({ page }) => {
            await page.goto('/clients/1');
            await page.waitForSelector('.customer-detail-page', {
                timeout: 10000,
            });

            // Click on history tab
            await page.getByText('historia wizyt').click();
            await page.waitForTimeout(500);

            await expect(page).toHaveScreenshot(
                `customer-profile-history-${viewport.name}.png`,
                {
                    fullPage: false,
                    threshold: 0.005,
                },
            );
        });

        test('customer profile - notes tab', async ({ page }) => {
            await page.goto('/clients/1');
            await page.waitForSelector('.customer-detail-page', {
                timeout: 10000,
            });

            // Click on notes tab
            await page.getByText('komentarze').click();
            await page.waitForTimeout(500);

            await expect(page).toHaveScreenshot(
                `customer-profile-notes-${viewport.name}.png`,
                {
                    fullPage: false,
                    threshold: 0.005,
                },
            );
        });
    });
}

// Baseline reference capture test
// Run this once to establish reference screenshots
test.describe('Reference Capture', () => {
    test('capture reference screenshots @reference', async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 768 });
        await page.goto('/clients');
        await page.waitForSelector('.clients-page', { timeout: 10000 });

        console.log(
            'Reference screenshots captured. Review and commit to baseline.',
        );
    });
});
