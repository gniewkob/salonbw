import { expect, test, type Page } from '@playwright/test';

// All API records, permissions and contact identifiers below are synthetic.
// Hosted DEV/PROD is explicitly excluded: never replay customer data or send
// messages through a real provider in browser QA.
const origin = 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Isolated synthetic browser QA only; hosted environments are forbidden',
);

test.use({
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
});

const customer = {
    id: 99001,
    firstName: 'Klient',
    lastName: 'Syntetyczny',
    name: 'Klient Syntetyczny',
    fullName: 'Klient Syntetyczny',
    phone: '+48000000000',
    email: 'synthetic@example.invalid',
    gdprConsent: true,
    termsConsent: false,
    notifyPanel: true,
    groups: [],
    createdAt: '2026-11-09T09:00:00Z',
    updatedAt: '2026-11-09T09:00:00Z',
};

const preference = (
    channel: 'PANEL' | 'SMS' | 'WHATSAPP' | 'EMAIL',
    preferred: boolean,
    effectiveAllowed: boolean,
    reason: string,
) => ({
    communicationType: 'APPOINTMENT_REMINDER',
    channel,
    communicationClass: 'OPERATIONAL',
    supported: true,
    preferred,
    preferenceSource: 'EXPLICIT',
    consentStatus: 'NOT_APPLICABLE',
    legacyUnverifiedConsent: false,
    effectiveAllowed,
    reason,
});

const consent = (
    purpose: string,
    channel: string,
    status: 'GRANTED' | 'WITHDRAWN' | 'UNKNOWN',
    overrides: Record<string, unknown> = {},
) => ({
    purpose,
    channel,
    label:
        purpose === 'WHATSAPP_APPOINTMENT_UPDATES'
            ? 'WhatsApp — powiadomienia o wizytach'
            : 'Marketing — ' + channel,
    status,
    legacyUnverifiedConsent: false,
    currentTextVersion: 'synthetic-v1',
    recordedAt: status === 'GRANTED' ? '2026-11-09T09:00:00Z' : null,
    effectiveAt: status === 'GRANTED' ? '2026-11-09T09:00:00Z' : null,
    source: status === 'GRANTED' ? 'IN_PERSON_SIGNED_FORM' : null,
    consentTextVersion: status === 'GRANTED' ? 'synthetic-v1' : null,
    evidenceReference: null,
    actorRole: status === 'GRANTED' ? 'admin' : null,
    ...overrides,
});

const state = () => ({
    customerId: 99001,
    receiveNotifications: true,
    contact: { hasPhone: true, hasEmail: true },
    updatedAt: '2026-11-09T09:00:00Z',
    consents: [
        consent('WHATSAPP_APPOINTMENT_UPDATES', 'WHATSAPP', 'GRANTED', {
            contactMatches: false,
        }),
        consent('DIRECT_MARKETING', 'SMS', 'GRANTED'),
        consent('DIRECT_MARKETING', 'WHATSAPP', 'UNKNOWN', {
            legacyUnverifiedConsent: true,
            contactMatches: false,
        }),
        consent('DIRECT_MARKETING', 'EMAIL', 'WITHDRAWN'),
    ],
    preferences: [
        preference('PANEL', false, false, 'PREFERENCE_DISABLED'),
        preference('SMS', true, true, 'OPERATIONAL_ALLOWED'),
        preference('WHATSAPP', true, false, 'WHATSAPP_CONTACT_CHANGED'),
        preference('EMAIL', false, false, 'PREFERENCE_DISABLED'),
    ],
});

