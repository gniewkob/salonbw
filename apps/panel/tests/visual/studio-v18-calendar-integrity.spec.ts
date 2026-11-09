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
            await route.fulfill(response({ error: 'Synthetic mutation forbidden' }, 405));
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
            if (scenario.rejectWeek && url.searchParams.get('view') === 'week') {
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

test('week/month keeps complete period, filters staff and fits the viewport', async ({
    page,
}) => {
    const scenario: CalendarScenario = { rejectWeek: false, requests: [] };
    await installSyntheticApi(page, scenario);
    await page.goto('/studio-v18/calendar');

    const calendar = page.getByTestId('v18-calendar-pilot');
    await expect(calendar).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Plan dnia, bez chaosu.' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Tydzień' }).click();
    await expect
        .poll(
            () =>
                scenario.requests.some(
                    (request) =>
                        new URL(request).searchParams.get('view') === 'week',
                ),
        )
        .toBe(true);

    const overview = page.getByLabel('Podsumowanie wybranego okresu');
    await expect(overview).toContainText('Wizyty w okresie');
    await expect(overview).toContainText('Potwierdzone');

    await page.getByRole('button', { name: /Pracownik testowy/ }).click();
    await expect
        .poll(
            () =>
                scenario.requests.some((request) => {
                    const params = new URL(request).searchParams;
                    return (
                        params.get('view') === 'week' &&
                        params.get('employeeIds') === '7'
                    );
                }),
        )
        .toBe(true);

    await page.getByRole('button', { name: 'Miesiąc' }).click();
    await expect
        .poll(
            () =>
                scenario.requests.some(
                    (request) =>
                        new URL(request).searchParams.get('view') === 'month',
                ),
        )
        .toBe(true);

    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
    ).toBe(true);
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
            (request) =>
                new URL(request).searchParams.get('view') === 'day',
        ),
    ).toBe(false);
});
