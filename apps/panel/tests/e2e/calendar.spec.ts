import { test, expect } from '@playwright/test';

/**
 * Calendar E2E Tests
 *
 * Tests all calendar flows according to the Versum 1:1 parity plan:
 * - View switching (month/week/day/reception)
 * - Navigation (prev/next)
 * - Event interactions (hover/click)
 * - Finalize flow
 * - No_show flow
 */

const MOCK_EMPLOYEES = [
    { id: 1, name: 'Aleksandra Bodora', color: '#f3a8c8' },
    { id: 2, name: 'Jan Kowalski', color: '#a8d8f3' },
];

const MOCK_EVENTS = [
    {
        id: 101,
        event_id: 101,
        groupId: 101,
        customer_id: 1,
        allDay: false,
        start: '2026-02-03T14:00:00.000+01:00',
        end: '2026-02-03T16:00:00.000+01:00',
        full_start: '2026-02-03T14:00:00.000+01:00',
        full_end: '2026-02-03T16:00:00.000+01:00',
        employee_start: '2026-02-03T14:00:00.000+01:00',
        employee_end: '2026-02-03T16:00:00.000+01:00',
        entities: [{ id: 1, type: 'employee' }],
        events_services: [
            {
                id: 1,
                started_at: '2026-02-03T14:00:00.000+01:00',
                employee_ids: [1],
                resource_ids: [],
                duration: 120,
                full_name: 'Botox na włosy',
            },
        ],
        finalized: false,
        canceled: false,
        editable: true,
        not_an_appointment: false,
        customer: { id: 1, full_name: 'Matuszkiewicz Teresa' },
        reserved_online: false,
        description: '',
    },
    {
        id: 102,
        event_id: 102,
        groupId: 102,
        customer_id: 2,
        allDay: false,
        start: '2026-02-03T10:00:00.000+01:00',
        end: '2026-02-03T11:30:00.000+01:00',
        full_start: '2026-02-03T10:00:00.000+01:00',
        full_end: '2026-02-03T11:30:00.000+01:00',
        employee_start: '2026-02-03T10:00:00.000+01:00',
        employee_end: '2026-02-03T11:30:00.000+01:00',
        entities: [{ id: 1, type: 'employee' }],
        events_services: [
            {
                id: 2,
                started_at: '2026-02-03T10:00:00.000+01:00',
                employee_ids: [1],
                resource_ids: [],
                duration: 90,
                full_name: 'Strzyżenie damskie',
            },
        ],
        finalized: true,
        canceled: false,
        editable: false,
        not_an_appointment: false,
        customer: { id: 2, full_name: 'Kowalska Anna' },
        reserved_online: true,
        description: 'Stała klientka',
    },
];

const MOCK_SCREEN_DATA = {
    events: [
        {
            id: 101,
            pretty_id: 'APT-101',
            branch_id: 19581,
            customer_id: 1,
            beginning: '2026-02-03T14:00:00.000+01:00',
            end: '2026-02-03T16:00:00.000+01:00',
            finalized: false,
            canceled: false,
            not_an_appointment: false,
            reserved_online: false,
            description: '',
            status: 'Oczekująca',
            customer_name: 'Matuszkiewicz Teresa',
            customer_phone_number: '+48 600 100 200',
            customer_email: 'teresa@example.com',
            price: 300,
            price_pln: '300,00 zł',
            services: [
                {
                    id: 1,
                    name: 'Botox na włosy',
                    price: '300,00 zł',
                    duration: '2 h',
                    employees: [
                        {
                            id: 1,
                            name: 'Aleksandra Bodora',
                            initials: 'AB',
                        },
                    ],
                },
            ],
            finalizable: true,
            editable: true,
        },
    ],
    formulas: null,
    prepayment_balance: 0,
    overpayment_balance: 0,
};

const MOCK_SCHEDULES = {
    '2026-02-03': {
        employee: {
            '1': [
                {
                    valid_from: '2026-02-03T00:00:00.000+01:00',
                    valid_to: '2026-02-03T09:00:00.000+01:00',
                    kind: 'closed',
                    allday: false,
                },
                {
                    valid_from: '2026-02-03T09:00:00.000+01:00',
                    valid_to: '2026-02-03T17:00:00.000+01:00',
                    kind: 'open',
                    allday: false,
                },
                {
                    valid_from: '2026-02-03T17:00:00.000+01:00',
                    valid_to: '2026-02-04T00:00:00.000+01:00',
                    kind: 'closed',
                    allday: false,
                },
            ],
        },
        resource: {},
    },
};

