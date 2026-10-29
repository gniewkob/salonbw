/**
 * Hosted DEV HTTP authorization smoke, read-only after synthetic admin login.
 *
 * This is NOT a 403/409 booking-mutation test. The only permitted
 * mutation is one synthetic DEV login form submission. Other browser
 * mutation routes are blocked before the page loads; API probes use GET only.
 *
 * No tokens, passwords, cookies, response bodies or raw traces are logged.
 */
import { test, expect, type Page } from '@playwright/test';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const LANDING = 'https://dev.salon-bw.pl';
const RELEASE = '0a6e3fa42adeb85302a8202a02d823f79bf62af5';
const SYNTHETIC_SALON_ADMIN = 'stylist@salonbw.example.test';

type LoginObservation = {
    status: number;
    basicChallenge: boolean;
    target: 'panel-proxy' | 'direct-api';
};

function loginTarget(url: string): LoginObservation['target'] | null {
    const requestUrl = new URL(url);
    if (requestUrl.origin === PANEL && requestUrl.pathname === '/api/auth/login') {
        return 'panel-proxy';
    }
    if (requestUrl.origin === API && requestUrl.pathname === '/auth/login') {
        return 'direct-api';
    }
    return null;
}

function loginFailureReason(observation: LoginObservation): string {
    const { status, basicChallenge } = observation;
    if (status === 401 && basicChallenge) {
        return 'DEV Basic gateway rejected the request';
    }
    if (status === 401) {
        return 'application authentication rejected (credential or account state; not proven)';
    }
    if (status === 429) return 'rate limit active; do not retry';
    if (status === 400 || status === 422) return 'application login payload rejected';
    if (status === 403) return 'access denied by gateway or application policy';
    if (status >= 500) return 'upstream/proxy/server error';
    return 'unexpected login response; investigate without retrying';
}

/**
 * One UI submission, no fallback credentials and no automatic test retries.
 * Capture only the HTTP status and whether the 401 was a Basic challenge.
 * Avoid logging headers, response bodies, cookies, credentials or request data.
 * Other browser mutations are blocked from before the login page loads.
 */
async function loginOnceForHostedUat(
    page: Page,
    email: string,
    password: string,
): Promise<number> {
    const observations: LoginObservation[] = [];
    let blockedMutations = 0;

    await page.route('**/*', async (route) => {
        const request = route.request();
        const method = request.method().toUpperCase();
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            await route.continue();
            return;
        }
        if (method === 'POST' && loginTarget(request.url()) !== null) {
            // Only the synthetic authentication session may be written.
            await route.continue();
            return;
        }
        blockedMutations += 1;
        await route.abort('blockedbyclient');
    });

    page.on('response', (response) => {
        const request = response.request();
        if (request.method().toUpperCase() !== 'POST') return;
        const target = loginTarget(request.url());
        if (!target) return;
        observations.push({
            status: response.status(),
            basicChallenge:
                response.status() === 401 &&
                /^Basic\b/i.test(response.headers()['www-authenticate'] ?? ''),
            target,
        });
    });

    await page.goto('/auth/login');
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await emailField.fill(email);
    await passwordField.fill(password);
    await page.locator('button[type="submit"]').click();

    // A Basic challenge can precede a retried request with the same single
    // browser form submission. Never classify the intermediate 401 as final.
    try {
        await expect.poll(
            () => observations.some((entry) => !entry.basicChallenge),
            { timeout: 12_000, message: 'Waiting for the final login HTTP status' },
        ).toBe(true);
    } catch {
        const challenge = observations.some((entry) => entry.basicChallenge);
        throw new Error(
            challenge
                ? 'Hosted DEV login BLOCKED: Basic challenge without a final application response'
                : 'Hosted DEV login BLOCKED: no login HTTP response observed after one UI submission',
        );
    }
    const final = observations.filter((entry) => !entry.basicChallenge).at(-1)!;
    if (final.status !== 200) {
        throw new Error(
            'Hosted DEV login BLOCKED: ' +
                final.target + ' returned HTTP ' + final.status + ' — ' +
                loginFailureReason(final) + '; no second login attempt',
        );
    }

    // Login HTTP 200 alone does not prove that React loaded a valid session.
    // If the redirect fails, the caller's protected profile GET still decides.
    await expect(
        page,
        'Login POST returned 200, but navigation to the authenticated panel did not complete',
    ).not.toHaveURL(/\/auth\/login(?:[?#]|$)/, { timeout: 10_000 });

    return blockedMutations;
}


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

        const landingResponse = await page.request.get(LANDING + '/__release.json', {
            headers: { 'Cache-Control': 'no-cache' },
            maxRedirects: 0,
        });
        expect(landingResponse.status()).toBe(200);
        const landingRelease = await landingResponse.json() as {
            sha?: string;
            environment?: string;
        };
        expect(landingRelease.sha).toBe(RELEASE);
        expect(landingRelease.environment).toBe('development');

        const apiHealth = await page.request.get(API + '/healthz', {
            headers: { 'Cache-Control': 'no-cache' },
            maxRedirects: 0,
        });
        expect(apiHealth.status()).toBe(200);
        expect(apiHealth.headers()['x-salonbw-release']).toBe(RELEASE);
        expect(apiHealth.headers()['x-robots-tag']).toContain('noindex');
        const health = await apiHealth.json() as {
            status?: string;
            services?: { database?: string; smtp?: string; instagram?: string };
        };
        expect(health.status).toBe('ok');
        expect(health.services?.database).toBe('ok');
        expect(health.services?.smtp).toBe('skipped');
        expect(health.services?.instagram).toBe('skipped');

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

        // One synthetic login attempt; browser route guard blocks all
        // non-login mutations both before and after authentication.
        // The preceding anonymous 401 proves the API protection is active.
        const blockedMutations = await loginOnceForHostedUat(
            page,
            process.env.E2E_ADMIN_EMAIL!,
            process.env.E2E_ADMIN_PASSWORD!,
        );

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
            'HOSTED DEV READ-ONLY AUTH PASS: exact panel/landing/API release, DEV outbound skipped, anonymous GET 401, authenticated GET 200, restricted GET 403, 0 booking writes',
        );
        if (blockedMutations > 0) {
            console.log('Browser mutation attempts blocked:', blockedMutations);
        }
    });
});
