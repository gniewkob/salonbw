import { expect, test, type Page } from '@playwright/test';
import type { OpeningHoursResponse } from '@/utils/openingHoursCalendar';

/**
 * P0 mobile owner journey. Only localhost and synthetic route-intercepted data.
 * No hosted DEV / PROD app, database, customer records or provider sends.
 */
const origin = 'http://127.0.0.1:3100';
const testDate = '2026-12-09';
const owner = {
    id: 7,
    name: 'Aleksandra',
    role: 'admin',
    isSystemAdmin: false,
};
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
    hours?: OpeningHoursResponse;
    attendanceWarnings?: boolean;
    visits: Visit[];
    writes: Array<{
        method: string;
        path: string;
        body: Record<string, unknown>;
    }>;
    outsideWrites: string[];
};

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'P0 writes are allowed only against intercepted localhost fixtures',
);

test.use({
    // Business schedule and appointment inputs are expressed in Warsaw time.
    timezoneId: 'Europe/Warsaw',
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
                    endTime: new Date(
                        start.getTime() + 45 * 60_000,
                    ).toISOString(),
                    status: 'scheduled',
                };
                state.visits = [visit];
                // Live POST /appointments returns a minimal { id } receipt.
                await json({ id: visit.id }, 201);
                return;
            }
            const match = path.match(
                /^\/api\/appointments\/99007\/(reschedule|cancel)$/,
            );
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
                        endTime: new Date(
                            start.getTime() + 45 * 60_000,
                        ).toISOString(),
                        // Match the real NestJS contract: admin-approved
                        // manual moves retain their current visit status;
                        // ordinary proposals still wait for client acceptance.
                        status:
                            body?.confirmImmediately === true
                                ? state.visits[0].status
                                : 'rescheduled_pending',
                    };
                } else {
                    state.visits[0] = {
                        ...state.visits[0],
                        status: 'cancelled',
                    };
                }
                await json(state.visits[0]);
                return;
            }
            if (
                path === '/api/appointments/99007/status' &&
                method === 'PATCH' &&
                state.visits.length === 1
            ) {
                state.visits[0] = {
                    ...state.visits[0],
                    status: String(body?.status ?? ''),
                };
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
                employees: [
                    { id: owner.id, name: owner.name, color: '#62646a' },
                ],
                dateRange: { start: '2026-12-07', end: '2026-12-13' },
            });
        } else if (path === '/api/calendar/opening-hours') {
            const openEveryDay = [{ open: '00:00', close: '23:59' }];
            await json(state.hours ?? {
                source: 'timetables',
                hours: {
                    mon: openEveryDay, tue: openEveryDay,
                    wed: openEveryDay, thu: openEveryDay,
                    fri: openEveryDay, sat: openEveryDay,
                    sun: openEveryDay,
                },
            });
        } else if (path === '/api/calendar/conflicts') {
            await json({ hasConflict: false, conflictingEvents: [] });
        } else if (
            path === '/api/employees' ||
            path === '/api/calendar/performers'
        ) {
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
        } else if (path === '/api/customers/statistics/batch') {
            // Existing V18 alert adapter consumes only attendance statistics.
            // The original booking/drag tests remain warning-free.
            await json({
                items: [{
                    customerId: customer.id,
                    statistics: {
                        totalVisits: state.visits.length,
                        noShowVisits: state.attendanceWarnings ? 2 : 0,
                        totalSpent: 0,
                        lastVisitDate: null,
                    },
                }],
            });
        } else if (path.startsWith('/api/customers/99001/statistics')) {
            await json({
                totalVisits: state.visits.length,
                noShowVisits: state.attendanceWarnings ? 2 : 0,
                totalSpent: 0,
                lastVisitDate: null,
            });
        } else if (path.includes('/events-history')) {
            await json({ items: [] });
        } else if (
            path.includes('customer-tags') ||
            path.includes('customer-groups')
        ) {
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


async function dragAppointmentToTime(page: Page, time: string) {
    const card = page.locator('.fc-event-draggable').filter({
        hasText: customer.fullName,
    }).first();
    const slot = page.locator(
        `.fc-timegrid-slot[data-time="${time}"]`,
    ).first();
    await expect(card).toBeVisible();
    // A FullCalendar slot can be DOM-visible yet below the viewport after
    // scrolling the source card into view. Playwright's toBeVisible() does
    // not guarantee that a raw mouse drop will hit the rendered calendar.
    await card.scrollIntoViewIfNeeded();
    await slot.scrollIntoViewIfNeeded();
    await expect(slot).toBeVisible();

    const from = await card.boundingBox();
    const to = await slot.boundingBox();
    if (!from || !to) throw new Error('Missing drag or target coordinates');
    const x = from.x + Math.min(from.width / 2, 60);
    const y = from.y + Math.min(from.height / 2, 12);
    const targetY = to.y + to.height / 2;
    const viewport = page.viewportSize();
    if (
        !viewport ||
        x < 0 || x >= viewport.width ||
        y < 0 || y >= viewport.height ||
        targetY < 0 || targetY >= viewport.height
    ) {
        throw new Error(
            `Drag coordinates outside viewport: source=(${x}, ${y}), ` +
            `targetY=${targetY}, viewport=${JSON.stringify(viewport)}`,
        );
    }

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, targetY, { steps: 15 });
    await page.mouse.up();
}

