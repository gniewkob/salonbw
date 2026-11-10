import { expect, test, type Page } from '@playwright/test';

/**
 * P0 mobile owner journey. Only localhost and synthetic route-intercepted data.
 * No hosted DEV / PROD app, database, customer records or provider sends.
 */
const origin = 'http://127.0.0.1:3100';
const testDate = '2026-12-09';
const owner = { id: 7, name: 'Aleksandra', role: 'admin', isSystemAdmin: false };
const customer = {
    id: 99001,
    name: 'Klient Syntetyczny',
    fullName: 'Klient Syntetyczny',
    firstName: 'Klient',
    lastName: 'Syntetyczny',
    phone: '+48000000000',
    email: 'synthetic@example.invalid',
};
const service = {
    id: 22,
    name: 'Strzyżenie testowe',
    duration: 45,
    price: 80,
    priceType: 'fixed',
    isActive: true,
    onlineBooking: true,
    sortOrder: 0,
};

type Visit = {
    id: number;
    clientId: number;
    employeeId: number;
    serviceId: number;
    startTime: string;
    endTime: string;
    status: string;
};
type SyntheticState = {
    visits: Visit[];
    writes: Array<{ method: string; path: string; body: Record<string, unknown> }>;
    outsideWrites: string[];
};

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'P0 writes are allowed only against intercepted localhost fixtures',
);

test.use({
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
});

function payload(value: unknown, status = 200) {
    return {
        status,
        contentType: 'application/json',
        body: JSON.stringify(value),
    };
}

function event(visit: Visit) {
    return {
        ...visit,
        type: 'appointment',
        title: service.name,
        employeeName: owner.name,
        clientName: customer.fullName,
        serviceName: service.name,
    };
}

async function installSyntheticBackend(page: Page, state: SyntheticState) {
    await page.route('**/studio-v18/calendar', async (route) => {
        const response = await route.fetch();
        const headers = response.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\s*;?\s*upgrade-insecure-requests\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response, headers });
    });

    await page.route('**/api/**', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        const path = url.pathname;
        const method = req.method();
        const body = req.postDataJSON?.() as Record<string, unknown> | null;
        const json = (value: unknown, status?: number) =>
            route.fulfill(payload(value, status));

        // No network writes are passed through, even if a component attempts
        // an endpoint the fixture does not intentionally implement.
        if (method !== 'GET') {
            state.writes.push({ method, path, body: body ?? {} });
            if (path === '/api/appointments' && method === 'POST') {
                const start = new Date(String(body?.startTime ?? ''));
                if (
                    Number(body?.employeeId) !== owner.id ||
                    Number(body?.clientId) !== customer.id ||
                    Number(body?.serviceId) !== service.id ||
                    !Number.isFinite(start.getTime())
                ) {
                    await json({ message: 'Invalid synthetic booking' }, 400);
                    return;
                }
                const visit: Visit = {
                    id: 99007,
                    clientId: customer.id,
                    employeeId: owner.id,
                    serviceId: service.id,
                    startTime: start.toISOString(),
                    endTime: new Date(start.getTime() + 45 * 60_000).toISOString(),
                    status: 'scheduled',
                };
                state.visits = [visit];
                await json(visit, 201);
                return;
            }
            const match = path.match(/^\/api\/appointments\/99007\/(reschedule|cancel)$/);
            if (match && method === 'PATCH' && state.visits.length === 1) {
                if (match[1] === 'reschedule') {
                    const start = new Date(String(body?.startTime ?? ''));
                    if (!Number.isFinite(start.getTime())) {
                        await json({ message: 'Invalid date' }, 400);
                        return;
                    }
                    state.visits[0] = {
                        ...state.visits[0],
                        startTime: start.toISOString(),
                        endTime: new Date(start.getTime() + 45 * 60_000).toISOString(),
                        status: 'rescheduled_pending',
                    };
                } else {
                    state.visits[0] = { ...state.visits[0], status: 'cancelled' };
                }
                await json(state.visits[0]);
                return;
            }
            state.outsideWrites.push(method + ' ' + path);
            await json({ message: 'Unapproved synthetic mutation' }, 405);
            return;
        }

        if (path === '/api/users/profile') {
            await json({ ...owner, email: 'owner@example.invalid' });
        } else if (path === '/api/calendar/events') {
            await json({
                events: state.visits.map(event),
                employees: [{ id: owner.id, name: owner.name, color: '#62646a' }],
                dateRange: { start: '2026-12-07', end: '2026-12-13' },
            });
        } else if (path === '/api/calendar/conflicts') {
            await json({ hasConflict: false, conflictingEvents: [] });
        } else if (path === '/api/employees') {
            await json([{ id: owner.id, name: owner.name }]);
        } else if (path === '/api/services') {
            await json([service]);
        } else if (path === '/api/customers') {
            await json({
                items: [customer],
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            });
        } else if (path === '/api/customers/99001') {
            await json(customer);
        } else if (path.startsWith('/api/customers/99001/statistics')) {
            await json({
                totalVisits: state.visits.length,
                noShowVisits: 0,
                totalSpent: 0,
                lastVisitDate: null,
            });
        } else if (path.includes('/events-history')) {
            await json({ items: [] });
        } else if (path.includes('customer-tags') || path.includes('customer-groups')) {
            await json([]);
        } else if (path.includes('/alerts')) {
            await json({ alerts: [] });
        } else if (path.includes('/warehouse/sales')) {
            await json({ items: [], total: 0 });
        } else {
            await json({ message: 'No fixture for ' + path }, 404);
        }
    });
}

