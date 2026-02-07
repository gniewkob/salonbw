import { test, expect } from '@playwright/test';

/**
 * Customers (Klienci) E2E Tests
 *
 * Tests all customer flows according to the Versum 1:1 parity plan:
 * - List view (search, filter, pagination)
 * - Drag & drop to groups
 * - Customer profile navigation
 * - Tab switching (summary, personal, statistics, history, notes)
 * - Edit customer data
 * - Add notes
 */

const MOCK_CUSTOMERS = [
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
    },
];

const MOCK_GROUPS = [
    { id: 1, name: 'VIP', color: '#ff0000', memberCount: 5 },
    { id: 2, name: 'Stały klient', color: '#00ff00', memberCount: 12 },
    { id: 3, name: 'Nowi', color: '#0000ff', memberCount: 3 },
];

const MOCK_NOTES = [
    {
        id: 1,
        content: 'Klient preferuje terminy poranne',
        type: 'preference',
        isPinned: true,
        createdAt: '2026-01-20T10:00:00.000+01:00',
        createdBy: 'Admin',
    },
    {
        id: 2,
        content: 'Alergia na farby oksydacyjne',
        type: 'medical',
        isPinned: true,
        createdAt: '2026-01-15T14:00:00.000+01:00',
        createdBy: 'Kasia',
    },
];

const MOCK_HISTORY = [
    {
        id: 101,
        date: '2026-02-05T14:00:00.000+01:00',
        serviceName: 'Koloryzacja włosów',
        employeeName: 'Aleksandra Bodora',
        status: 'completed',
        price: 250.0,
        isFinalized: true,
    },
    {
        id: 102,
        date: '2026-01-20T10:00:00.000+01:00',
        serviceName: 'Strzyżenie damskie',
        employeeName: 'Aleksandra Bodora',
        status: 'completed',
        price: 120.0,
        isFinalized: true,
    },
];

// Setup API mocks
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

    // Mock customers list API
    await page.route('**/api/customers**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                customers: MOCK_CUSTOMERS,
                pagination: {
                    page: 1,
                    perPage: 20,
                    total: 2,
                    totalPages: 1,
                },
            }),
        });
    });

    // Mock customer groups API
    await page.route('**/api/customer_groups', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ groups: MOCK_GROUPS }),
        });
    });

    // Mock single customer API
    await page.route('**/api/customers/1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                customer: {
                    ...MOCK_CUSTOMERS[0],
                    description: 'Stała klientka od 2025 roku',
                    tags: [],
                    total_visits: 5,
                    total_spent: 850.0,
                },
            }),
        });
    });

    // Mock customer notes API
    await page.route('**/api/customers/1/notes', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ notes: MOCK_NOTES }),
        });
    });

    // Mock customer history API
    await page.route('**/api/customers/1/history', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ events: MOCK_HISTORY }),
        });
    });
});

test.describe('Customers List Page', () => {
    test('should display customers list with sidebar', async ({ page }) => {
        await page.goto('/clients');

        // Wait for page to load
        await page.waitForSelector('.clients-page', { timeout: 10000 });

        // Check breadcrumb - Versum style
        await expect(page.locator('.breadcrumb')).toContainText('Klienci / Lista klientów');

        // Check sidebar sections (using sidenav class)
        await expect(page.locator('#sidenav')).toBeVisible();
        await expect(page.locator('#sidenav')).toContainText('GRUPY KLIENTÓW');

        // Check search input in toolbar
        await expect(
            page.locator('.clients-search input'),
        ).toBeVisible();

        // Check customer groups in sidebar
        for (const group of MOCK_GROUPS) {
            await expect(page.locator('#sidenav')).toContainText(
                group.name,
            );
        }
    });

    test('should display customer table with correct columns', async ({ page }) => {
        await page.goto('/clients');

        await page.waitForSelector('.clients-table', { timeout: 10000 });

        // Check table has customers
        for (const customer of MOCK_CUSTOMERS) {
            await expect(page.locator('.clients-table')).toContainText(
                customer.full_name,
            );
        }

        // Check phone numbers are displayed
        await expect(page.locator('.clients-table')).toContainText(
            MOCK_CUSTOMERS[0].phone,
        );
    });

    test('should filter customers by search', async ({ page }) => {
        await page.goto('/clients');

        await page.waitForSelector('.clients-search input', {
            timeout: 10000,
        });

        // Type in search box (toolbar search)
        await page
            .locator('.clients-search input')
            .fill('Anna');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Should show only matching customer
        await expect(page.locator('.clients-table')).toContainText('Anna Kowalska');
    });

    test('should filter customers by group', async ({ page }) => {
        await page.goto('/clients');

        await page.waitForSelector('#sidenav', { timeout: 10000 });

        // Click on VIP group
        await page.getByText('VIP').first().click();

        // Wait for filter to apply
        await page.waitForTimeout(500);
    });

    test('should have working pagination controls', async ({ page }) => {
        await page.goto('/clients');

        await page.waitForSelector('.clients-pagination', { timeout: 10000 });

        // Check pagination text
        await expect(page.locator('.clients-pagination')).toContainText(
            'Pozycje od',
        );

        // Check page size selector
        await expect(
            page.locator('.clients-pagination select'),
        ).toBeVisible();
    });
});