async function openWeek(page: Page) {
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
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
        if (
            url.origin !== origin &&
            !['GET', 'HEAD', 'OPTIONS'].includes(req.method())
        ) {
            await route.abort('blockedbyclient');
            return;
        }
        if (
            url.origin === origin &&
            !url.pathname.startsWith('/api/') &&
            !['GET', 'HEAD', 'OPTIONS'].includes(req.method())
        ) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });
});

test('P0 owner mobile: create, client link, reschedule and cancel with no external writes', async ({
    page,
}, testInfo) => {
    // This journey exercises the mobile-only agenda. Desktop has its own
    // visible FullCalendar test below instead of expecting a hidden agenda.
    test.skip(
        testInfo.project.name !== 'mobile-chromium-390',
        'Mobile week agenda is hidden by design at desktop widths',
    );
    const state: SyntheticState = {
        visits: [],
        writes: [],
        outsideWrites: [],
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();

    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Nowa wizyta' }).click();

    const create = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(create).toBeVisible();
    await expect(create.getByTestId('v18-booking-missing-fields')).toContainText(
        'usługę',
    );
    await expect(create.getByTestId('v18-single-operator')).toContainText(
        'Aleksandra',
    );
    await expect(create.getByLabel('Pracownik')).toHaveCount(0);
    await create.locator('#appointment-service').click();
    await create.getByRole('option', { name: /Strzyżenie testowe/ }).click();

    await create
        .getByRole('combobox', { name: 'Szukaj klienta' })
        .fill('Klient');
    await create.getByRole('option', { name: /Klient Syntetyczny/ }).click();
    await expect(create.getByTestId('v18-selected-customer')).toBeVisible();
    await expect(create.getByTestId('v18-booking-missing-fields')).toHaveCount(0);
    await expect(
        create.getByRole('button', { name: 'Utwórz wizytę' }),
    ).toBeEnabled();
    await create.getByRole('button', { name: 'Utwórz wizytę' }).click();

    await expect.poll(() => state.visits.length).toBe(1);
    await expect(create).toBeHidden();
    expect(
        state.writes.filter((write) => write.method === 'POST'),
    ).toHaveLength(1);
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
    await expect(
        page.getByRole('link', { name: 'Wróć do kalendarza' }),
    ).toHaveAttribute('href', '/studio-v18/calendar');

    // Customer-context booking must preselect this person but allow an
    // authenticated staff operator to switch to another customer.
    // Closing without submitting must leave the synthetic API untouched.
    await page.getByRole('button', { name: 'Umów wizytę' }).click();
    const customerBooking = page.getByRole('dialog', {
        name: 'Rezerwacja wizyty V18',
    });
    await expect(customerBooking).toBeVisible();
    await expect(
        customerBooking.getByTestId('v18-selected-customer'),
    ).toContainText(customer.fullName);
    await customerBooking.getByRole('button', { name: 'Zmień klienta' }).click();
    await expect(
        customerBooking.getByRole('combobox', { name: 'Szukaj klienta' }),
    ).toBeVisible();
    await customerBooking.getByRole('button', { name: 'Zamknij' }).click();
    await expect(customerBooking).toBeHidden();

    await page.goBack();
    await openWeek(page);

    await page
        .getByTestId('v18-mobile-week-agenda')
        .getByRole('button', { name: /Otwórz wizytę/ })
        .click();
    const quick = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await expect(quick).toBeVisible();
    await quick.getByRole('button', { name: 'Otwórz szczegóły' }).click();

    const edit = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(edit).toBeVisible();
    await edit.getByLabel('Start wizyty').fill('2026-12-09T15:30');
    await edit.getByRole('button', { name: 'Zapisz zmiany' }).click();
    await expect
        .poll(() => state.visits[0]?.status)
        .toBe('scheduled');
    await expect(edit).toBeHidden();
    const manualMoves = state.writes.filter((write) =>
        write.path.endsWith('/reschedule'),
    );
    expect(manualMoves).toHaveLength(1);
    expect(manualMoves[0]?.body.confirmImmediately).toBe(true);

    await expect(agenda).toContainText('Zaplanowana');
    await agenda.getByRole('button', { name: /Otwórz wizytę/ }).click();
    const again = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await again.getByRole('button', { name: 'Anuluj wizytę' }).click();
    const confirm = page.getByRole('dialog', { name: 'Anulować wizytę?' });
    await expect(
        confirm.getByRole('button', { name: 'Anuluj', exact: true }),
    ).toBeFocused();
    await confirm.getByRole('button', { name: 'Anuluj wizytę' }).click();
    await expect.poll(() => state.visits[0]?.status).toBe('cancelled');

    expect(
        state.writes.map((write) => write.method + ' ' + write.path),
    ).toEqual([
        'POST /api/appointments',
        'PATCH /api/appointments/99007/reschedule',
        'PATCH /api/appointments/99007/cancel',
    ]);
    expect(state.outsideWrites).toEqual([]);
});

test('V18.1: attendance alerts use batched customer statistics with no external writes', async ({
    page,
}, testInfo) => {
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2026-12-09T10:00:00.000Z',
            endTime: '2026-12-09T10:45:00.000Z',
            status: 'scheduled',
        }],
        attendanceWarnings: true,
        writes: [],
        outsideWrites: [],
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar?view=day&date=2026-12-09');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();

    if (testInfo.project.name === 'mobile-chromium-390') {
        await page.getByRole('button', { name: 'Tydzień', exact: true }).click();
        const agenda = page.getByTestId('v18-mobile-week-agenda');
        await expect(agenda).toBeVisible();
        await expect(agenda.getByText('Powtarzające się nieobecności')).toBeVisible();
    } else if (testInfo.project.name === 'desktop-1366') {
        const indicator = page.getByRole('img', {
            name: 'Ważne ostrzeżenie dotyczące klienta',
        });
        await expect(indicator).toBeVisible();
    }
    expect(state.writes).toEqual([]);
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
        await expect(
            drawer.getByRole('button', { name: 'Zamknij' }),
        ).toBeVisible();
        expect(
            await drawer.evaluate(
                (element) => element.getBoundingClientRect().width,
            ),
        ).toBeLessThanOrEqual(width + 1);
        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
        ).toBe(true);
        await drawer.getByRole('button', { name: 'Zamknij' }).click();
        await expect(drawer).toBeHidden();
    }
    expect(state.writes).toHaveLength(0);
});


