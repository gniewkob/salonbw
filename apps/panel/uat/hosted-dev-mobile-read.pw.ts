/**
 * Optional, non-mutating hosted DEV mobile view verification.
 *
 * Login itself is real and may create an auth session. Immediately after
 * login, every non-GET/HEAD/OPTIONS request is blocked client-side. No
 * appointment create/update/cancel request reaches the hosted API.
 * It does not test booking writes, server-side 409 or appointment state mutations.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../tests/e2e/helpers/auth';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const RELEASE = 'd017aebd3f6d0e95100b52d7cdc286507a959892';
const LOCAL_SLOT = '2026-11-04T09:00';

test.describe('Hosted DEV — mobile calendar drawer read-only UAT', () => {
    test.describe.configure({ retries: 0 });
    test.use({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
        },
    });

    test('opens a mobile drawer and retains an explicit local time without any booking POST', async ({ page }) => {
        test.setTimeout(120_000);
        for (const name of [
            'DEV_ACCESS_USER',
            'DEV_ACCESS_PASSWORD',
            'E2E_ADMIN_EMAIL',
            'E2E_ADMIN_PASSWORD',
        ]) {
            if (!process.env[name]) {
                throw new Error('Mobile DEV UAT blocked: missing ' + name);
            }
        }
        if (process.env.PLAYWRIGHT_BASE_URL !== PANEL) {
            throw new Error('Refusing mobile UAT outside the exact hosted DEV panel');
        }

        const panel = await page.request.get(PANEL + '/__release.json');
        expect(panel.status()).toBe(200);
        const panelRelease = await panel.json() as {
            sha?: string;
            environment?: string;
        };
        expect(panelRelease.sha).toBe(RELEASE);
        expect(panelRelease.environment).toBe('development');

        const api = await page.request.get(API + '/healthz', {
            headers: { 'Cache-Control': 'no-cache' },
        });
        expect(api.status()).toBe(200);
        expect(api.headers()['x-salonbw-release']).toBe(RELEASE);
        const health = await api.json() as {
            status?: string;
            services?: { database?: { status?: string } };
        };
        expect(health.status).toBe('ok');
        expect(health.services?.database?.status).toBe('ok');

        // Authenticate using an existing synthetic DEV salon administrator.
        // Do not log cookies, headers, tokens, or raw application responses.
        await loginAsAdmin(page);

        const forbiddenMutations: string[] = [];
        const appointmentMutations: string[] = [];
        await page.route('**/*', async (route) => {
            const request = route.request();
            const method = request.method().toUpperCase();
            if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                const path = new URL(request.url()).pathname;
                forbiddenMutations.push(method + ' ' + path);
                if (/\/appointments(?:\/|$)/.test(path)) {
                    appointmentMutations.push(method + ' ' + path);
                }
                await route.abort('blockedbyclient');
                return;
            }
            await route.continue();
        });

        await page.goto('/calendar?view=day', {
            waitUntil: 'domcontentloaded',
        });
        await expect(page.getByTestId('calendar-page')).toBeVisible({
            timeout: 30_000,
        });

        const launch = page.getByRole('button', {
            name: 'Nowa wizyta',
            exact: true,
        });
        await expect(launch).toBeVisible({ timeout: 15_000 });
        await launch.click();

        const drawer = page.getByRole('dialog', { name: 'Appointment' });
        await expect(drawer).toBeVisible();
        await expect(drawer).toHaveAttribute(
            'data-salonbw-drawer-mobile',
            'true',
        );

        const box = await drawer.boundingBox();
        expect(box, 'mobile dialog must be measurable').not.toBeNull();
        expect(box!.x, 'drawer left edge').toBeGreaterThanOrEqual(-2);
        expect(box!.x + box!.width, 'drawer right edge')
            .toBeLessThanOrEqual(392);

        const field = page.locator('#appointment-start-time');
        await expect(field).toBeVisible();
        await field.fill(LOCAL_SLOT);
        await expect(field).toHaveValue(LOCAL_SLOT);

        await drawer.getByRole('button', { name: 'Zamknij' }).click();
        await expect(drawer).not.toBeVisible();

        expect(
            appointmentMutations,
            'No appointment create/change/cancel attempt is allowed',
        ).toEqual([]);
        console.log(
            'HOSTED DEV MOBILE READ-ONLY UAT PASS: exact release, 390px drawer, Warsaw local time, 0 appointment writes',
        );
        if (forbiddenMutations.length > 0) {
            console.log(
                'Non-read requests blocked by design:',
                forbiddenMutations.length,
            );
        }
    });
});