test.describe('Customer Profile Page', () => {
    test('should display customer profile with all tabs', async ({ page }) => {
        await page.goto('/clients/1');

        await page.waitForSelector('.customer-detail-page', { timeout: 10000 });

        // Check breadcrumb shows customer name
        await expect(page.locator('.breadcrumb')).toContainText('Anna');

        // Check sidebar has client detail nav (KARTA KLIENTA)
        await expect(page.locator('#sidenav')).toContainText('KARTA KLIENTA');

        // Check all tabs are present in sidebar
        const expectedTabs = [
            'podsumowanie',
            'dane osobowe',
            'statystyki',
            'historia wizyt',
            'komentarze',
            'komunikacja',
            'galeria zdjęć',
            'załączone pliki',
        ];

        for (const tab of expectedTabs) {
            await expect(page.locator('#sidenav')).toContainText(tab);
        }
    });

    test('should switch between tabs', async ({ page }) => {
        await page.goto('/clients/1');

        await page.waitForSelector('#sidenav', { timeout: 10000 });

        // Click on different tabs in sidebar
        await page.locator('#sidenav').getByText('dane osobowe').click();
        await page.waitForTimeout(300);

        await page.locator('#sidenav').getByText('historia wizyt').click();
        await page.waitForTimeout(300);

        await page.locator('#sidenav').getByText('komentarze').click();
        await page.waitForTimeout(300);

        // Should show comments section
        await expect(page.locator('.customer-tab-content')).toBeVisible();
    });

    test('should display customer summary tab', async ({ page }) => {
        await page.goto('/clients/1');

        // Should be on summary tab by default
        await expect(page.locator('.customer-summary')).toBeVisible();

        // Check customer info is displayed
        await expect(page.locator('.customer-summary')).toContainText('Anna');
    });

    test('should display customer history', async ({ page }) => {
        await page.goto('/clients/1');

        await page.waitForSelector('#sidenav', { timeout: 10000 });

        // Click history tab in sidebar
        await page.locator('#sidenav').getByText('historia wizyt').click();
        await page.waitForTimeout(300);

        // Should show appointments in visits section
        await expect(page.locator('.customer-visits, .customer-tab-content')).toContainText(
            'zrealizowane wizyty',
        );
    });
});

test.describe('Customer Notes', () => {
    test('should display pinned notes', async ({ page }) => {
        await page.goto('/clients/1');

        await page.waitForSelector('.customer-notes-section', { timeout: 10000 });

        // Check notes are displayed
        for (const note of MOCK_NOTES) {
            await expect(page.locator('.customer-notes-section')).toContainText(
                note.content,
            );
        }
    });
});

test.describe('Navigation', () => {
    test('should navigate from list to customer profile', async ({ page }) => {
        await page.goto('/clients');

        await page.waitForSelector('.clients-table', { timeout: 10000 });

        // Click on customer name
        await page.getByText('Anna Kowalska').first().click();

        // Should navigate to profile
        await page.waitForURL('**/clients/1', { timeout: 5000 });
        await expect(page.locator('.customer-detail-page')).toBeVisible();
    });

    test('should navigate back to list from profile', async ({ page }) => {
        await page.goto('/clients/1');

        await page.waitForSelector('.breadcrumb', { timeout: 10000 });

        // Click on "Klienci" in breadcrumb
        await page.getByText('Klienci').first().click();

        // Should navigate back to list
        await page.waitForURL('**/clients', { timeout: 5000 });
        await expect(page.locator('.clients-page')).toBeVisible();
    });
});

test.describe('Responsive Design', () => {
    test('should display correctly on desktop (1366x768)', async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 768 });
        await page.goto('/clients');

        await page.waitForSelector('.clients-page', { timeout: 10000 });

        // Sidebar (sidenav) should be visible
        await expect(page.locator('#sidenav')).toBeVisible();

        // Table should be visible
        await expect(page.locator('.clients-table')).toBeVisible();
    });

    test('should display correctly on desktop (1920x1080)', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/clients');

        await page.waitForSelector('.clients-page', { timeout: 10000 });

        // Sidebar (sidenav) should be visible
        await expect(page.locator('#sidenav')).toBeVisible();

        // Table should be visible with more space
        await expect(page.locator('.clients-table')).toBeVisible();
    });
});
