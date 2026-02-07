import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests for Customers Module
 * Compares our implementation with Versum reference screenshots
 */

const VIEWPORTS = [
    { name: 'desktop-1366', width: 1366, height: 768 },
    { name: 'desktop-1920', width: 1920, height: 1080 },
];

// Setup auth for all tests
const setupAuth = async (page: any) => {
    await page.addInitScript(() => {
        localStorage.setItem(
            'auth',
            JSON.stringify({
                token: 'mock-token',
                user: { id: 1, name: 'Test User', role: 'admin' },
            }),
        );
    });
};

// Setup API mocks
const setupMocks = async (page: any) => {
    // Mock customers list API - Versum format
    await page.route('**/api/customers**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                items: [
                    {
                        id: 1,
                        name: 'Marzena Adamska',
                        fullName: 'Marzena Adamska',
                        firstName: 'Marzena',
                        lastName: 'Adamska',
                        email: 'marzena@example.com',
                        phone: '+48 691 433 821',
                        gender: 'female',
                        lastVisitDate: '2026-01-10T11:00:00.000+01:00',
                        createdAt: '2017-08-23T10:00:00.000+01:00',
                        smsConsent: true,
                        emailConsent: true,
                        gdprConsent: true,
                        groups: [],
                        tags: [
                            { id: 1, name: 'RODO', color: '#ff0000' },
                            { id: 2, name: 'Sylwester', color: '#00ff00' },
                            { id: 3, name: 'WRACAM', color: '#0000ff' },
                        ],
                    },
                    {
                        id: 2,
                        name: 'Piotr Adamski',
                        fullName: 'Piotr Adamski',
                        firstName: 'Piotr',
                        lastName: 'Adamski',
                        email: 'piotr@example.com',
                        phone: '+48 601 433 822',
                        gender: 'male',
                        lastVisitDate: '2026-01-23T10:45:00.000+01:00',
                        createdAt: '2018-03-15T10:00:00.000+01:00',
                        smsConsent: true,
                        emailConsent: false,
                        gdprConsent: true,
                        groups: [],
                        tags: [],
                    },
                    {
                        id: 3,
                        name: 'Alinka Anczok',
                        fullName: 'Alinka Anczok',
                        firstName: 'Alinka',
                        lastName: 'Anczok',
                        email: 'alinka@example.com',
                        phone: '+48 511 485 955',
                        gender: 'female',
                        lastVisitDate: '2025-12-18T17:30:00.000+01:00',
                        createdAt: '2019-05-20T10:00:00.000+01:00',
                        smsConsent: true,
                        emailConsent: true,
                        gdprConsent: true,
                        groups: [],
                        tags: [],
                    },
                ],
                total: 785,
                page: 1,
                pages: 40,
            }),
        });
    });

    // Mock customer groups API
    await page.route('**/api/customer_groups', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                { id: 1, name: 'VIP', color: '#ff0000', memberCount: 5 },
                { id: 2, name: 'Stały klient', color: '#00ff00', memberCount: 12 },
                { id: 3, name: 'Nowi', color: '#0000ff', memberCount: 3 },
            ]),
        });
    });

    // Mock single customer API
    await page.route('**/api/customers/1', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 1,
                name: 'Marzena Adamska',
                fullName: 'Marzena Adamska',
                firstName: 'Marzena',
                lastName: 'Adamska',
                email: 'marzena@example.com',
                phone: '+48 691 433 821',
                gender: 'female',
                birthDate: null,
                address: null,
                city: null,
                postalCode: null,
                description: null,
                lastVisitDate: '2026-01-10T11:00:00.000+01:00',
                createdAt: '2017-08-23T10:00:00.000+01:00',
                updatedAt: '2026-01-10T11:00:00.000+01:00',
                smsConsent: true,
                emailConsent: true,
                gdprConsent: true,
                gdprConsentDate: '2017-08-23T10:00:00.000+01:00',
                groups: [],
                tags: [
                    { id: 1, name: 'RODO', color: '#ff0000' },
                    { id: 2, name: 'Sylwester', color: '#00ff00' },
                    { id: 3, name: 'WRACAM', color: '#0000ff' },
                ],
            }),
        });
    });

    // Mock customer statistics API
    await page.route('**/api/customers/1/statistics', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                totalVisits: 25,
                completedVisits: 24,
                cancelledVisits: 1,
                noShowVisits: 0,
                totalSpent: 8750.0,
                averageSpent: 365.0,
                lastVisitDate: '2026-01-10T11:00:00.000+01:00',
                firstVisitDate: '2017-08-25T10:00:00.000+01:00',
                upcomingVisits: [
                    {
                        id: 1001,
                        serviceId: 1,
                        serviceName: 'Koloryzacja Ola - włosy średnie',
                        date: '2026-03-06',
                        time: '13:00',
                        employeeId: 1,
                        employeeName: 'Aleksandra Bodora',
                        price: 250.0,
                    },
                ],
            }),
        });
    });

    // Mock customer history API
    await page.route('**/api/customers/1/history', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                items: [
                    {
                        id: 101,
                        date: '2026-01-10T11:00:00.000+01:00',
                        service: { id: 1, name: 'Koloryzacja Ola - włosy długie' },
                        employee: { id: 1, name: 'Aleksandra Bodora', initials: 'AB' },
                        status: 'completed',
                        price: 350.0,
                    },
                    {
                        id: 102,
                        date: '2025-10-13T09:30:00.000+01:00',
                        service: { id: 1, name: 'Koloryzacja Ola - włosy długie' },
                        employee: { id: 1, name: 'Aleksandra Bodora', initials: 'AB' },
                        status: 'completed',
                        price: 350.0,
                    },
                    {
                        id: 103,
                        date: '2025-07-04T13:00:00.000+01:00',
                        service: { id: 2, name: 'Rozjaśnianie włosów Ola - włosy długie' },
                        employee: { id: 1, name: 'Aleksandra Bodora', initials: 'AB' },
                        status: 'completed',
                        price: 380.0,
                    },
                ],
                total: 24,
                limit: 3,
                offset: 0,
            }),
        });
    });
};

for (const viewport of VIEWPORTS) {
    test.describe(`Customers Visual Tests - ${viewport.name}`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } });

        test.beforeEach(async ({ page }) => {
            await setupAuth(page);
            await setupMocks(page);
        });

        test('customers list page matches Versum reference', async ({ page }) => {
            await page.goto('/clients');
            
            // Wait for page to fully load
            await page.waitForSelector('.clients-page', { timeout: 10000 });
            await page.waitForSelector('.clients-table tbody tr', { timeout: 10000 });
            
            // Small delay to ensure all elements are rendered
            await page.waitForTimeout(500);
            
            // Take screenshot
            await expect(page).toHaveScreenshot(`customers-list-${viewport.name}.png`, {
                fullPage: false,
                threshold: 0.2,
            });
        });

        test('customer profile page matches Versum reference', async ({ page }) => {
            await page.goto('/clients/1');
            
            // Wait for page to fully load
            await page.waitForSelector('.customer-detail-page', { timeout: 10000 });
            await page.waitForSelector('.customer-summary', { timeout: 10000 });
            
            // Small delay to ensure all elements are rendered
            await page.waitForTimeout(500);
            
            // Take screenshot
            await expect(page).toHaveScreenshot(`customers-profile-${viewport.name}.png`, {
                fullPage: false,
                threshold: 0.2,
            });
        });
    });
}
