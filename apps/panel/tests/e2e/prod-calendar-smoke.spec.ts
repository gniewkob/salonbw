import { test, expect } from '@playwright/test';

const REQUIRED_LOGIN_ENV = [
    'PANEL_LOGIN_EMAIL',
    'PANEL_LOGIN_PASSWORD',
] as const;
const missingLoginEnv = REQUIRED_LOGIN_ENV.filter((name) => !process.env[name]);
const LOGIN_URL_RE = /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/;

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

async function login(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    for (let attempt = 0; attempt < 4; attempt += 1) {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle').catch(() => null);

        if (!LOGIN_URL_RE.test(page.url())) {
            return;
        }

        const emailInput = page.locator(
            'input[name="email"], input[type="email"], input[placeholder*="Email"], input[aria-label*="Email"]',
        );
        const passwordInput = page.locator(
            'input[name="password"], input[type="password"], input[placeholder*="Password"], input[aria-label*="Password"]',
        );

        await emailInput.first().waitFor({ state: 'visible', timeout: 20_000 });
        await emailInput.first().fill(email);
        await passwordInput.first().fill(password);

        await Promise.all([
            page
                .waitForNavigation({ waitUntil: 'networkidle' })
                .catch(() => null),
            page.click(
                'button[type="submit"], button:has-text("Sign in"), button:has-text("Zaloguj"), button:has-text("Zaloguj się")',
            ),
        ]);

        if (!LOGIN_URL_RE.test(page.url())) {
            return;
        }

        const throttled = await page
            .locator('text=Too Many Requests, text=ThrottlerException')
            .first()
            .isVisible()
            .catch(() => false);
        if (throttled) {
            await page.waitForTimeout(35_000);
            continue;
        }
        await page.waitForTimeout(1000);
    }

    await expect(page).not.toHaveURL(LOGIN_URL_RE);
}

