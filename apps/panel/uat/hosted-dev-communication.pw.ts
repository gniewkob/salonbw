/**
 * Hosted DEV communication UAT against ONE freshly created synthetic customer.
 * No customer ID supplied by a user, no provider sends, no production origin.
 * The independent workflow checks FreeBSD DEV DB/role and outbound gates first.
 * Runs without screenshots, traces, videos, raw request/response-body logging.
 */
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const PANEL_RELEASE = '0c6832de6c29f2d68ce6874a1b1308860ca02eab';
const API_RELEASE = '6cc6a925a5ea4188ff4bf763dd8f3947ec73e963';
const STAFF_EMAIL = 'stylist@salonbw.example.test';
const NON_DELIVERABLE_PHONE_A = '+48000000000';
const NON_DELIVERABLE_PHONE_B = '+48000000001';

type Scope = {
    purpose: string;
    channel: string;
    status: string;
    contactMatches?: boolean | null;
    currentTextVersion: string;
};
type Preference = {
    communicationType: string;
    channel: string;
    preferred: boolean;
    effectiveAllowed: boolean;
    reason: string;
};
type CommunicationState = {
    consents: Scope[];
    preferences: Preference[];
    receiveNotifications: boolean;
};
type History = {
    items: Array<{ eventType: string; purpose: string | null; channel: string }>;
    total: number;
};

function preflight(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.GITHUB_REF !==
            'refs/heads/test/v18-communication-hosted-dev-uat-20261109' ||
        process.env.COMMUNICATION_DEV_TEST_ACK !== 'SYNTHETIC_ONLY' ||
        process.env.PLAYWRIGHT_BASE_URL !== PANEL ||
        process.env.DEV_ACCESS_USER !== 'uat' ||
        !process.env.DEV_ACCESS_PASSWORD ||
        process.env.E2E_ADMIN_EMAIL !== STAFF_EMAIL ||
        !process.env.E2E_ADMIN_PASSWORD
    ) {
        throw new Error('BLOCKED: DEV UAT origin, identity or explicit scope mismatch');
    }
}

async function verifyRelease(page: Page): Promise<void> {
    const panel = await page.request.get(PANEL + '/__release.json', {
        maxRedirects: 0,
        headers: { 'Cache-Control': 'no-cache' },
    });
    expect(panel.status(), 'panel DEV release').toBe(200);
    const panelInfo = (await panel.json()) as { sha?: string; environment?: string };
    expect(panelInfo.sha).toBe(PANEL_RELEASE);
    expect(panelInfo.environment).toBe('development');

    const basic = 'Basic ' + Buffer.from(
        process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD,
    ).toString('base64');
    const api = await page.request.get(API + '/healthz', {
        maxRedirects: 0,
        headers: { Authorization: basic, 'Cache-Control': 'no-cache' },
    });
    expect(api.status(), 'API DEV health').toBe(200);
    expect(api.headers()['x-salonbw-release'], 'API exact release').toBe(API_RELEASE);
    const health = (await api.json()) as {
        status?: string;
        services?: { database?: { status?: string } };
    };
    expect(health.status).toBe('ok');
    expect(health.services?.database?.status).toBe('ok');
}

async function csrf(page: Page) {
    const token = await page.evaluate(() => {
        const cookies = document.cookie.split('; ');
        const pair = cookies.find((entry) => {
            const name = entry.split('=')[0];
            return name === 'XSRF-TOKEN' || name.endsWith('_XSRF-TOKEN');
        });
        return pair?.slice(pair.indexOf('=') + 1);
    });
    if (!token) throw new Error('BLOCKED: CSRF session marker missing');
    return { 'X-XSRF-TOKEN': token };
}

function findPreference(state: CommunicationState, type: string, channel: string) {
    const preference = state.preferences.find(
        (entry) => entry.communicationType === type && entry.channel === channel,
    );
    expect(preference, 'expected communication preference').toBeDefined();
    return preference!;
}

function findConsent(state: CommunicationState, purpose: string, channel: string) {
    const scope = state.consents.find(
        (entry) => entry.purpose === purpose && entry.channel === channel,
    );
    expect(scope, 'expected consent scope').toBeDefined();
    return scope!;
}