async function openWeek(page: Page) {
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.getByRole('button', { name: 'Tydzień', exact: true }).click();
    await expect(page.getByTestId('v18-mobile-week-agenda')).toBeVisible();
}

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);
    await page.route('**/*', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (url.origin !== origin && !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
            await route.abort('blockedbyclient');
            return;
        }
        if (url.origin === origin &&
            !url.pathname.startsWith('/api/') &&
            !['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });
});

test('P0 owner mobile: create, client link, reschedule and cancel with no external writes', async ({
    page,
}) => {
    const state: SyntheticState = {
        visits: [],
        writes: [],
        outsideWrites: [],
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();

    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.getByRole('button', { name: 'Nowa wizyta' }).click();

    const create = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(create).toBeVisible();
    await expect(create.getByTestId('v18-single-operator')).toContainText(
        'Aleksandra',
    );
    await expect(create.getByLabel('Pracownik')).toHaveCount(0);
    await create.locator('#appointment-service').click();
    await create.getByRole('option', { name: /Strzyżenie testowe/ }).click();

    await create.getByRole('combobox', { name: 'Szukaj klienta' }).fill('Klient');
    await create.getByRole('option', { name: /Klient Syntetyczny/ }).click();
    await expect(create.getByTestId('v18-selected-customer')).toBeVisible();
    await create.getByRole('button', { name: 'Utwórz wizytę' }).click();

    await expect.poll(() => state.visits.length).toBe(1);
    await expect(create).toBeHidden();
    expect(state.writes.filter((write) => write.method === 'POST')).toHaveLength(1);
    expect(state.writes[0].body).toMatchObject({
        clientId: customer.id,
        employeeId: owner.id,
        serviceId: service.id,
    });
    expect(state.writes[0].body).not.toHaveProperty('forceOverlap');

    await openWeek(page);
    const agenda = page.getByTestId('v18-mobile-week-agenda');
    await expect(agenda).toContainText(customer.fullName);
    const customerLink = agenda.getByRole('link', {
        name: 'Otwórz kartę klienta ' + customer.fullName,
    });
    await expect(customerLink).toHaveAttribute(
        'href',
        '/studio-v18/customers/' + customer.id,
    );
    await customerLink.click();
    await expect(page).toHaveURL(/\/studio-v18\/customers\/99001$/);
    await page.goBack();
    await openWeek(page);

    await page.getByTestId('v18-mobile-week-agenda')
        .getByRole('button', { name: /Otwórz wizytę/ }).click();
    const quick = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await expect(quick).toBeVisible();
    await quick.getByRole('button', { name: 'Otwórz szczegóły' }).click();

    const edit = page.getByRole('dialog', { name: 'Appointment' });
    await expect(edit).toBeVisible();
    await edit.getByLabel('Start wizyty').fill('2026-12-09T15:30');
    await edit.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect.poll(() => state.visits[0]?.status).toBe('rescheduled_pending');
    await expect(edit).toBeHidden();
    expect(state.writes.filter((write) => write.path.endsWith('/reschedule')))
        .toHaveLength(1);

    await expect(agenda).toContainText('Zmiana do potwierdzenia');
    await agenda.getByRole('button', { name: /Otwórz wizytę/ }).click();
    const again = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await again.getByRole('button', { name: 'Anuluj wizytę' }).click();
    const confirm = page.getByRole('dialog', { name: 'Anulować wizytę?' });
    await expect(confirm.getByRole('button', { name: 'Anuluj', exact: true })).toBeFocused();
    await confirm.getByRole('button', { name: 'Anuluj wizytę' }).click();
    await expect.poll(() => state.visits[0]?.status).toBe('cancelled');

    expect(state.writes.map((write) => write.method + ' ' + write.path))
        .toEqual([
            'POST /api/appointments',
            'PATCH /api/appointments/99007/reschedule',
            'PATCH /api/appointments/99007/cancel',
        ]);
    expect(state.outsideWrites).toEqual([]);
});

test('P0 mobile: modal and appointment actions fit 320/375/390px', async ({
    page,
}) => {
    const state: SyntheticState = { visits: [], writes: [], outsideWrites: [] };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');

    for (const width of [390, 375, 320]) {
        await page.setViewportSize({ width, height: 740 });
        await page.getByRole('button', { name: 'Nowa wizyta' }).click();
        const drawer = page.getByRole('dialog', {
            name: 'Rezerwacja wizyty V18',
        });
        await expect(drawer).toBeVisible();
        await expect(drawer.getByRole('button', { name: 'Zamknij' })).toBeVisible();
        expect(await drawer.evaluate(
            (element) => element.getBoundingClientRect().width,
        )).toBeLessThanOrEqual(width + 1);
        expect(await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
        )).toBe(true);
        await drawer.getByRole('button', { name: 'Zamknij' }).click();
        await expect(drawer).toBeHidden();
    }
    expect(state.writes).toHaveLength(0);
});