test('P0 desktop: create appointment and see it in the FullCalendar week grid', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'Desktop grid visibility is asserted in the desktop project only',
    );
    const state: SyntheticState = { visits: [], writes: [], outsideWrites: [] };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');

    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Tydzień', exact: true }).click();

    // Mobile agenda is correctly hidden on a desktop viewport.
    await expect(page.getByTestId('v18-mobile-week-agenda')).toBeHidden();
    await expect(page.locator('.fc')).toBeVisible();

    await page.getByRole('button', { name: 'Nowa wizyta' }).click();
    const drawer = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(drawer).toBeVisible();
    await drawer.locator('#appointment-service').click();
    await drawer.getByRole('option', { name: /Strzyżenie testowe/ }).click();
    await drawer.getByRole('combobox', { name: 'Szukaj klienta' }).fill('Klient');
    await drawer.getByRole('option', { name: /Klient Syntetyczny/ }).click();
    await drawer.getByRole('button', { name: 'Utwórz wizytę' }).click();

    await expect.poll(() => state.visits.length).toBe(1);
    await expect(drawer).toBeHidden();
    expect(state.writes.filter((write) => write.method === 'POST')).toHaveLength(1);
    expect(state.writes[0].body).toMatchObject({
        clientId: customer.id,
        employeeId: owner.id,
        serviceId: service.id,
    });
    expect(state.outsideWrites).toHaveLength(0);

    const desktopAppointment = page.locator('.fc-event').filter({
        hasText: customer.fullName,
    }).first();
    await expect(desktopAppointment).toBeVisible();
    await desktopAppointment.click();
    await expect(page.getByRole('dialog', { name: 'Podgląd wizyty' })).toBeVisible();
});

