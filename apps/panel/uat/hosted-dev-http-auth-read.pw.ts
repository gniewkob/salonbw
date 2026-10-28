/**
 * Hosted DEV HTTP authorization smoke, read-only after synthetic admin login.
 *
 * This is NOT a 403/409 booking-mutation test. The only real POST is the
 * authentication performed by loginAsAdmin (which creates a DEV auth session).
 * All subsequent browser mutations are aborted; API probes use GET only.
 *
 * No tokens, passwords, cookies, response bodies or raw traces are logged.
 */
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../tests/e2e/helpers/auth';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const RELEASE = 'c4399429a7f9a7804161847f79d6d70a64a025d1';
const SYNTHETIC_SALON_ADMIN = 'stylist@salonbw.example.test';

test.describe('Hosted DEV — read-only HTTP auth boundary', () => {
    test.describe.configure({ retries: 0 });
    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
        },
    });

    test('confirms live 401 anonymous and 403 restricted system endpoint for a salon admin', async ({
        page,
        playwright,
    }) => {
        test.setTimeout(120_000);

        for (const name of [
            'DEV_ACCESS_USER',
            'DEV_ACCESS_PASSWORD',
            'E2E_ADMIN_EMAIL',
            'E2E_ADMIN_PASSWORD',
        ]) {
            if (!process.env[name]) {
                throw new Error('Hosted read-only auth UAT blocked: missing ' + name);
            }
        }
        if (process.env.PLAYWRIGHT_BASE_URL !== PANEL) {
            throw new Error('Hosted auth UAT refused: target must be the exact DEV panel');
        }
        if (process.env.E2E_ADMIN_EMAIL !== SYNTHETIC_SALON_ADMIN) {
            throw new Error('Hosted auth UAT refused: use only the known synthetic DEV salon-admin fixture');
        }

        const releaseResponse = await page.request.get(PANEL + '/__release.json', {
            headers: { 'Cache-Control': 'no-cache' },
            maxRedirects: 0,
        });
        expect(releaseResponse.status()).toBe(200);
        const deployed = await releaseResponse.json() as {
            sha?: string;
            environment?: string;
        };
        expect(deployed.sha).toBe(RELEASE);
        expect(deployed.environment).toBe('development');

        const apiHealth = await page.request.get(API + '/healthz', {
            headers: { 'Cache-Control': 'no-cache' },
            maxRedirects: 0,
        });
        expect(apiHealth.status()).toBe(200);
        expect(apiHealth.headers()['x-salonbw-release']).toBe(RELEASE);
        expect(apiHealth.headers()['x-robots-tag']).toContain('noindex');
        const health = await apiHealth.json() as {
            status?: string;
            services?: { database?: { status?: string } };
        };
        expect(health.status).toBe('ok');
        expect(health.services?.database?.status).toBe('ok');

        // DEV gateway uses Basic auth. The browser account session uses an
        // independent namespaced accessToken HTTP-only cookie; do not mix them.
        const basic = 'Basic ' + Buffer.from(
            process.env.DEV_ACCESS_USER! + ':' + process.env.DEV_ACCESS_PASSWORD!,
            'utf8',
        ).toString('base64');
        const headers = {
            Authorization: basic,
            'Cache-Control': 'no-cache',
        };

        // Isolated APIRequestContext has NO application cookies. Authorization
        // only clears the DEV gateway; JWT protection still must respond 401.
        const anonymous = await playwright.request.newContext({
            ignoreHTTPSErrors: false,
        });
        try {
            const response = await anonymous.get(API + '/users/profile', {
                headers,
                maxRedirects: 0,
            });
            expect(response.headers()['x-salonbw-release']).toBe(RELEASE);
            expect(response.status(), 'JWT-protected profile without session').toBe(401);
            const systemResponse = await anonymous.get(API + '/system/status', {
                headers,
                maxRedirects: 0,
            });
            expect(systemResponse.headers()['x-salonbw-release']).toBe(RELEASE);
            expect(systemResponse.status(), 'system-only endpoint without JWT').toBe(401);
        } finally {
            await anonymous.dispose();
        }

        // The single intentional mutation is synthetic DEV admin login.
        await loginAsAdmin(page);
        // A client-side redirect alone does not prove the server accepted
        // the authentication session. The profile GET below is decisive.
        await expect(page).not.toHaveURL(new RegExp('/auth/login(?:[?#]|$)'));

        let blockedMutations = 0;
        await page.route('**/*', async (route) => {
            const method = route.request().method().toUpperCase();
            if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                blockedMutations += 1;
                await route.abort('blockedbyclient');
                return;
            }
            await route.continue();
        });

        // The DEV backend sets COOKIE_DOMAIN=dev-panel.salon-bw.pl. Therefore
        // a direct browser request to dev-api.salon-bw.pl would lose the JWT.
        // Use the real same-origin Next proxy which forwards this cookie to
        // Nest. Never print JWTs, credentials, cookies, headers or bodies.
        const profileResponse = await page.request.get(PANEL + '/api/users/profile', {
            headers,
            maxRedirects: 0,
        });
        expect(
            profileResponse.status(),
            'synthetic salon-admin GET via panel proxy: 401 requires a cookie/proxy/gateway investigation',
        ).toBe(200);

        // The backend uses AUTH_COOKIE_PREFIX + "accessToken"; DEV scopes
        // it to the panel origin. Test the effective cookie scope, not a
        // hard-coded prefix or the sibling API host.
        const accessCookies = (await page.context().cookies(PANEL)).filter(
            (cookie) =>
                cookie.name !== 'accessToken' &&
                cookie.name.endsWith('accessToken'),
        );
        expect(
            accessCookies.length,
            'Expected exactly one namespaced panel-scoped JWT cookie (names/values withheld)',
        ).toBe(1);
        expect(
            accessCookies[0].httpOnly,
            'JWT cookie must be HTTP-only',
        ).toBe(true);
        expect(
            accessCookies[0].secure,
            'JWT cookie must be Secure on hosted DEV',
        ).toBe(true);
        const apiAccessCookies = (await page.context().cookies(API)).filter(
            (cookie) => cookie.name.endsWith('accessToken'),
        );
        expect(
            apiAccessCookies,
            'JWT cookies scoped to the panel must not be sent to the sibling API hostname',
        ).toHaveLength(0);
        const profile = await profileResponse.json() as {
            email?: string;
            role?: string;
            isSystemAdmin?: boolean;
        };
        expect(profile.email).toBe(SYNTHETIC_SALON_ADMIN);
        expect(profile.role).toBe('admin');
        expect(profile.isSystemAdmin).toBe(false);

        // The deployed controller permits this route only to a *system* admin,
        // so the valid, logged-in *salon* admin must receive real HTTP 403.
        const restricted = await page.request.get(PANEL + '/api/system/status', {
            headers,
            maxRedirects: 0,
        });
        expect(
            restricted.status(),
            'salon administrator must not read the system-only status',
        ).toBe(403);

        // No booking create/update/cancel is attempted anywhere in this spec.
        console.log(
            'HOSTED DEV READ-ONLY AUTH PASS: exact release, anonymous direct API GET 401, authenticated Nest GET 200 via panel proxy, system-only Nest GET 403 via panel proxy, 0 booking writes',
        );
        if (blockedMutations > 0) {
            console.log('Browser mutation attempts blocked:', blockedMutations);
        }
    });
});