const catalog = {
    channels: ['PANEL', 'SMS', 'WHATSAPP', 'EMAIL'],
    types: [
        {
            type: 'APPOINTMENT_REMINDER',
            class: 'OPERATIONAL',
            purpose: null,
            label: 'Przypomnienie o wizycie',
            supportedChannels: ['PANEL', 'SMS', 'WHATSAPP', 'EMAIL'],
        },
    ],
    consentScopes: [
        {
            purpose: 'WHATSAPP_APPOINTMENT_UPDATES',
            channel: 'WHATSAPP',
            label: 'WhatsApp — powiadomienia o wizytach',
            textVersion: 'synthetic-v1',
            text: 'Syntetyczny tekst zgody na komunikaty o wizytach.',
            draft: true,
        },
        ...(['SMS', 'WHATSAPP', 'EMAIL'] as const).map((channel) => ({
            purpose: 'DIRECT_MARKETING',
            channel,
            label: 'Marketing — ' + channel,
            textVersion: 'synthetic-v1',
            text: 'Syntetyczny tekst zgody marketingowej.',
            draft: true,
        })),
    ],
    staffGrantSources: ['IN_PERSON_SIGNED_FORM', 'EMAIL_CONFIRMATION'],
};

const fulfillJson = (value: unknown) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(value),
});

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);

    // Match the existing V18 synthetic tests: browser-local HTTP must not be
    // upgraded by the runtime's production-oriented CSP/HSTS response.
    await page.route('**/studio-v18/customers/99001', async (route) => {
        const response = await route.fetch();
        const headers = response.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\s*;?\s*upgrade-insecure-requests\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response, headers });
    });

    await page.route('**/api/**', async (route) => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        if (route.request().method() !== 'GET') {
            // Any mutation must be explicitly mocked inside its own test.
            await route.fulfill({
                ...fulfillJson({ error: 'Synthetic write not explicitly mocked' }),
                status: 409,
            });
            return;
        }
        if (path === '/api/users/profile') {
            await route.fulfill(
                fulfillJson({
                    id: 1801,
                    name: 'Administrator syntetyczny',
                    email: 'admin@example.invalid',
                    role: 'admin',
                }),
            );
            return;
        }
        if (path === '/api/customers/99001') {
            await route.fulfill(fulfillJson(customer));
            return;
        }
        if (path === '/api/customers/99001/communication-preferences') {
            await route.fulfill(fulfillJson(state()));
            return;
        }
        if (path === '/api/communication-consents/catalog') {
            await route.fulfill(fulfillJson(catalog));
            return;
        }
        if (path === '/api/customers/99001/statistics') {
            await route.fulfill(
                fulfillJson({
                    totalVisits: 0,
                    completedVisits: 0,
                    totalSpent: 0,
                    lastVisitDate: null,
                }),
            );
            return;
        }
        if (path === '/api/customers/99001/consent-history') {
            await route.fulfill(
                fulfillJson({ items: [], total: 0, page: 1, limit: 20, legacyItems: [] }),
            );
            return;
        }
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Synthetic endpoint not populated' }),
        });
    });
});

async function openCommunication(page: Page) {
    await page.goto('/studio-v18/customers/99001');
    await expect(page.getByTestId('v18-customer-profile')).toBeVisible();
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    const editor = page.getByTestId('v18-customer-editor');
    await expect(editor).toBeVisible();
    await editor.getByRole('tab', { name: 'Komunikacja' }).click();
    const settings = editor.getByTestId('v18-operational-settings');
    await settings.locator('summary').first().click();
    await expect(settings).toHaveAttribute('open', '');
    return { editor, settings };
}

test('desktop/mobile: selected WhatsApp is visibly blocked and channel matrix is stable', async ({
    page,
}, testInfo) => {
    const { editor, settings } = await openCommunication(page);
    const messaging = settings.locator('[data-preference-group="MESSAGING"]');

    await expect(messaging).toContainText('wybrane 2/2');
    await expect(messaging).toContainText('dozwolone wg uprawnień 1/2');
    await expect(
        editor.getByTestId('whatsapp-appointment-optin'),
    ).toContainText('Numer zmieniony');

    await settings.getByText('Ustawienia poszczególnych wiadomości').click();
    const whatsapp = settings.getByRole('checkbox', {
        name: 'Przypomnienie o wizycie — WhatsApp',
    });
    await expect(whatsapp).toBeChecked();
    await expect(whatsapp).toBeEnabled();
    await expect(
        settings.locator('[data-delivery-state="blocked"]'),
    ).toContainText('Preferencja włączona, wysyłka zablokowana');

    const gridColumnCount = await whatsapp.locator('xpath=../../..').evaluate(
        (element) =>
            getComputedStyle(element).gridTemplateColumns
                .split(/\s+/)
                .filter(Boolean).length,
    );
    expect(gridColumnCount).toBe(testInfo.project.name === 'desktop-1366' ? 4 : 2);

    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
    ).toBe(true);

    await editor.screenshot({
        path: testInfo.outputPath('v18-synthetic-communication.png'),
    });
});

