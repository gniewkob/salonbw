import { expect, test } from '@playwright/test';

const origin = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100';

test.skip(
    Boolean(process.env.PLAYWRIGHT_BASE_URL) ||
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
        process.env.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_',
    'Screenshots require synthetic local fixture, never live customer data',
);

test.use({
    httpCredentials: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : { username: 'studio-fixture', password: 'studio-fixture-password' },
});

const customers = [
    {
        id: 99001,
        name: 'Klient syntetyczny A',
        email: 'a@example.invalid',
        smsConsent: false,
        emailConsent: false,
        gdprConsent: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        lastVisitDate: null,
    },
    {
        id: 99002,
        name: 'Klient syntetyczny B',
        email: 'b@example.invalid',
        smsConsent: false,
        emailConsent: false,
        gdprConsent: false,
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
        lastVisitDate: null,
    },
];

test.beforeEach(async ({ page, context }) => {
    await context.addCookies([
        { name: 'dev_sbw_auth', value: 'true', url: origin },
    ]);
    await page.route('**/studio-v18/customers', async (route) => {
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
        const pathname = url.pathname;
        if (pathname === '/api/users/profile') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 1801,
                    name: 'Administrator testowy',
                    role: 'admin',
                    email: 'admin@example.invalid',
                }),
            });
            return;
        }
        if (pathname === '/api/customer-groups') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 7, name: 'VIP test' }]),
            });
            return;
        }
        if (pathname === '/api/customer-tags') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 9, name: 'Koloryzacja' }]),
            });
            return;
        }
        if (pathname === '/api/customers' && route.request().method() === 'GET') {
            const search = (url.searchParams.get('search') || '').toLowerCase();
            const rows = customers.filter((customer) =>
                customer.name.toLowerCase().includes(search),
            );
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    items: rows,
                    total: rows.length,
                    page: 1,
                    limit: 20,
                    totalPages: 1,
                }),
            });
            return;
        }
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Unexpected fixture endpoint' }),
        });
    });
});

test('real hook sends server filters without exposing live customer data', async ({
    page,
}, testInfo) => {
    const customerRequests: string[] = [];
    page.on('request', (request) => {
        if (/\/api\/customers(?:\?|$)/.test(request.url())) {
            customerRequests.push(request.url());
        }
    });
    await page.goto('/studio-v18/customers');
    await expect(
        page.getByRole('heading', { name: 'Klienci V18' }),
    ).toBeVisible();
    await expect(page.getByText('Klient syntetyczny A')).toBeVisible();

    // Both filters must have V18 styling rather than OS-native select chrome.
    for (const label of ['Na stronie', 'Grupa klientów', 'Tag klienta']) {
        const select = page.getByRole('combobox', { name: label, exact: true });
        await expect(select).toHaveCSS('appearance', 'none');
        await expect(select).toHaveCSS('border-radius', '12px');
        await expect(select).toHaveCSS('background-image', /data:image\/svg\+xml/);
    }

    await expect(page.getByRole('link', { name: 'Umów' }).first()).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Pełny moduł Klienci' }),
    ).toHaveAttribute('href', '/customers');

    await page.getByRole('searchbox', { name: 'Wyszukaj klienta' }).fill('B');
    await expect(page.getByText('Klient syntetyczny B')).toBeVisible();
    await expect(page.getByText('Klient syntetyczny A')).toHaveCount(0);
    await expect.poll(
        () =>
            customerRequests.some(
                (url) => new URL(url).searchParams.get('search') === 'B',
            ),
    ).toBe(true);

    await page.getByLabel('Grupa klientów').selectOption('7');
    await expect.poll(
        () =>
            customerRequests.some(
                (url) => new URL(url).searchParams.get('groupId') === '7',
            ),
    ).toBe(true);

    await page
        .getByRole('button', { name: 'Sortuj po e-mailu' })
        .click();
    await expect.poll(
        () =>
            customerRequests.some((url) => {
                const query = new URL(url).searchParams;
                return query.get('sortBy') === 'email';
            }),
    ).toBe(true);
    await page.getByRole('combobox', { name: 'Tag klienta' }).selectOption('9');
    await expect.poll(
        () =>
            customerRequests.some(
                (url) => new URL(url).searchParams.get('tagId') === '9',
            ),
    ).toBe(true);

    const consent = page.getByRole('button', { name: 'Brak zgody SMS' });
    await consent.click();
    await expect(consent).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(
        () =>
            customerRequests.some((url) => {
                const params = new URL(url).searchParams;
                return params.get('tagId') === '9' && params.get('smsConsent') === 'false';
            }),
    ).toBe(true);
    await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
    await expect(consent).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('combobox', { name: 'Tag klienta' })).toHaveValue('');

    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
    ).toBe(true);

    // Screenshots contain only synthetic customer records.
    await page.screenshot({
        path: testInfo.outputPath('v18-customers-pilot-fixture.png'),
        fullPage: true,
    });
});

