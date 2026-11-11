import { expect, test } from '@playwright/test';

/**
 * Real mobile touch -> V18 -> real Next.js. Backend + PostgreSQL are isolated
 * fixtures. Cancelling the dragged proposal must never mutate an appointment.
 * Run ONLY via the guarded localhost workflow, never against hosted DEV/PROD.
 */
const origin = 'http://127.0.0.1:3100';
const ownerEmail = 'owner-browser-uat@example.invalid';
const password = 'SyntheticLocalOnly2026!';

if (
    process.env.GITHUB_ACTIONS !== 'true' ||
    process.env.CI !== 'true' ||
    process.env.QA_OWNER_E2E_MODE !== '1' ||
    process.env.API_PROXY_URL !== 'http://127.0.0.1:3200' ||
    process.env.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
    process.env.PLAYWRIGHT_BASE_URL ||
    process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_'
) {
    throw new Error('V18_MOBILE_TOUCH_BLOCKED: isolated localhost only');
}

test.use({
    baseURL: origin,
    httpCredentials: {
        username: 'studio-fixture',
        password: 'studio-fixture-password',
    },
    trace: 'off',
    screenshot: 'off',
    video: 'off',
});

function warsawDay(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Warsaw',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(value);
    const get = (name: string) =>
        parts.find((part) => part.type === name)?.value ?? '';
    return [get('year'), get('month'), get('day')].join('-');
}

function adjacentWeekDay(key: string): string {
    const value = new Date(key + 'T12:00:00Z');
    value.setUTCDate(value.getUTCDate() + (value.getUTCDay() === 0 ? -1 : 1));
    return value.toISOString().slice(0, 10);
}

test('touch-and-hold appointment, move to another day, cancel without PATCH', async ({
    page,
}) => {
    test.setTimeout(180_000);
    const writes: string[] = [];
    await page.route('**/*', async (route) => {
        const req = route.request();
        const url = new URL(req.url());
        if (url.origin !== origin) {
            await route.abort('blockedbyclient');
            return;
        }
        const method = req.method();
        const safe =
            ['GET', 'HEAD', 'OPTIONS'].includes(method) ||
            (method === 'POST' &&
                ['/api/auth/login', '/api/appointments'].includes(url.pathname));
        if (!safe) {
            writes.push(method + ' ' + url.pathname);
            await route.abort('blockedbyclient');
            return;
        }
        if (method === 'POST') writes.push(method + ' ' + url.pathname);
        await route.continue();
    });

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(ownerEmail);
    await page.getByLabel('Hasło').fill(password);
    await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/);

    const targetDate = warsawDay(new Date(Date.now() + 28 * 86_400_000));
    await page.goto('/studio-v18/calendar');
    await page.getByLabel('Przejdź do daty').fill(targetDate);
    await expect.poll(() => new URL(page.url()).searchParams.get('date')).toBe(
        targetDate,
    );
    await page.getByRole('button', { name: 'Nowa wizyta' }).click();
    const drawer = page.getByRole('dialog', {
        name: 'Rezerwacja wizyty V18',
    });
    await drawer.locator('#appointment-service').click();
    await drawer.getByRole('option', { name: /Strzyżenie testowe/ }).click();
    await drawer.getByRole('combobox', { name: 'Szukaj klienta' }).fill('Klient');
    await drawer.getByRole('option', { name: /Klient Syntetyczny/ }).click();

    const creating = page.waitForResponse(
        (response) =>
            new URL(response.url()).pathname === '/api/appointments' &&
            response.request().method() === 'POST',
    );
    await drawer.getByRole('button', { name: 'Utwórz wizytę' }).click();
    const created = await creating;
    expect(created.status()).toBe(201);
    const id = ((await created.json()) as { id: number }).id;
    const start = String(
        (created.request().postDataJSON() as { startTime: string }).startTime,
    );
    expect(id).toBeGreaterThan(0);
    const originalDay = warsawDay(new Date(start));
    const newDay = adjacentWeekDay(originalDay);

    await page.getByRole('button', { name: 'Tydzień', exact: true }).click();
    const source = page.locator('section[data-day="' + originalDay + '"]');
    const target = page.locator('section[data-day="' + newDay + '"]');
    const handle = source.getByTestId('v18-mobile-week-drag-handle');
    await expect(handle).toBeVisible();

    await page.evaluate((key) => {
        const element = document.querySelector(
            'section[data-day="' + key + '"]',
        );
        if (element) {
            window.scrollTo({
                top: Math.max(
                    0,
                    window.scrollY + element.getBoundingClientRect().top - 100,
                ),
                behavior: 'instant',
            });
        }
    }, originalDay);
    const from = await handle.boundingBox();
    const to = await target.locator('header').boundingBox();
    expect(from).not.toBeNull();
    expect(to).not.toBeNull();

    const startPoint = {
        x: from!.x + from!.width / 2,
        y: from!.y + from!.height / 2,
    };
    const endPoint = {
        x: to!.x + to!.width / 2,
        y: to!.y + to!.height / 2,
    };
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [startPoint],
    });
    await page.waitForTimeout(500);
    for (let step = 1; step <= 12; step++) {
        const ratio = step / 12;
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
                {
                    x: startPoint.x + (endPoint.x - startPoint.x) * ratio,
                    y: startPoint.y + (endPoint.y - startPoint.y) * ratio,
                },
            ],
        });
        await page.waitForTimeout(35);
    }
    await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
    });

    const confirmation = page.getByRole('dialog', {
        name: 'Przełożyć wizytę?',
    });
    await expect(confirmation).toBeVisible();
    expect(writes).toEqual([
        'POST /api/auth/login',
        'POST /api/appointments',
    ]);
    await confirmation.getByRole('button', { name: 'Anuluj' }).click();
    await expect(confirmation).toBeHidden();

    const appointment = await page.request.get('/api/appointments/' + id);
    expect(appointment.status()).toBe(200);
    const persisted = (await appointment.json()) as { startTime: string };
    expect(new Date(persisted.startTime).toISOString()).toBe(
        new Date(start).toISOString(),
    );
    console.log('V18_MOBILE_TOUCH_DRAG_CANCEL=PASS');
});