test('unsaved WhatsApp preference can be cancelled or discarded without a request', async ({
    page,
}) => {
    const writes: string[] = [];
    page.on('request', (request) => {
        if (
            request.method() !== 'GET' &&
            new URL(request.url()).pathname.startsWith('/api/')
        ) {
            writes.push(request.url());
        }
    });
    const { editor, settings } = await openCommunication(page);
    await settings.getByText('Ustawienia poszczególnych wiadomości').click();
    const whatsapp = settings.getByRole('checkbox', {
        name: 'Przypomnienie o wizycie — WhatsApp',
    });
    await whatsapp.uncheck();
    await expect(settings).toContainText('Niezapisana zmiana');
    await expect(editor.getByRole('button', { name: 'Zapisz zmiany' })).toBeVisible();

    await editor
        .getByRole('button', { name: 'Zamknij edycję klienta' })
        .click();
    await expect(
        editor.getByTestId('v18-unsaved-communication-warning'),
    ).toBeVisible();
    await editor.getByRole('button', { name: 'Wróć do edycji' }).click();
    await expect(whatsapp).not.toBeChecked();

    await editor.getByRole('button', { name: 'Anuluj', exact: true }).click();
    await expect(whatsapp).toBeChecked();
    await expect(
        editor.getByRole('button', { name: 'Zapisz zmiany' }),
    ).toHaveCount(0);
    expect(writes).toEqual([]);
});

test('V18 privacy notice is not a GDPR permission; marketing withdrawal has separate scope', async ({
    page,
}) => {
    const withdrawals: unknown[] = [];
    await page.route(
        '**/api/customers/99001/consents/withdraw-direct-marketing',
        async (route) => {
            withdrawals.push(route.request().postDataJSON());
            await route.fulfill(
                fulfillJson({
                    ...state(),
                    consents: state().consents.map((item) =>
                        item.purpose === 'DIRECT_MARKETING' &&
                        item.channel === 'SMS'
                            ? { ...item, status: 'WITHDRAWN' }
                            : item,
                    ),
                }),
            );
        },
    );

    await page.goto('/studio-v18/customers/99001');
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    const editor = page.getByTestId('v18-customer-editor');
    await expect(editor.getByText('Informacje formalne')).toBeVisible();
    await expect(
        editor.getByText('Wyrażam zgodę na przetwarzanie danych osobowych'),
    ).toHaveCount(0);
    await expect(
        editor.getByRole('link', { name: 'Polityce prywatności' }),
    ).toBeVisible();

    await editor.getByRole('tab', { name: 'Komunikacja' }).click();
    const marketing = editor.getByTestId('v18-marketing-settings');
    await marketing.locator('summary').first().click();
    const messaging = marketing.locator('[data-consent-group="MESSAGING"]');
    await expect(messaging).toHaveAttribute('data-consent-state', 'partial');
    await messaging
        .getByRole('button', {
            name: 'Wycofaj oferty i promocje: SMS / WhatsApp',
        })
        .click();
    await page.getByRole('button', { name: 'Wycofaj zgody', exact: true }).click();

    await expect.poll(() => withdrawals.length).toBe(1);
    expect(withdrawals[0]).toMatchObject({
        channels: ['SMS', 'WHATSAPP'],
    });
    // No operational opt-in grant or customer notification call is made.
    expect(JSON.stringify(withdrawals)).not.toContain('WHATSAPP_APPOINTMENT_UPDATES');
});