test('page-only bulk selection and CSV stay within synthetic DEV records', async ({
    page,
}) => {
    let addedIds: number[] = [];
    await page.route('**/api/customer-groups/7/members', async (route) => {
        const payload = route.request().postDataJSON() as {
            customerIds: number[];
        };
        addedIds = payload.customerIds;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'null',
        });
    });
    await page.goto('/studio-v18/customers');
    await expect(page.getByText('Klient syntetyczny A')).toBeVisible();
    await page
        .getByRole('checkbox', { name: 'Zaznacz klientów na stronie' })
        .check();
    await expect(page.getByText(/Zaznaczono: 2 z/)).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page
        .getByRole('button', { name: 'Eksportuj stronę CSV' })
        .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('klienci-v18-strona-1.csv');
    await page
        .getByLabel('Wybierz grupę do przypisania')
        .selectOption('7');
    await page.getByRole('button', { name: 'Dodaj do grupy' }).click();
    await expect.poll(() => addedIds).toEqual([99001, 99002]);
    await expect(page.getByText(/Zaznaczono: 2 z/)).toHaveCount(0);
});

test('tag management adds and removes only synthetic customer assignments', async ({
    page,
}, testInfo) => {
    const catalog = [
        { id: 7, name: 'VIP test' },
        { id: 9, name: 'Koloryzacja test' },
    ];
    let assigned = [catalog[0]];
    const recordedWrites: Array<{ method: string; url: string }> = [];

    await page.route('**/api/customer-tags', async (route) => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as {
                name: string;
            };
            const newTag = { id: 11, name: payload.name };
            catalog.push(newTag);
            recordedWrites.push({
                method: 'POST',
                url: '/api/customer-tags',
            });
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(newTag),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(catalog),
        });
    });
    await page.route('**/api/customers/99001/tags/*', async (route) => {
        const tagId = Number(route.request().url().split('/').pop());
        if (route.request().method() === 'DELETE') {
            assigned = assigned.filter((tag) => tag.id !== tagId);
            recordedWrites.push({
                method: 'DELETE',
                url: '/api/customers/99001/tags/' + tagId,
            });
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
        });
    });
    await page.route('**/api/customers/99001/tags', async (route) => {
        if (route.request().method() === 'POST') {
            const payload = route.request().postDataJSON() as {
                tagIds: number[];
            };
            for (const tagId of payload.tagIds) {
                const tag = catalog.find((item) => item.id === tagId);
                if (tag && !assigned.some((item) => item.id === tagId)) {
                    assigned.push(tag);
                }
            }
            recordedWrites.push({
                method: 'POST',
                url: '/api/customers/99001/tags',
            });
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(
                route.request().method() === 'GET'
                    ? assigned
                    : { success: true },
            ),
        });
    });

    await page.goto('/studio-v18/customers');
    await page
        .getByRole('button', {
            name: 'Zarządzaj tagami klienta: Klient syntetyczny A',
        })
        .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('VIP test')).toBeVisible();
    await dialog
        .getByRole('button', { name: 'Przypisz tag Koloryzacja test' })
        .click();
    await expect(
        dialog.getByRole('button', {
            name: 'Usuń tag Koloryzacja test od klienta',
        }),
    ).toBeVisible();
    await dialog
        .getByRole('button', { name: 'Usuń tag VIP test od klienta' })
        .click();
    await expect(
        dialog.getByRole('button', { name: 'Przypisz tag VIP test' }),
    ).toBeVisible();

    await dialog
        .getByLabel('Nowy tag w katalogu CRM')
        .fill('Zabieg testowy');
    await dialog.getByRole('button', { name: 'Utwórz tag' }).click();
    await expect(
        dialog.getByRole('button', { name: 'Przypisz tag Zabieg testowy' }),
    ).toBeVisible();
    expect(recordedWrites).toEqual([
        { method: 'POST', url: '/api/customers/99001/tags' },
        { method: 'DELETE', url: '/api/customers/99001/tags/7' },
        { method: 'POST', url: '/api/customer-tags' },
    ]);
    await page.screenshot({
        path: testInfo.outputPath('v18-tags-synthetic-only.png'),
        fullPage: true,
    });
});
