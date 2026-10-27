/**
 * DEV-only, no-write browser replay for the appointment drawer date + override.
 *
 * Important: no POST /appointments reaches the host: it is always mocked or
 * aborted. All unrelated mutations are denied after login. This verifies the
 * hosted UI, not a persisted backend booking or a production release gate.
 *
 * Required environment:
 *   PLAYWRIGHT_BASE_URL=https://dev-panel.salon-bw.pl
 *   DEV_ACCESS_USER, DEV_ACCESS_PASSWORD        (DEV Basic Auth)
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD        (synthetic DEV administrator)
 *
 * Intentionally runs only on desktop-1366/mobile-390 (not regression setup).
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../tests/e2e/helpers/auth';

const DEV_PANEL = 'https://dev-panel.salon-bw.pl';
const DEV_API = 'https://dev-api.salon-bw.pl';
const EXPECTED_RELEASE = 'c4399429a7f9a7804161847f79d6d70a64a025d1';
const TARGET_LOCAL = '2026-11-04T09:00';
const TARGET_UTC = '2026-11-04T08:00:00.000Z';

test.describe('Hosted DEV appointment drawer — no-write date/override UAT', () => {
    test.describe.configure({ retries: 0 });
    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
        },
    });

    test('reopening requires explicit date and a fresh admin override', async ({ page }) => {
        test.setTimeout(180_000);
        const required = [
            'DEV_ACCESS_USER',
            'DEV_ACCESS_PASSWORD',
            'E2E_ADMIN_EMAIL',
            'E2E_ADMIN_PASSWORD',
        ];
        const missing = required.filter((name) => !process.env[name]);
        if (missing.length) {
            throw new Error('DEV UAT blocked: missing local environment variables: ' + missing.join(', '));
        }
        if (process.env.PLAYWRIGHT_BASE_URL !== DEV_PANEL) {
            throw new Error('Refusing browser UAT outside the exact DEV panel hostname.');
        }
        const panelResponse = await page.request.get(DEV_PANEL + '/__release.json');
        expect(panelResponse.status(), 'DEV panel release endpoint').toBe(200);
        const panelRelease = await panelResponse.json() as {
            sha?: string; environment?: string;
        };
        expect(panelRelease.sha).toBe(EXPECTED_RELEASE);
        expect(panelRelease.environment).toBe('development');

        const healthResponse = await page.request.get(DEV_API + '/healthz');
        expect(healthResponse.status(), 'DEV API health').toBe(200);
        const health = await healthResponse.json() as {
            release?: string; status?: string; services?: { database?: string };
        };
        expect(health.status).toBe('ok');
        expect(health.release).toBe(EXPECTED_RELEASE);
        expect(health.services?.database).toBe('ok');

        // Authentication is the only real POST allowed, before installing the
        // write-blocker. Never log or attach credentials/cookies to reports.
        await loginAsAdmin(page);

        let postAttempts = 0;
        let allowedSyntheticPosts = 0;
        let conflictChecks = 0;
        let firstSelectedIds: string[] | null = null;
        const rejectedWrites: string[] = [];
        const rejectedPayloads: string[] = [];

        await page.route('**/*', async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            const method = request.method().toUpperCase();

            if (
                method === 'GET' &&
                url.pathname.endsWith('/calendar/conflicts')
            ) {
                const start = url.searchParams.get('startTime');
                // The simulated conflict is only valid for the intended slot.
                if (start !== TARGET_UTC || !url.searchParams.get('employeeId')) {
                    rejectedPayloads.push('conflict query did not contain the expected start/employee');
                    await route.abort('blockedbyclient');
                    return;
                }
                conflictChecks += 1;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        hasConflict: true,
                        conflictingEvents: [{ id: 990000001, title: 'Synthetic DEV collision' }],
                    }),
                });
                return;
            }

            // Mock the only allowed appointment creation. No DB write occurs.
            if (
                method === 'POST' &&
                /^\/(?:api\/)?appointments\/?$/.test(url.pathname) &&
                (url.hostname === 'dev-panel.salon-bw.pl' ||
                    url.hostname === 'dev-api.salon-bw.pl')
            ) {
                postAttempts += 1;
                let data: Record<string, unknown>;
                try {
                    data = request.postDataJSON() as Record<string, unknown>;
                } catch {
                    rejectedPayloads.push('appointment request was not JSON');
                    await route.abort('blockedbyclient');
                    return;
                }
                if (
                    data.startTime !== TARGET_UTC ||
                    data.forceOverlap !== true ||
                    ![data.employeeId, data.clientId, data.serviceId].every(
                        (id) => Number.isInteger(id) && Number(id) > 0,
                    )
                ) {
                    rejectedPayloads.push('appointment payload date/override/IDs mismatch');
                    await route.abort('blockedbyclient');
                    return;
                }
                allowedSyntheticPosts += 1;
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 990000001,
                        startTime: TARGET_UTC,
                        status: 'scheduled',
                    }),
                });
                return;
            }

            if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                // Permit read-only GraphQL queries, never GraphQL mutations.
                if (method === 'POST' && /\/graphql\/?$/.test(url.pathname)) {
                    const data = request.postData() ?? '';
                    if (data && !/\bmutation\b/i.test(data)) {
                        await route.continue();
                        return;
                    }
                }
                // Session refresh may be needed for a read-only calendar.
                if (method === 'POST' && /\/auth\/refresh\/?$/.test(url.pathname)) {
                    await route.continue();
                    return;
                }
                rejectedWrites.push(method + ' ' + url.pathname);
                await route.abort('blockedbyclient');
                return;
            }

            await route.continue();
        });

        await page.goto('/calendar?view=day', { waitUntil: 'domcontentloaded' });
        const open = page.getByRole('button', { name: 'Nowa wizyta', exact: true });
        const drawer = page.getByRole('dialog', { name: 'Appointment' });
        const field = page.locator('#appointment-start-time');

        async function openAndSelectSyntheticFixture() {
            await open.click();
            await expect(drawer).toBeVisible({ timeout: 30_000 });
            // FAB defaults to now() — never trust the previous selection.
            await expect(field).not.toHaveValue(TARGET_LOCAL);
            await field.fill(TARGET_LOCAL);
            await expect(field).toHaveValue(TARGET_LOCAL);

            const employee = page.locator('#appointment-employee');
            await expect(employee.locator('option').nth(1)).toBeAttached({ timeout: 20_000 });
            await employee.selectOption({ index: 1 });

            const service = page.locator('#appointment-service');
            await service.click();
            await page.getByRole('listbox', { name: 'Usługi' })
                .getByRole('option')
                .nth(1)
                .click({ timeout: 20_000 });

            const client = page.locator('#appointment-client');
            await expect(client.locator('option').nth(1)).toBeAttached({ timeout: 20_000 });
            await client.selectOption({ index: 1 });
            const selectedIds = [
                await employee.inputValue(),
                // The service is a searchable text input; match its displayed
                // name across reopen rather than looking for a hidden ID.
                await service.inputValue(),
                await client.inputValue(),
            ];
            if (firstSelectedIds === null) firstSelectedIds = selectedIds;
            else expect(selectedIds).toEqual(firstSelectedIds);
            await expect(page.getByRole('button', { name: 'Utwórz wizytę' }))
                .toBeEnabled({ timeout: 15_000 });
            await expect(field).toHaveValue(TARGET_LOCAL);
        }

        // First opening: conflict warning, zero appointment POST attempts.
        await openAndSelectSyntheticFixture();
        await page.getByRole('button', { name: 'Utwórz wizytę' }).click();
        await expect(drawer.getByRole('alert')).toContainText('Termin koliduje', {
            timeout: 15_000,
        });
        await expect(page.getByRole('button', { name: 'Dodaj mimo to' }))
            .toBeVisible();
        expect(postAttempts).toBe(0);
        expect(conflictChecks).toBe(1);

        // Close after a warning. A new drawer session must not inherit approval.
        await drawer.getByRole('button', { name: 'Zamknij' }).click();
        await expect(drawer).not.toBeVisible();
        await openAndSelectSyntheticFixture();
        await expect(page.getByRole('button', { name: 'Dodaj mimo to' }))
            .toHaveCount(0);
        await page.getByRole('button', { name: 'Utwórz wizytę' }).click();
        await expect(drawer.getByRole('alert')).toContainText('Termin koliduje');
        expect(postAttempts).toBe(0);
        expect(conflictChecks).toBe(2);

        // Second click is locally fulfilled; the real backend sees no POST.
        await page.getByRole('button', { name: 'Dodaj mimo to' }).click();
        await expect.poll(() => postAttempts).toBe(1);
        expect(allowedSyntheticPosts).toBe(1);
        expect(rejectedPayloads).toEqual([]);
        // Other unrelated POSTs may be blocked (e.g. analytics) by design.
        expect(rejectedWrites.filter((entry) => /\/appointments/.test(entry)))
            .toEqual([]);

        console.log('HOSTED DEV DRAWER UAT PASS: release, date, 2 conflict checks, new override, one MOCKED POST');
    });
});
