import { test, expect, request as playwrightRequest } from '@playwright/test';
import { randomBytes } from 'node:crypto';

const BASE = 'https://dev-panel.salon-bw.pl';
const expectedRelease = 'd017aebd3f6d0e95100b52d7cdc286507a959892';
const basicUser = process.env.DEV_ACCESS_USER ?? '';
const basicPass = process.env.DEV_ACCESS_PASSWORD ?? '';

test.use({
    locale: 'pl-PL',
    timezoneId: 'Europe/Warsaw',
    httpCredentials: { username: basicUser, password: basicPass },
    viewport: { width: 390, height: 844 },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
});

test('synthetic DEV client can log in via browser and open booking and visits', async ({ page }) => {
    test.setTimeout(90_000);
    expect(basicUser).toBe('uat');
    expect(basicPass.length).toBeGreaterThan(0);
    const version = await page.request.get(BASE + '/__release.json');
    expect(version.status()).toBe(200);
    const release = (await version.json()) as { sha?: string; environment?: string };
    expect(release.sha).toBe(expectedRelease);
    expect(release.environment).toBe('development');

    const run = (process.env.GITHUB_RUN_ID ?? '').replace(/[^0-9]/g, '');
    expect(run.length).toBeGreaterThan(5);
    const email = 'uat-client-ui-' + run + '@example.invalid';
    const password = randomBytes(24).toString('base64url') + 'A9!';
    // Registration occurs only against independently checked DEV host. No phone,
    // no external contacts, no marketing consent and no production credentials.
    const isolatedApi = await playwrightRequest.newContext({
        baseURL: BASE,
        httpCredentials: { username: basicUser, password: basicPass },
    });
    try {
        const register = await isolatedApi.post('/api/auth/register', {
            data: {
                email,
                name: 'UAT Browser Client ' + run,
                password,
                gdprConsent: true,
                termsConsent: true,
                smsConsent: false,
                emailConsent: false,
                whatsappConsent: false,
            },
        });
        expect(register.status(), 'synthetic DEV client registration').toBe(201);
    } finally {
        await isolatedApi.dispose();
    }
    console.log('SYNTHETIC_BROWSER_CLIENT_CREATED=PASS');

    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await expect(page, 'client must leave login page after successful session').not.toHaveURL(
        /\/auth\/login(?:\?|$)/,
        { timeout: 20_000 },
    );

    const profile = await page.request.get('/api/users/profile');
    expect(profile.status()).toBe(200);
    const user = (await profile.json()) as { email?: string; role?: string };
    expect(user.email).toBe(email);
    expect(user.role).toBe('client');
    console.log('HOSTED_DEV_CLIENT_BROWSER_LOGIN=PASS');

    await page.goto('/booking', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Wybierz usługę' })).toBeVisible({
        timeout: 15_000,
    });
    await expect(page.locator('.booking-service-card').first()).toBeVisible({ timeout: 15_000 });
    console.log('HOSTED_DEV_CLIENT_BOOKING_WIZARD=PASS');

    await page.goto('/visits', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Moje wizyty' })).toBeVisible({
        timeout: 15_000,
    });
    console.log('HOSTED_DEV_CLIENT_VISITS=PASS');
});