test('P1 V18: persisted 21:00 appointment stays in day and week time grids', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'The visible FullCalendar time grid is asserted on desktop',
    );
    const openHours = [{ open: '09:00', close: '16:00' }];
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2026-12-09T20:00:00.000Z',
            endTime: '2026-12-09T21:20:00.000Z',
            status: 'scheduled',
        }],
        writes: [],
        outsideWrites: [],
        hours: { source: 'timetables', hours: {
            mon: openHours, tue: openHours, wed: openHours,
            thu: openHours, fri: openHours, sat: [], sun: [],
        } },
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar?date=2026-12-09&view=day');

    const lateSlot = page.locator(
        '.fc-timegrid-slot[data-time="22:00:00"]',
    ).first();
    const lateAppointment = page.locator('.fc-event').filter({
        hasText: customer.fullName,
    }).first();

    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    await expect(lateSlot).toBeVisible();
    await expect(lateAppointment).toBeVisible();
    await expect(lateAppointment).toContainText('21:00');

    await page.getByRole('button', {
        name: 'Tydzień', exact: true,
    }).click();
    await expect(page.locator(
        '.fc-timegrid-slot[data-time="22:00:00"]',
    ).first()).toBeVisible();
    await expect(lateAppointment).toBeVisible();
    await expect(lateAppointment).toContainText('21:00');
    expect(state.writes).toHaveLength(0);
    expect(state.outsideWrites).toHaveLength(0);
});

test('P1 V18: evening booking requires explicit owner acknowledgement before POST', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'One deterministic synthetic clock and explicit admin consent path',
    );
    await page.clock.setFixedTime(new Date('2030-11-19T20:00:00.000Z'));
    const office = [{ open: '09:00', close: '18:00' }];
    const state: SyntheticState = {
        visits: [], writes: [], outsideWrites: [],
        hours: { source: 'timetables', hours: {
            mon: office, tue: office, wed: office, thu: office,
            fri: office, sat: office, sun: [],
        } },
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await page.getByRole('button', { name: 'Nowa wizyta' }).click();

    const drawer = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(drawer.getByTestId('v18-outside-opening-hours')).toBeVisible();
    await expect(drawer.getByTestId('v18-outside-opening-hours')).toContainText(
        '09:00–18:00',
    );

    await drawer.locator('#appointment-service').click();
    await drawer.getByRole('option', { name: /Strzyżenie testowe/ }).click();
    // Once a service is selected, the warning must stay visible and check
    // the complete duration, rather than merely the provisional start time.
    await expect(drawer.getByTestId('v18-outside-opening-hours')).toBeVisible();
    await drawer.getByRole('combobox', { name: 'Szukaj klienta' }).fill('Klient');
    await drawer.getByRole('option', { name: /Klient Syntetyczny/ }).click();

    const create = drawer.getByRole('button', { name: 'Utwórz wizytę' });
    await expect(create).toBeDisabled();
    expect(state.writes).toHaveLength(0);

    const acknowledge = drawer.getByTestId('v18-confirm-outside-hours');
    await acknowledge.check();
    await expect(create).toBeEnabled();
    await acknowledge.uncheck();
    await expect(create).toBeDisabled();
    expect(state.writes).toHaveLength(0);
    await acknowledge.check();
    await expect(create).toBeEnabled();
    await create.click();
    await expect.poll(() => state.visits.length).toBe(1);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]).toMatchObject({
        method: 'POST', path: '/api/appointments',
        body: { employeeId: owner.id, clientId: customer.id, serviceId: service.id },
    });
    expect(state.outsideWrites).toHaveLength(0);
});

