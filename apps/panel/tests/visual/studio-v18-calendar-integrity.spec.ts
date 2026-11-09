import { expect, test, type Page } from '@playwright/test';

/**
 * Calendar V18 browser QA: localhost, fake account and intercepted API only.
 * In particular, no real appointment or customer record is read or written.
 */
const origin = 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Synthetic localhost calendar test only; hosted and production disabled',
);

test.use({
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
});

type CalendarScenario = {
    rejectWeek: boolean;
    requests: string[];
};

const fixture = {
    events: [
        {
            id: 99001,
            type: 'appointment',
            title: 'Usługa testowa',
            startTime: '2026-11-09T09:00:00.000Z',
            endTime: '2026-11-09T09:45:00.000Z',
            employeeId: 7,
            employeeName: 'Pracownik testowy',
            clientId: 99001,
            clientName: 'Klient syntetyczny',
            serviceId: 22,
            serviceName: 'Usługa testowa',
            status: 'confirmed',
        },
    ],
    employees: [
        {
            id: 7,
            name: 'Pracownik testowy',
            color: '#64748b',
        },
    ],
    dateRange: {
        start: '2026-11-09',
        end: '2026-11-15',
    },
};

function response(value: unknown, status = 200) {
    return {
        status,
        contentType: 'application/json',
        body: JSON.stringify(value),
    };
}

async function installSyntheticApi(page: Page, scenario: CalendarScenario) {
    await page.route('**/studio-v18/calendar', async (route) => {
        const originResponse = await route.fetch();
        const headers = originResponse.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\s*;?\s*upgrade-insecure-requests\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response: originResponse, headers });
    });

    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.method() !== 'GET') {
            await route.fulfill(
                response({ error: 'Synthetic mutation forbidden' }, 405),
            );
            return;
        }
        if (url.pathname === '/api/users/profile') {
            await route.fulfill(
                response({
                    id: 1801,
                    role: 'admin',
                    name: 'Administrator testowy',
                    email: 'admin@example.invalid',
                }),
            );
            return;
        }
        if (url.pathname === '/api/calendar/events') {
            scenario.requests.push(url.toString());
            if (
                scenario.rejectWeek &&
                url.searchParams.get('view') === 'week'
            ) {
                await route.fulfill(response({ message: 'Invalid view' }, 400));
                return;
            }
            await route.fulfill(response(fixture));
            return;
        }
        await route.fulfill(response({ message: 'Fixture only' }, 404));
    });
}

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);
    // Never allow accidental mutations outside explicitly mocked endpoints.
    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (
            url.origin === origin &&
            !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())
        ) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });
});

test('single-owner calendar: readable mobile week, month navigation and direct links', async ({
    page,
}, testInfo) => {
    const scenario: CalendarScenario = { rejectWeek: false, requests: [] };
    await installSyntheticApi(page, scenario);
    await page.goto('/studio-v18/calendar');

    const calendar = page.getByTestId('v18-calendar-pilot');
    await expect(calendar).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Kalendarz' }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Klienci', exact: true }),
    ).toHaveAttribute('href', '/studio-v18/customers');
    await expect(
        page.getByRole('link', { name: 'Wizyty', exact: true }),
    ).toHaveAttribute('href', '/appointments');

    // With one staff member, filters waste space and add no value.
    await expect(page.getByRole('heading', { name: 'Zespół' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tydzień' }).click();
    await expect
        .poll(() =>
            scenario.requests.some(
                (request) =>
                    new URL(request).searchParams.get('view') === 'week',
            ),
        )
        .toBe(true);

    const agenda = page.getByTestId('v18-mobile-week-agenda');
    if (testInfo.project.name === 'desktop-1366') {
        await expect(agenda).toBeHidden();
        await expect(page.locator('.fc-timeGridWeek-view')).toBeVisible();
    } else {
        await expect(agenda).toBeVisible();
        await expect(page.locator('.fc-timeGridWeek-view')).toBeHidden();
        await expect(agenda.locator('[data-day="2026-11-09"]')).toContainText(
            'Klient syntetyczny',
        );
        await expect(
            agenda.getByRole('link', { name: /Otwórz kartę klienta/ }),
        ).toHaveAttribute('href', '/studio-v18/customers/99001');
        const card = agenda.locator('[data-status="confirmed"]').first();
        await expect(card).toBeVisible();
        expect(
            await card.evaluate(
                (element) => getComputedStyle(element).backgroundColor,
            ),
        ).toBe('rgb(241, 241, 242)');
    }

    const overview = page.getByLabel('Podsumowanie wybranego okresu');
    await expect(overview).toContainText('Potwierdzone');
    await page.getByRole('button', { name: 'Miesiąc' }).click();
    await expect
        .poll(() =>
            scenario.requests.some(
                (request) =>
                    new URL(request).searchParams.get('view') === 'month',
            ),
        )
        .toBe(true);

    // Local date selection must not reintroduce UTC date drift.
    await page.getByLabel('Przejdź do daty').fill('2026-12-24');
    await expect
        .poll(() =>
            scenario.requests.some((request) => {
                const params = new URL(request).searchParams;
                return (
                    params.get('date') === '2026-12-24' &&
                    params.get('view') === 'month'
                );
            }),
        )
        .toBe(true);

    await page
        .getByRole('button', {
            name: 'Pokaż wizyty 2026-12-24',
        })
        .click();
    await expect(
        page.getByRole('button', { name: 'Dzień', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    const widths =
        testInfo.project.name === 'desktop-1366' ? [1366] : [390, 375, 320];
    for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        expect(
            await page.evaluate(
                () =>
                    document.documentElement.scrollWidth <=
                    window.innerWidth + 1,
            ),
        ).toBe(true);
        const frame = page.locator('.salonbw-calendar-frame').first();
        await expect(frame).toBeVisible();
        expect(
            await frame.evaluate(
                (element) =>
                    element.getBoundingClientRect().width <=
                    window.innerWidth + 1,
            ),
        ).toBe(true);
    }
});

test('week API 400 fails visibly without falling back to an incomplete day', async ({
    page,
}) => {
    const scenario: CalendarScenario = { rejectWeek: true, requests: [] };
    await installSyntheticApi(page, scenario);
    await page.goto('/studio-v18/calendar');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
    await page.getByRole('button', { name: 'Tydzień' }).click();

    await expect(
        page.getByTestId('v18-calendar-pilot').getByRole('alert'),
    ).toContainText('Nie udało się pobrać wizyt');
    const weekRequests = scenario.requests.filter(
        (request) => new URL(request).searchParams.get('view') === 'week',
    );
    expect(weekRequests).toHaveLength(2);
    expect(
        scenario.requests.some(
            (request) => new URL(request).searchParams.get('view') === 'day',
        ),
    ).toBe(false);
});
