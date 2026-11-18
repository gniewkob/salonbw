import { expect, test, type Page } from '@playwright/test';

/**
 * UI parity and short-block legibility: fully synthetic localhost only.
 * No hosted API, real user data, or database mutations.
 */
const ORIGIN = 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Synthetic, isolated localhost V18 browser QA only',
);

test.use({
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
});

const fixture = {
    events: [
        {
            id: 99002,
            type: 'time_block',
            title: 'Przerwa obiadowa',
            startTime: '2026-11-20T13:00:00.000Z',
            endTime: '2026-11-20T13:15:00.000Z',
            employeeId: 7,
            employeeName: 'Ola syntetyczna',
            blockType: 'break',
            allDay: false,
        },
    ],
    employees: [{ id: 7, name: 'Ola syntetyczna', color: '#64748b' }],
    dateRange: { start: '2026-11-20', end: '2026-11-21' },
};

const json = (value: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(value),
});

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: ORIGIN },
    ]);

    // Every mutation is forbidden, and every API GET is intercepted.
    await page.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.origin !== ORIGIN) {
            await route.abort('blockedbyclient');
            return;
        }
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
            await route.abort('blockedbyclient');
            return;
        }
        await route.continue();
    });

    // The development CSP can upgrade insecure requests; this test uses
    // only HTTP loopback and must never ask a remote host for its assets.
    await page.route('**/studio-v18/calendar**', async (route) => {
        const originResponse = await route.fetch();
        const headers = originResponse.headers();
        headers['content-security-policy'] = (
            headers['content-security-policy'] || ''
        ).replace(/\\s*;?\\s*upgrade-insecure-requests\\b/gi, '');
        delete headers['strict-transport-security'];
        await route.fulfill({ response: originResponse, headers });
    });

    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (request.method() !== 'GET') {
            await route.fulfill(json({ error: 'Write forbidden' }, 405));
            return;
        }
        if (url.pathname === '/api/users/profile') {
            await route.fulfill(json({
                id: 7,
                role: 'admin',
                name: 'Ola syntetyczna',
                email: 'owner@example.invalid',
            }));
            return;
        }
        if (url.pathname === '/api/calendar/events') {
            await route.fulfill(json(fixture));
            return;
        }
        if (url.pathname === '/api/calendar/performers') {
            await route.fulfill(json(fixture.employees));
            return;
        }
        if (url.pathname === '/api/calendar/opening-hours') {
            await route.fulfill(json({
                source: 'timetables',
                hours: Object.fromEntries(
                    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((key) => [
                        key,
                        [{ open: '08:00', close: '18:00' }],
                    ]),
                ),
            }));
            return;
        }
        await route.fulfill(json({ message: 'Synthetic fixture only' }, 404));
    });

    await page.goto('/studio-v18/calendar?view=day&date=2026-11-20');
    await expect(page.getByTestId('v18-calendar-pilot')).toBeVisible();
});

test('a 15-minute block is readable without expanding its time-grid height', async ({ page }, testInfo) => {
    const card = page.locator('.salonbw-event-card--block-compact').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('aria-label', /Przerwa obiadowa/);
    await expect(card).toHaveAttribute('title', /Przerwa obiadowa/);
    await expect(card.locator('.salonbw-time-block__title')).toHaveText('Przerwa obiadowa');

    await card.scrollIntoViewIfNeeded();
    const metrics = await card.evaluate((element) => {
        const label = element.querySelector<HTMLElement>('.salonbw-time-block__title');
        const time = element.querySelector<HTMLElement>('.salonbw-time-block__time');
        if (!label || !time) throw new Error('Missing expected block content');
        return {
            titleHeight: label.getBoundingClientRect().height,
            cardHeight: element.getBoundingClientRect().height,
            timeDisplay: getComputedStyle(time).display,
            labelLineHeight: getComputedStyle(label).lineHeight,
        };
    });
    expect(metrics.titleHeight).toBeGreaterThanOrEqual(11);
    expect(metrics.titleHeight).toBeLessThanOrEqual(metrics.cardHeight);
    expect(metrics.timeDisplay).toBe('none');
    expect(parseFloat(metrics.labelLineHeight)).toBeLessThanOrEqual(13);
    await page.screenshot({
        path: testInfo.outputPath('v18-block-15min.png'),
        fullPage: false,
    });
});

test('both toolbar actions have equivalent hover motion and the block modal uses the booking visual system', async ({
    page,
}, testInfo) => {
    const blockAction = page.getByRole('button', { name: 'Blokuj czas' });
    const visitAction = page.getByRole('button', { name: 'Nowa wizyta' });
    await expect(blockAction).toBeVisible();
    await expect(visitAction).toBeVisible();

    // Hover can occur on the Chromium desktop only; mobile QA checks presence.
    if (testInfo.project.name.startsWith('desktop')) {
        await blockAction.hover();
        await expect.poll(() => blockAction.evaluate(
            (element) => getComputedStyle(element).transform,
        )).toBe('matrix(1, 0, 0, 1, 0, -1)');
        await visitAction.hover();
        await expect.poll(() => visitAction.evaluate(
            (element) => getComputedStyle(element).transform,
        )).toBe('matrix(1, 0, 0, 1, 0, -1)');
    }

    await blockAction.click();
    const blockDialog = page.getByRole('dialog', { name: 'Dodaj blokadę' });
    await expect(blockDialog).toBeVisible();
    await expect(blockDialog.getByText('Salon Black & White · CRM V18')).toBeVisible();
    const blockHeader = blockDialog.getByRole('heading', { name: 'Dodaj blokadę' });
    const blockTypography = await blockHeader.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
            fontFamily: css.fontFamily,
            fontSize: css.fontSize,
            fontWeight: css.fontWeight,
        };
    });
    await page.screenshot({
        path: testInfo.outputPath('v18-block-modal.png'),
        fullPage: false,
    });

    await blockDialog.getByRole('button', { name: 'Zamknij' }).click();
    await visitAction.click();
    const visitDialog = page.getByRole('dialog', { name: 'Rezerwacja wizyty V18' });
    await expect(visitDialog).toBeVisible();
    const visitTypography = await visitDialog.getByText('Nowa wizyta', { exact: true }).evaluate((element) => {
        const css = getComputedStyle(element);
        return {
            fontFamily: css.fontFamily,
            fontSize: css.fontSize,
            fontWeight: css.fontWeight,
        };
    });
    expect(blockTypography).toEqual(visitTypography);
});