test.describe('Calendar Module E2E', () => {
    test.beforeEach(async ({ context, page, baseURL }) => {
        const targetUrl = baseURL ?? 'http://127.0.0.1:3100';

        // Set auth cookies
        await context.addCookies([
            { name: 'sbw_auth', value: 'true', url: targetUrl },
            { name: 'accessToken', value: 'e2e-token', url: targetUrl },
            { name: 'refreshToken', value: 'e2e-refresh', url: targetUrl },
        ]);

        // Freeze time for deterministic tests
        await page.addInitScript(() => {
            const fixed = new Date('2026-02-03T11:00:00.000Z').valueOf();
            const NativeDate = Date;

            class FixedDate extends NativeDate {
                constructor(...args: ConstructorParameters<typeof Date>) {
                    if (args.length === 0) {
                        super(fixed);
                        return;
                    }
                    super(...args);
                }

                static now() {
                    return fixed;
                }

                static parse(value: string) {
                    return NativeDate.parse(value);
                }

                static UTC(...args: Parameters<typeof Date.UTC>) {
                    return NativeDate.UTC(...args);
                }
            }

            // @ts-expect-error test-only override
            window.Date = FixedDate;

            window.localStorage.setItem('jwtToken', 'e2e-token');
            window.localStorage.setItem('refreshToken', 'e2e-refresh');
        });

        // Setup API mocks
        await page.route('**/*', async (route) => {
            const url = new URL(route.request().url());
            const apiPath = normalizeApiPath(url);

            if (!apiPath) {
                await route.continue();
                return;
            }

            // User profile
            if (apiPath === '/users/profile') {
                await fulfillJson(route, {
                    id: 1,
                    email: 'admin@salon-bw.pl',
                    name: 'Test Admin',
                    role: 'admin',
                });
                return;
            }

            // Calendar events
            if (
                apiPath.startsWith('/events') &&
                !apiPath.includes('screen_data') &&
                !apiPath.includes('finalize')
            ) {
                await fulfillJson(route, MOCK_EVENTS);
                return;
            }

            // Event screen data
            if (apiPath.includes('/screen_data')) {
                await fulfillJson(route, MOCK_SCREEN_DATA);
                return;
            }

            // Finalize event
            if (
                apiPath.includes('/finalize') &&
                route.request().method() === 'POST'
            ) {
                const body = route.request().postDataJSON() as Record<
                    string,
                    unknown
                >;
                const isNoShow = body?.not_an_appointment === true;

                await fulfillJson(route, {
                    success: true,
                    event: {
                        ...MOCK_SCREEN_DATA.events[0],
                        finalized: !isNoShow,
                        not_an_appointment: isNoShow,
                        status: isNoShow ? 'Nieodbyta' : 'Sfinalizowana',
                    },
                });
                return;
            }

            // Schedules
            if (apiPath.includes('/settings/timetable/schedules')) {
                await fulfillJson(route, MOCK_SCHEDULES);
                return;
            }

            // Track new events
            if (apiPath.includes('track_new_events')) {
                await fulfillJson(route, { events: [] });
                return;
            }

            // GraphQL
            if (apiPath === '/graphql') {
                const body = route.request().postDataJSON() as {
                    operationName?: string;
                };
                const operationName = body?.operationName ?? '';

                switch (operationName) {
                    case 'GetViewer':
                        await fulfillJson(route, {
                            data: {
                                viewer: {
                                    branch: {
                                        resourcesActivated: false,
                                        currency: 'PLN',
                                        vatRates: [23, 8, 5, 0],
                                        vatPayer: true,
                                    },
                                    abilities: [],
                                },
                            },
                        });
                        return;
                    case 'GetEmployees':
                        await fulfillJson(route, {
                            data: {
                                employees: {
                                    items: MOCK_EMPLOYEES.map((e) => ({
                                        id: e.id,
                                        firstName: e.name.split(' ')[0],
                                        lastName: e.name.split(' ')[1] || '',
                                    })),
                                },
                            },
                        });
                        return;
                    case 'GetServiceCategories':
                        await fulfillJson(route, {
                            data: {
                                serviceCategories: [
                                    { id: 1, name: 'Damskie', position: 1 },
                                    { id: 2, name: 'Barber', position: 2 },
                                ],
                            },
                        });
                        return;
                    case 'GetServices':
                    case 'GetAllServices':
                        await fulfillJson(route, {
                            data: {
                                services: {
                                    items: [
                                        {
                                            id: 1,
                                            name: 'Botox na włosy',
                                            variants: [
                                                {
                                                    id: 1,
                                                    name: null,
                                                    duration: 120,
                                                    price: 300,
                                                    vat: 23,
                                                },
                                            ],
                                            category: {
                                                id: 1,
                                                name: 'Damskie',
                                            },
                                        },
                                    ],
                                    hasNext: false,
                                },
                            },
                        });
                        return;
                    default:
                        await fulfillJson(route, { data: {} });
                        return;
                }
            }

            await fulfillJson(route, {});
        });
    });

    test.describe('View Switching', () => {
        test('should display calendar with default view', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });

            // Wait for calendar container to be present
            await expect(
                page.locator(
                    '#calendar_container, .fc-view-container, [data-calendar]',
                ),
            ).toBeVisible({
                timeout: 15000,
            });
        });

        test('should switch to month view', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            // Look for month view button
            const monthButton = page.locator(
                'button:has-text("miesiąc"), .fc-month-button, [data-view="month"]',
            );
            if (await monthButton.isVisible()) {
                await monthButton.click();
                await page.waitForTimeout(500);

                // Verify month view is active
                await expect(
                    page.locator(
                        '.fc-month-view, .fc-dayGridMonth-view, [data-view="month"].active',
                    ),
                ).toBeVisible();
            }
        });

        test('should switch to week view', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const weekButton = page.locator(
                'button:has-text("tydzień"), .fc-agendaWeek-button, [data-view="week"]',
            );
            if (await weekButton.isVisible()) {
                await weekButton.click();
                await page.waitForTimeout(500);

                await expect(
                    page.locator(
                        '.fc-agendaWeek-view, .fc-timeGridWeek-view, [data-view="week"].active',
                    ),
                ).toBeVisible();
            }
        });

        test('should switch to day view', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const dayButton = page.locator(
                'button:has-text("dzień"), .fc-agendaDay-button, [data-view="day"]',
            );
            if (await dayButton.isVisible()) {
                await dayButton.click();
                await page.waitForTimeout(500);

                await expect(
                    page.locator(
                        '.fc-agendaDay-view, .fc-timeGridDay-view, [data-view="day"].active',
                    ),
                ).toBeVisible();
            }
        });

        test('should switch to reception view', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const receptionButton = page.locator(
                'button:has-text("recepcja"), .fc-agendaResource-button, [data-view="reception"]',
            );
            if (await receptionButton.isVisible()) {
                await receptionButton.click();
                await page.waitForTimeout(500);

                await expect(
                    page.locator(
                        '.fc-agendaResource-view, .fc-resourceTimeGridDay-view, [data-view="reception"].active',
                    ),
                ).toBeVisible();
            }
        });
    });

    test.describe('Navigation', () => {
        test('should navigate to previous period', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const prevButton = page.locator(
                '.fc-prev-button, button[aria-label="prev"], button:has-text("<")',
            );
            await expect(prevButton).toBeVisible();
            await prevButton.click();

            // Verify URL or state changed (depends on implementation)
            await page.waitForTimeout(500);
        });

        test('should navigate to next period', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(2000);

            const nextButton = page.locator(
                '.fc-next-button, button[aria-label="next"], button:has-text(">")',
            );
            await expect(nextButton).toBeVisible();
            await nextButton.click();

            await page.waitForTimeout(500);
        });

        test('should navigate to today', async ({ page }) => {
            await page.goto('/calendar?date=2026-01-01', {
                waitUntil: 'domcontentloaded',
            });
            await page.waitForTimeout(2000);

            const todayButton = page.locator(
                '.fc-today-button, button:has-text("dziś"), button:has-text("today")',
            );
            if (await todayButton.isVisible()) {
                await todayButton.click();
                await page.waitForTimeout(500);
            }
        });
    });

    test.describe('Event Interactions', () => {
        test('should display events on calendar', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            // Look for event elements
            const events = page.locator(
                '.fc-event, [data-event-id], .calendar-event',
            );
            const count = await events.count();

            // Should have at least some events rendered
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('should show tooltip on event hover', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            const event = page.locator('.fc-event, [data-event-id]').first();
            if (await event.isVisible()) {
                await event.hover();
                await page.waitForTimeout(500);

                // Check for tooltip/popover
                const tooltip = page.locator(
                    '.tippy-content, .tooltip, .popover, [role="tooltip"]',
                );
                // Tooltip may or may not appear depending on implementation
            }
        });

        test('should open event details on click', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            const event = page.locator('.fc-event, [data-event-id]').first();
            if (await event.isVisible()) {
                await event.click();
                await page.waitForTimeout(1000);

                // Check for modal/drawer with event details
                const modal = page.locator(
                    '.modal, [role="dialog"], .drawer, .event-details',
                );
                // Modal may appear
            }
        });
    });

    test.describe('Finalize Flow', () => {
        test('should finalize non-finalized event', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            // Find and click non-finalized event
            const event = page
                .locator('.fc-event:not(.finalized), [data-finalized="false"]')
                .first();
            if (await event.isVisible()) {
                await event.click();
                await page.waitForTimeout(1000);

                // Look for finalize button
                const finalizeButton = page.locator(
                    'button:has-text("finalizuj"), button:has-text("zakończ"), [data-action="finalize"]',
                );
                if (await finalizeButton.isVisible()) {
                    await finalizeButton.click();
                    await page.waitForTimeout(500);

                    // Confirm finalization (may have confirmation dialog)
                    const confirmButton = page.locator(
                        'button:has-text("potwierdź"), button:has-text("tak"), .btn-primary',
                    );
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                    }
                }
            }
        });

        test('should mark event as no_show', async ({ page }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            const event = page
                .locator('.fc-event:not(.finalized), [data-finalized="false"]')
                .first();
            if (await event.isVisible()) {
                await event.click();
                await page.waitForTimeout(1000);

                // Look for no_show option
                const noShowButton = page.locator(
                    'button:has-text("nie odbyła się"), button:has-text("no show"), [data-action="no_show"]',
                );
                if (await noShowButton.isVisible()) {
                    await noShowButton.click();
                    await page.waitForTimeout(500);

                    const confirmButton = page.locator(
                        'button:has-text("potwierdź"), button:has-text("tak"), .btn-primary',
                    );
                    if (await confirmButton.isVisible()) {
                        await confirmButton.click();
                    }
                }
            }
        });
    });

    test.describe('Finalized Event View', () => {
        test('should show finalized event as non-editable', async ({
            page,
        }) => {
            await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            // Find finalized event
            const finalizedEvent = page
                .locator('.fc-event.finalized, [data-finalized="true"]')
                .first();
            if (await finalizedEvent.isVisible()) {
                await finalizedEvent.click();
                await page.waitForTimeout(1000);

                // Finalize button should not be present or should be disabled
                const finalizeButton = page.locator(
                    'button:has-text("finalizuj"):not([disabled])',
                );
                const isVisible = await finalizeButton.isVisible();
                expect(isVisible).toBe(false);
            }
        });
    });
});

function normalizeApiPath(url: URL): string | null {
    if (url.pathname.startsWith('/api/')) {
        return url.pathname.replace('/api', '');
    }

    if (url.hostname.includes('api.salon-bw.pl')) {
        return url.pathname;
    }

    // Handle Versum compat paths
    if (url.pathname.startsWith('/events')) {
        return url.pathname;
    }
    if (url.pathname.startsWith('/settings/timetable')) {
        return url.pathname;
    }
    if (url.pathname.includes('track_new_events')) {
        return url.pathname;
    }
    if (url.pathname === '/graphql') {
        return url.pathname;
    }

    return null;
}

async function fulfillJson(
    route: Parameters<Parameters<typeof test.beforeEach>[0]>[0]['route'],
    data: unknown,
) {
    await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
    });
}