test.describe('Hosted DEV audited communication — synthetic-only', () => {
    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
            origin: PANEL,
        },
    });
    test.describe.configure({ retries: 0 });

    test('exact release, audited grant/withdraw, recipient mismatch, browser 1366/390, cleanup', async ({
        page,
    }) => {
        test.setTimeout(180_000);
        preflight();
        await verifyRelease(page);

        const email = 'communication-uat-' + randomUUID() + '@salonbw.example.test';
        let customerId: number | null = null;
        let cleanupError: string | null = null;
        let xsrf: Record<string, string> = {};

        // Only browser sign-in can POST; all other browser-origin mutations
        // are blocked. The deliberate APIRequestContext writes below use
        // hard-coded endpoints scoped to a verified newly created fixture.
        await page.route('**/*', async (route) => {
            const request = route.request();
            const method = request.method().toUpperCase();
            if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                await route.continue();
                return;
            }
            const url = new URL(request.url());
            if (
                method === 'POST' &&
                ((url.origin === PANEL && url.pathname === '/api/auth/login') ||
                    (url.origin === API && url.pathname === '/auth/login'))
            ) {
                await route.continue();
                return;
            }
            await route.abort('blockedbyclient');
        });

        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill(STAFF_EMAIL);
        await page.locator('input[name="password"]').fill(
            process.env.E2E_ADMIN_PASSWORD!,
        );
        await page.getByRole('button', { name: 'Zaloguj się' }).click();
        await expect
            .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
            .not.toBe('/auth/login');
        const profile = await page.request.get(PANEL + '/api/users/profile', {
            maxRedirects: 0,
        });
        expect(profile.status()).toBe(200);
        const actor = (await profile.json()) as {
            email?: string;
            role?: string;
            isSystemAdmin?: boolean;
        };
        expect(actor.email).toBe(STAFF_EMAIL);
        expect(actor.role).toBe('admin');
        expect(actor.isSystemAdmin).toBe(false);
        xsrf = await csrf(page);

        try {
            const create = await page.request.post(PANEL + '/api/customers', {
                maxRedirects: 0,
                headers: xsrf,
                data: {
                    firstName: 'Communication',
                    lastName: 'Synthetic UAT',
                    email,
                    phone: NON_DELIVERABLE_PHONE_A,
                    notifyPanel: true,
                    smsConsent: false,
                    whatsappConsent: false,
                    emailConsent: false,
                    gdprConsent: false,
                    termsConsent: false,
                },
            });
            expect(create.status(), 'create isolated synthetic customer').toBe(201);
            const created = (await create.json()) as { id?: number; email?: string };
            expect(created.email).toBe(email);
            expect(Number.isSafeInteger(created.id) && Number(created.id) > 0).toBe(true);
            customerId = created.id!;
            const base = PANEL + '/api/customers/' + customerId;
            const stateUrl = base + '/communication-preferences';
            const stateResponse = await page.request.get(stateUrl);
            expect(stateResponse.status()).toBe(200);
            const initial = (await stateResponse.json()) as CommunicationState;
            expect(findConsent(initial, 'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP').status)
                .not.toBe('GRANTED');
            expect(
                findPreference(initial, 'BOOKING_CONFIRMATION', 'WHATSAPP').effectiveAllowed,
            ).toBe(false);

            const catalogResponse = await page.request.get(
                PANEL + '/api/communication-consents/catalog',
            );
            expect(catalogResponse.status()).toBe(200);
            const catalog = (await catalogResponse.json()) as {
                consentScopes: Array<{ purpose: string; channel: string; textVersion: string }>;
            };
            const version = (purpose: string, channel: string) => {
                const text = catalog.consentScopes.find(
                    (s) => s.purpose === purpose && s.channel === channel,
                );
                expect(text).toBeDefined();
                return text!.textVersion;
            };
            const uniqueHeaders = () => ({
                ...xsrf,
                'Idempotency-Key': randomUUID(),
            });
            const grant = await page.request.post(base + '/consents/grant', {
                maxRedirects: 0,
                headers: uniqueHeaders(),
                data: {
                    purpose: 'WHATSAPP_APPOINTMENT_UPDATES',
                    channel: 'WHATSAPP',
                    consentTextVersion: version('WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP'),
                    source: 'IN_PERSON_SIGNED_FORM',
                    evidenceReference: 'SYNTHETIC-DEV-UAT-ONLY',
                },
            });
            expect(grant.status(), 'synthetic WhatsApp opt-in grant').toBe(201);
            const granted = (await grant.json()) as CommunicationState;
            expect(
                findConsent(granted, 'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP').status,
            ).toBe('GRANTED');

            const update = await page.request.put(stateUrl, {
                maxRedirects: 0,
                headers: uniqueHeaders(),
                data: {
                    changes: [{
                        communicationType: 'BOOKING_CONFIRMATION',
                        channel: 'WHATSAPP',
                        enabled: true,
                    }],
                },
            });
            expect(update.status(), 'enable preference with recorded opt-in').toBe(200);
            const preferred = (await update.json()) as CommunicationState;
            expect(
                findPreference(preferred, 'BOOKING_CONFIRMATION', 'WHATSAPP').preferred,
            ).toBe(true);
            expect(
                findPreference(preferred, 'BOOKING_CONFIRMATION', 'WHATSAPP')
                    .effectiveAllowed,
            ).toBe(true);

            const changePhone = await page.request.put(base, {
                maxRedirects: 0,
                headers: xsrf,
                data: { phone: NON_DELIVERABLE_PHONE_B },
            });
            expect(changePhone.status(), 'synthetic number change').toBe(200);
            const mismatchResponse = await page.request.get(stateUrl);
            expect(mismatchResponse.status()).toBe(200);
            const mismatch = (await mismatchResponse.json()) as CommunicationState;
            expect(
                findConsent(mismatch, 'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP')
                    .contactMatches,
            ).toBe(false);
            expect(
                findPreference(mismatch, 'BOOKING_CONFIRMATION', 'WHATSAPP')
                    .effectiveAllowed,
            ).toBe(false);

            const smsGrant = await page.request.post(base + '/consents/grant', {
                maxRedirects: 0,
                headers: uniqueHeaders(),
                data: {
                    purpose: 'DIRECT_MARKETING',
                    channel: 'SMS',
                    consentTextVersion: version('DIRECT_MARKETING', 'SMS'),
                    source: 'IN_PERSON_SIGNED_FORM',
                    evidenceReference: 'SYNTHETIC-DEV-UAT-ONLY',
                },
            });
            expect(smsGrant.status(), 'marketing SMS grant').toBe(201);
            const withdraw = await page.request.post(
                base + '/consents/withdraw-direct-marketing',
                {
                    maxRedirects: 0,
                    headers: uniqueHeaders(),
                    data: { channels: ['SMS', 'WHATSAPP', 'EMAIL'] },
                },
            );
            expect(withdraw.status(), 'atomic marketing withdrawal').toBe(201);
            const withdrawn = (await withdraw.json()) as CommunicationState;
            for (const channel of ['SMS', 'WHATSAPP', 'EMAIL']) {
                expect(findConsent(withdrawn, 'DIRECT_MARKETING', channel).status)
                    .toBe('WITHDRAWN');
            }
            expect(
                findConsent(withdrawn, 'WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP')
                    .status,
            ).toBe('GRANTED');
            expect(
                findPreference(withdrawn, 'BOOKING_CONFIRMATION', 'WHATSAPP')
                    .effectiveAllowed,
            ).toBe(false);

            const historyResponse = await page.request.get(
                base + '/consent-history?page=1&limit=25',
            );
            expect(historyResponse.status(), 'audit history endpoint').toBe(200);
            const history = (await historyResponse.json()) as History;
            expect(history.total).toBeGreaterThanOrEqual(5);
            expect(
                history.items.some(
                    (item) =>
                        item.eventType === 'GRANTED' &&
                        item.purpose === 'WHATSAPP_APPOINTMENT_UPDATES',
                ),
            ).toBe(true);
            expect(
                history.items.some(
                    (item) =>
                        item.eventType === 'WITHDRAWN' &&
                        item.purpose === 'DIRECT_MARKETING',
                ),
            ).toBe(true);

            for (const width of [1366, 390]) {
                await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
                await page.goto('/studio-v18/customers/' + customerId);
                await expect(page.getByTestId('v18-customer-profile')).toBeVisible();
                await page.getByRole('button', { name: 'Edytuj klienta' }).click();
                const editor = page.getByTestId('v18-customer-editor');
                await expect(editor).toBeVisible();
                await editor.getByRole('tab', { name: 'Komunikacja' }).click();
                const operational = editor.getByTestId('v18-operational-settings');
                await operational.locator('summary').first().click();
                await expect(
                    editor.getByTestId('whatsapp-appointment-optin'),
                ).toContainText('Numer zmieniony');
                await operational
                    .getByText('Ustawienia poszczególnych wiadomości')
                    .click();
                await expect(
                    operational.getByText(/Preferencja włączona, wysyłka zablokowana/),
                ).toBeVisible();
                expect(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth <=
                            window.innerWidth + 1,
                    ),
                ).toBe(true);
            }
            console.log('HOSTED_DEV_COMMUNICATION_UAT_FUNCTIONAL=PASS (no provider sends)');
        } finally {
            if (customerId !== null) {
                const base = PANEL + '/api/customers/' + customerId;
                try {
                    const check = await page.request.get(base, { maxRedirects: 0 });
                    if (
                        check.status() !== 200 ||
                        ((await check.json()) as { email?: string }).email !== email
                    ) {
                        cleanupError = 'synthetic fixture identity not verified';
                    } else {
                        const remove = await page.request.delete(base, {
                            headers: xsrf,
                            maxRedirects: 0,
                        });
                        if (remove.status() !== 200) {
                            cleanupError = 'synthetic fixture deletion failed: HTTP ' +
                                remove.status();
                        }
                    }
                } catch {
                    cleanupError = 'synthetic fixture cleanup request failed';
                }
            }
            if (cleanupError) {
                throw new Error('HOSTED_DEV_COMMUNICATION_UAT_CLEANUP_FAILED: ' +
                    cleanupError);
            }
        }
    });
});