async function resolveCustomerId(page: any): Promise<number> {
    const hintedRaw = process.env.PANEL_SMOKE_CUSTOMER_ID;
    if (hintedRaw) {
        const hinted = Number(hintedRaw);
        if (!Number.isFinite(hinted) || hinted <= 0) {
            throw new Error(
                `Invalid PANEL_SMOKE_CUSTOMER_ID=${hintedRaw}. Expected a positive integer.`,
            );
        }
        return hinted;
    }

    await page.goto('/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => null);
    await expect(page).not.toHaveURL(LOGIN_URL_RE);

    const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href') || ''),
    );
    for (const href of hrefs) {
        const match = href.match(/\/(?:customers|clients)\/(\d+)(?:[/?#]|$|\/)/);
        if (!match) continue;
        const id = Number(match[1]);
        if (Number.isFinite(id) && id > 0) {
            return id;
        }
    }

    throw new Error(
        'No valid customer ID found on /customers. Set PANEL_SMOKE_CUSTOMER_ID or ensure at least one customer exists.',
    );
}

test.describe('PROD smoke: calendar compat migration', () => {
    test.setTimeout(180_000);

    test.skip(
        missingLoginEnv.length > 0,
        `Skipped: missing required login env (${missingLoginEnv.join(', ')})`,
    );

    test('calendar uses salonbw asset aliases and avoids graphql 201 compat errors', async ({
        page,
    }) => {
        const graphqlStatuses: number[] = [];
        const compatAssetErrors: string[] = [];
        const consoleErrors: string[] = [];

        page.on('response', (response) => {
            const url = response.url();
            if (url.includes('/graphql')) {
                graphqlStatuses.push(response.status());
            }
        });

        page.on('requestfailed', (request) => {
            const url = request.url();
            if (
                url.includes('/salonbw-calendar/') ||
                url.includes('/salonbw-vendor/')
            ) {
                compatAssetErrors.push(
                    `${request.method()} ${url} :: ${request.failure()?.errorText ?? 'unknown'}`,
                );
            }
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await login(page);
        await page.goto('/calendar');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(8000);

        await expect(
            page.locator('.fc-toolbar.fc-header-toolbar'),
        ).toBeVisible();
        await expect(page.locator('#mainnav')).toBeVisible();

        const runtime = await page.evaluate(() => ({
            salonbwConfig: typeof window.SalonBWConfig !== 'undefined',
            versumConfig: typeof window.VersumConfig !== 'undefined',
            sameRef:
                typeof window.SalonBWConfig !== 'undefined' &&
                window.SalonBWConfig === window.VersumConfig,
            salonbwAssetRefs: Array.from(
                document.querySelectorAll('link[href], script[src]'),
            )
                .map((el) => el.getAttribute('href') || el.getAttribute('src'))
                .filter((value): value is string => Boolean(value))
                .filter((value) => value.includes('/salonbw-')),
            versumAssetRefs: Array.from(
                document.querySelectorAll('link[href], script[src]'),
            )
                .map((el) => el.getAttribute('href') || el.getAttribute('src'))
                .filter((value): value is string => Boolean(value))
                .filter((value) => value.includes('/versum-')),
        }));

        expect(runtime.salonbwConfig).toBe(true);
        expect(runtime.versumConfig).toBe(true);
        expect(runtime.sameRef).toBe(true);
        expect(runtime.salonbwAssetRefs.length).toBeGreaterThan(0);
        expect(runtime.versumAssetRefs.length).toBe(0);
        expect(compatAssetErrors).toEqual([]);
        expect(graphqlStatuses).toContain(200);
        expect(graphqlStatuses).not.toContain(201);
        expect(
            consoleErrors.filter((entry) =>
                entry.includes('Unhandled response status error'),
            ),
        ).toEqual([]);
    });

    test('calendar reception renders insights panel without crash', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="calendar-page"]'),
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="reception-insights-panel"]'),
        ).toBeVisible();
    });

    test('legacy calendar-next route redirects to canonical calendar route', async ({
        page,
    }) => {
        await login(page);
        await page.goto('/calendar-next?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(page).toHaveURL(/\/calendar\?view=reception$/);
        await expect(
            page.locator('[data-testid="reception-insights-panel"]'),
        ).toBeVisible();
    });

    test('employee calendar smoke: render, archive toggle, readonly archive, deep-link and status action', async ({
        page,
    }) => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayDate = `${yyyy}-${mm}-${dd}`;

        const calendarEvents = [
            {
                id: 9101,
                type: 'appointment',
                title: 'Wizyta aktywna',
                startTime: `${todayDate}T09:00:00.000Z`,
                endTime: `${todayDate}T09:45:00.000Z`,
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 7101,
                clientName: 'Klient Aktywny',
                serviceId: 1101,
                serviceName: 'Strzyżenie',
                status: 'scheduled',
            },
            {
                id: 9102,
                type: 'appointment',
                title: 'Wizyta archiwalna',
                startTime: `${todayDate}T10:00:00.000Z`,
                endTime: `${todayDate}T10:45:00.000Z`,
                employeeId: 2,
                employeeName: 'Anna',
                clientId: 7102,
                clientName: 'Klient Archiwum',
                serviceId: 1102,
                serviceName: 'Koloryzacja',
                status: 'completed',
            },
        ];

        let statusMutations = 0;
        const statusPayloads: Array<{ id: string; status: string }> = [];

        await page.route('**/api/calendar/events**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    events: calendarEvents,
                    employees: [{ id: 2, name: 'Anna' }],
                    dateRange: { start: todayDate, end: todayDate },
                }),
            });
        });

        await page.route('**/api/customers/statistics/batch**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    items: [
                        { customerId: 7101, statistics: { noShowVisits: 0 } },
                        { customerId: 7102, statistics: { noShowVisits: 0 } },
                    ],
                }),
            });
        });

        await page.route('**/api/appointments/*/status', async (route) => {
            statusMutations += 1;
            const url = route.request().url();
            const idMatch = url.match(/\/appointments\/(\d+)\/status/);
            const body = route.request().postDataJSON() as
                | { status?: string }
                | undefined;
            statusPayloads.push({
                id: idMatch?.[1] ?? '',
                status: body?.status ?? '',
            });
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: Number(idMatch?.[1] ?? 0),
                    status: body?.status ?? 'scheduled',
                }),
            });
        });

        await login(page);
        await page.goto('/calendar?view=employee');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="calendar-page"]'),
        ).toBeVisible();
        await expect(page.getByLabel('Pokaż archiwalne')).toBeVisible();
        await expect(page.locator('text=Klient Aktywny')).toBeVisible();
        await expect(page.locator('text=Klient Archiwum')).toHaveCount(0);

        const activeStartButton = page
            .locator('tr', { hasText: 'Klient Aktywny' })
            .getByRole('button', { name: 'Rozpocznij' });
        await expect(activeStartButton).toBeVisible();
        await activeStartButton.click();
        await expect
            .poll(() => statusMutations, { timeout: 20_000 })
            .toBeGreaterThan(0);
        expect(statusPayloads.some((item) => item.status === 'in_progress')).toBe(
            true,
        );

        const activeOpenButton = page
            .locator('tr', { hasText: 'Klient Aktywny' })
            .getByRole('button', { name: 'Otwórz' });
        await activeOpenButton.click();
        await expect(page).toHaveURL(/\/calendar\?.*appointmentId=9101/);

        await page.getByLabel('Pokaż archiwalne').check();
        await expect(page.locator('text=Klient Archiwum')).toBeVisible();
        await expect(page.locator('text=Klient Aktywny')).toHaveCount(0);
        await expect(
            page.locator('tr', { hasText: 'Klient Archiwum' }),
        ).toContainText('-');

        const mutationsBeforeArchiveClick = statusMutations;
        const archiveOpenButton = page
            .locator('tr', { hasText: 'Klient Archiwum' })
            .getByRole('button', { name: 'Otwórz' });
        await archiveOpenButton.click();
        await expect(page).toHaveURL(/\/calendar\?.*appointmentId=9102/);
        expect(statusMutations).toBe(mutationsBeforeArchiveClick);
    });

    test('calendar reception shows neutral fallback when operational-insights is unavailable', async ({
        page,
    }) => {
        const interceptedInsightsUrls: string[] = [];
        await page.route(
            '**/api/reception/operational-insights**',
            async (route) => {
                interceptedInsightsUrls.push(route.request().url());
                await route.abort('failed');
            },
        );

        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="reception-insights-panel"]'),
        ).toBeVisible();
        await expect(
            page.locator('text=Brak danych dla wybranego zakresu.'),
        ).toBeVisible();
        expect(interceptedInsightsUrls.length).toBeGreaterThan(0);
        expect(
            interceptedInsightsUrls.every((url) =>
                url.includes('/api/reception/operational-insights'),
            ),
        ).toBe(true);
    });

    test('calendar reception CTA updates filters at UI level', async ({
        page,
    }) => {
        const interceptedInsightsUrls: string[] = [];
        await page.route(
            '**/api/reception/operational-insights**',
            async (route) => {
                interceptedInsightsUrls.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        from: '2026-05-01',
                        to: '2026-05-07',
                        summary: {
                            actionsTotal: 20,
                            actionsOnAlerts: 12,
                            alertActionRate: 0.6,
                        },
                        byAction: [
                            {
                                action: 'start_appointment',
                                actionsTotal: 7,
                                actionsOnAlerts: 4,
                                alertActionRate: 0.57,
                            },
                        ],
                        byDay: [
                            {
                                day: '2026-05-06',
                                actionsTotal: 10,
                                actionsOnAlerts: 3,
                                alertActionRate: 0.3,
                            },
                            {
                                day: '2026-05-07',
                                actionsTotal: 10,
                                actionsOnAlerts: 5,
                                alertActionRate: 0.5,
                            },
                        ],
                    }),
                });
            },
        );

        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="reception-insights-panel"]'),
        ).toBeVisible();

        await expect(
            page.locator('button:has-text("Włącz filtr Tylko priorytetowe")'),
        ).toBeVisible();
        await page.click('button:has-text("Włącz filtr Tylko priorytetowe")');
        await expect(page.locator('#reception-priority-filter')).toBeChecked();

        await expect(
            page.locator('button:has-text("Przejdź do wizyt z alertem CRM")'),
        ).toBeVisible();
        await page.click('button:has-text("Przejdź do wizyt z alertem CRM")');
        await expect(page.locator('#reception-alert-filter')).toBeChecked();

        await expect(
            page.locator('button:has-text("Sprawdź wizyty do finalizacji")'),
        ).toBeVisible();
        await page.click('button:has-text("Sprawdź wizyty do finalizacji")');
        await expect(page.locator('#reception-status-filter')).toHaveValue(
            'in_progress',
        );
        await expect(page.locator('#reception-payment-filter')).toHaveValue(
            'to_finalize',
        );
        expect(interceptedInsightsUrls.length).toBeGreaterThan(0);
        expect(
            interceptedInsightsUrls.every((url) =>
                url.includes('/api/reception/operational-insights'),
            ),
        ).toBe(true);
    });

    test('calendar reception renders follow-up candidates/audit and captures follow-up action', async ({
        page,
    }) => {
        const candidatesUrls: string[] = [];
        const auditUrls: string[] = [];
        const capturedFollowUpActions: Array<Record<string, unknown>> = [];

        await page.route('**/api/crm/follow-up-candidates**', async (route) => {
            candidatesUrls.push(route.request().url());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        customerId: 321,
                        appointmentId: 654,
                        reason: 'recent_no_show',
                        priority: 'high',
                        suggestedAction: 'call_customer',
                    },
                ]),
            });
        });

        await page.route(
            '**/api/crm/follow-up-actions?from=**',
            async (route) => {
                auditUrls.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        from: '2026-05-01',
                        to: '2026-05-07',
                        actionsTotal: 4,
                        byAction: [{ action: 'contacted', count: 2 }],
                        byReason: [{ reason: 'recent_no_show', count: 3 }],
                        byDay: [{ day: '2026-05-07', count: 1 }],
                    }),
                });
            },
        );

        await page.route('**/api/crm/follow-up-actions', async (route) => {
            if (route.request().method() !== 'POST') {
                await route.continue();
                return;
            }
            const body = route.request().postDataJSON();
            capturedFollowUpActions.push(body as Record<string, unknown>);
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1,
                    ...body,
                    createdAt: new Date().toISOString(),
                }),
            });
        });

        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="reception-follow-up-panel"]'),
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="reception-follow-up-audit-panel"]'),
        ).toBeVisible();
        await expect(page.locator('text=Klient #321')).toBeVisible();
        await expect(
            page.locator('text=Akcje follow-up łącznie'),
        ).toBeVisible();
        await expect(page.locator('text=4')).toBeVisible();

        await page.click('button:has-text("Oznacz kontakt")');
        await expect(
            page.locator('text=Wykonano: Kontakt wykonany'),
        ).toBeVisible();

        expect(candidatesUrls.length).toBeGreaterThan(0);
        expect(auditUrls.length).toBeGreaterThan(0);
        expect(capturedFollowUpActions.length).toBeGreaterThan(0);
        expect(capturedFollowUpActions[0]?.action).toBe('contacted');
        expect(capturedFollowUpActions[0]?.customerId).toBe(321);
    });

    test('calendar reception shows follow-up candidates fallback when endpoint is unavailable', async ({
        page,
    }) => {
        const interceptedCandidatesUrls: string[] = [];
        await page.route('**/api/crm/follow-up-candidates**', async (route) => {
            interceptedCandidatesUrls.push(route.request().url());
            await route.abort('failed');
        });

        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="reception-follow-up-panel"]'),
        ).toBeVisible();
        await expect(
            page.locator('text=Kandydaci follow-up chwilowo niedostępni.'),
        ).toBeVisible();
        expect(interceptedCandidatesUrls.length).toBeGreaterThan(0);
    });

    test('calendar reception shows follow-up audit fallback when endpoint is unavailable', async ({
        page,
    }) => {
        const interceptedAuditUrls: string[] = [];
        await page.route(
            '**/api/crm/follow-up-actions?from=**',
            async (route) => {
                interceptedAuditUrls.push(route.request().url());
                await route.abort('failed');
            },
        );

        await login(page);
        await page.goto('/calendar?view=reception');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="reception-follow-up-audit-panel"]'),
        ).toBeVisible();
        await expect(
            page.locator('text=Audyt follow-up chwilowo niedostępny.'),
        ).toBeVisible();
        expect(interceptedAuditUrls.length).toBeGreaterThan(0);
    });

    test('follow-up manager view renders and supports manual refresh', async ({
        page,
    }) => {
        const interceptedAuditUrls: string[] = [];
        await page.route(
            '**/api/crm/follow-up-actions?from=**',
            async (route) => {
                interceptedAuditUrls.push(route.request().url());
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        from: '2026-05-01',
                        to: '2026-05-07',
                        actionsTotal: 4,
                        byAction: [{ action: 'contacted', count: 2 }],
                        byReason: [{ reason: 'recent_no_show', count: 3 }],
                        byDay: [{ day: '2026-05-07', count: 1 }],
                    }),
                });
            },
        );

        await login(page);
        await page.goto('/statistics/follow-up');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="follow-up-audit-page"]'),
        ).toBeVisible();
        await expect(page.locator('text=Akcje follow-up łącznie')).toBeVisible();
        await expect(page.locator('text=4')).toBeVisible();

        await page.click('button:has-text("Odśwież")');
        await expect
            .poll(() => interceptedAuditUrls.length, { timeout: 20_000 })
            .toBeGreaterThan(1);
    });

    test('follow-up manager view shows fallback when audit endpoint is unavailable', async ({
        page,
    }) => {
        const interceptedAuditUrls: string[] = [];
        await page.route(
            '**/api/crm/follow-up-actions?from=**',
            async (route) => {
                interceptedAuditUrls.push(route.request().url());
                await route.abort('failed');
            },
        );

        await login(page);
        await page.goto('/statistics/follow-up');
        await page.waitForLoadState('domcontentloaded');

        await expect(
            page.locator('[data-testid="follow-up-audit-page"]'),
        ).toBeVisible();
        await expect(
            page.locator('text=Audyt follow-up chwilowo niedostępny.'),
        ).toBeVisible();
        expect(interceptedAuditUrls.length).toBeGreaterThan(0);
    });

    test('customer follow-up history links appointment to calendar deep link', async ({
        page,
    }) => {
        await login(page);
        const customerId = await resolveCustomerId(page);
        const followUpPath = `/api/crm/customers/${customerId}/follow-up-actions`;
        const followUpEndpoint = `${followUpPath}?limit=10`;
        const followUpUrls: string[] = [];

        await page.route(`**${followUpPath}?limit=10`, async (route) => {
            followUpUrls.push(route.request().url());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    customerId,
                    items: [
                        {
                            id: 7001,
                            appointmentId: 123,
                            action: 'contacted',
                            candidateReason: 'recent_no_show',
                            occurredAt: '2026-05-17T10:00:00.000Z',
                        },
                    ],
                }),
            });
        });

        await page.goto(`/customers/${customerId}?tab_name=events_history`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle').catch(() => null);
        await expect(page).not.toHaveURL(LOGIN_URL_RE);

        await expect(
            page.locator('text=Ostatnie działania follow-up'),
        ).toBeVisible();
        const appointmentLink = page.getByRole('link', { name: '#123' });
        await expect(appointmentLink).toBeVisible();
        await expect(appointmentLink).toHaveAttribute(
            'href',
            '/calendar?appointmentId=123',
        );

        await appointmentLink.click();
        await expect(page).toHaveURL(/\/calendar\?appointmentId=123$/);
        expect(followUpUrls).toContain(expect.stringContaining(followUpEndpoint));
    });
});