test('P1 V18: admin cannot confirm existing outside-hours visit without consent', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'Confirming a scheduled manual exception is covered on desktop',
    );
    await page.clock.setFixedTime(new Date('2030-11-19T06:00:00.000Z'));
    const office = [{ open: '09:00', close: '18:00' }];
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2030-11-19T07:15:00.000Z',
            endTime: '2030-11-19T08:00:00.000Z',
            status: 'scheduled',
        }],
        writes: [],
        outsideWrites: [],
        hours: { source: 'timetables', hours: {
            mon: office, tue: office, wed: office, thu: office,
            fri: office, sat: office, sun: [],
        } },
    };

    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    const eventCard = page.locator('.fc-event').filter({
        hasText: customer.fullName,
    }).first();
    await expect(eventCard).toBeVisible();
    await eventCard.click();
    await page.getByRole('dialog', { name: 'Podgląd wizyty' })
        .getByRole('button', { name: 'Otwórz szczegóły' }).click();

    const edit = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(edit.getByTestId('v18-outside-opening-hours')).toBeVisible();
    await expect(edit.getByRole('button', { name: 'Potwierdź', exact: true }))
        .toHaveCount(0);
    await expect(edit.getByRole('button', { name: 'Zapisz zmiany' }))
        .toBeDisabled();
    expect(state.writes).toHaveLength(0);

    await edit.getByTestId('v18-confirm-outside-hours').check();
    await edit.getByRole('button', { name: 'Potwierdź', exact: true }).click();
    await expect.poll(() => state.visits[0].status).toBe('confirmed');
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]).toMatchObject({
        path: '/api/appointments/99007/status',
        method: 'PATCH',
        body: { status: 'confirmed' },
    });
    expect(state.outsideWrites).toHaveLength(0);
});

/**
 * P1 regression: two consecutive real pointer drags on the SAME persisted
 * appointment. A one-off drag regression misses a calendar that becomes
 * non-draggable after a successful API reschedule and React Query refresh.
 */
test('P1 V18: same appointment stays draggable after first successful move', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'Actual FullCalendar pointer drag is exercised on the desktop grid',
    );
    const workday = [{ open: '08:00', close: '18:00' }];
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2026-12-09T08:15:00.000Z',
            endTime: '2026-12-09T09:00:00.000Z',
            status: 'scheduled',
        }],
        writes: [],
        outsideWrites: [],
        hours: { source: 'timetables', hours: {
            mon: workday, tue: workday, wed: workday,
            thu: workday, fri: workday, sat: [], sun: [],
        } },
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
    // A displayed event alone does not mean the asynchronously fetched
    // weekly opening-hours policy is ready. The first drop must not race it.
    await expect(page.getByText(
        /Godziny poza tygodniowym grafikiem są zacienione/,
    )).toBeVisible();
    await expect(page.locator('.fc-event-draggable').filter({
        hasText: customer.fullName,
    })).toBeVisible();

    const firstStart = state.visits[0].startTime;
    await dragAppointmentToTime(page, '10:00:00');
    await expect.poll(() => state.writes.filter(
        (write) => write.path.endsWith('/reschedule'),
    ).length).toBe(1);
    await expect.poll(() => state.visits[0].startTime).not.toBe(firstStart);
    const movedStart = state.visits[0].startTime;
    expect(state.visits[0].status).toBe('scheduled');

    // FullCalendar must re-enable dragging when it receives refreshed events.
    await expect(page.locator('.fc-event-draggable').filter({
        hasText: customer.fullName,
    })).toBeVisible();
    await dragAppointmentToTime(page, '11:00:00');
    await expect.poll(() => state.writes.filter(
        (write) => write.path.endsWith('/reschedule'),
    ).length).toBe(2);
    expect(state.visits[0].startTime).not.toBe(movedStart);
    expect(state.visits[0].status).toBe('scheduled');
    expect(state.outsideWrites).toEqual([]);
});


test('P1 V18: approved late-hours drag allows another drag after refresh', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'Consecutive FullCalendar drag and owner consent are desktop-only',
    );
    const workday = [{ open: '09:00', close: '18:00' }];
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2026-12-09T19:15:00.000Z',
            endTime: '2026-12-09T20:00:00.000Z',
            status: 'scheduled',
        }],
        writes: [],
        outsideWrites: [],
        hours: { source: 'timetables', hours: {
            mon: workday, tue: workday, wed: workday,
            thu: workday, fri: workday, sat: [], sun: [],
        } },
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
    await expect(page.getByText(
        /Godziny poza tygodniowym grafikiem są zacienione/,
    )).toBeVisible();

    for (const [target, expectedCount] of [
        ['19:00:00', 1],
        ['20:00:00', 2],
    ] as const) {
        const previous = state.visits[0].startTime;
        await dragAppointmentToTime(page, target);
        const dialog = page.getByRole('dialog', {
            name: 'Wizyta poza godzinami pracy',
        });
        await expect(dialog).toBeVisible();
        expect(state.writes).toHaveLength(expectedCount - 1);
        await dialog.getByRole('button', {
            name: 'Przenieś poza godzinami pracy',
        }).click();
        await expect.poll(() => state.writes.filter(
            (write) => write.path.endsWith('/reschedule'),
        ).length).toBe(expectedCount);
        await expect.poll(() => state.visits[0].startTime).not.toBe(previous);
        await expect(dialog).toBeHidden();
        expect(state.visits[0].status).toBe('scheduled');
        await expect(page.locator('.fc-event-draggable').filter({
            hasText: customer.fullName,
        })).toBeVisible();
    }
    expect(state.writes.filter(
        (write) => write.path.endsWith('/reschedule'),
    ).every((write) => write.body.confirmImmediately === true)).toBe(true);
    expect(state.outsideWrites).toEqual([]);
});

/**
 * A drag released over the surrounding page (outside the time grid) must
 * never leave a floating mirror that captures another visit's clicks.
 * This simulates a narrow desktop with DevTools docked beside the calendar.
 */
test('P1 V18: aborted drag outside grid cleans mirror and next move still works', async ({
    page,
}, testInfo) => {
    test.skip(
        testInfo.project.name !== 'desktop-1366',
        'Real FullCalendar pointer interactions only on desktop',
    );
    await page.setViewportSize({ width: 1000, height: 768 });
    const state: SyntheticState = {
        visits: [{
            id: 99007,
            clientId: customer.id,
            employeeId: owner.id,
            serviceId: service.id,
            startTime: '2026-12-09T08:15:00.000Z',
            endTime: '2026-12-09T09:00:00.000Z',
            status: 'scheduled',
        }],
        writes: [],
        outsideWrites: [],
    };
    await installSyntheticBackend(page, state);
    await page.goto('/studio-v18/calendar');
    await page.getByLabel('Przejdź do daty').fill(testDate);
    await page.keyboard.press('Escape');
    await expect(page.getByText(
        /Godziny poza tygodniowym grafikiem są zacienione/,
    )).toBeVisible();

    const card = page.locator('.fc-event-draggable').filter({
        hasText: customer.fullName,
    }).first();
    await card.scrollIntoViewIfNeeded();
    const from = await card.boundingBox();
    const frame = await page.locator('.salonbw-calendar-frame').boundingBox();
    if (!from || !frame) throw new Error('Missing calendar coordinates');
    const y = from.y + Math.min(from.height / 2, 12);
    const x = from.x + Math.min(from.width / 2, 50);
    const outsideX = Math.max(5, frame.x - 8);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(outsideX, y, { steps: 18 }); // Outside time grid.
    await page.mouse.up();

    // FullCalendar's drag mirror is transient. No appointment may be
    // persisted after an invalid out-of-calendar pointer release.
    await expect(page.locator('.fc-event-mirror')).toHaveCount(0);
    expect(state.writes).toHaveLength(0);
    await expect(card).toBeVisible();
    await expect(page.getByRole('dialog', {
        name: 'Podgląd wizyty',
    })).toHaveCount(0);

    // Click the ORIGINAL visit, not the preview mirror nor a neighbour.
    await card.click();
    const quick = page.getByRole('dialog', { name: 'Podgląd wizyty' });
    await expect(quick).toContainText(customer.fullName);
    // AppointmentQuickModal closes on backdrop, not the Escape key.
    await page.locator('.position-fixed').filter({ has: quick })
        .click({ position: { x: 8, y: 8 } });
    await expect(quick).toBeHidden();

    await dragAppointmentToTime(page, '12:00:00');
    await expect.poll(() => state.writes.filter(
        (write) => write.path.endsWith('/reschedule'),
    ).length).toBe(1);
    expect(state.outsideWrites).toEqual([]);
});
