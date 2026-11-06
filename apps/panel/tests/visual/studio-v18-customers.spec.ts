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

    await expect(
        page.getByRole('button', {
            name: 'Umów wizytę klienta: Klient syntetyczny A',
        }),
    ).toBeVisible();
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
    await page.getByText('Filtry zaawansowane', { exact: true }).click();
    await page.getByRole('combobox', { name: 'Płeć' }).selectOption('female');
    await page.getByRole('spinbutton', { name: 'Wiek od' }).fill('25');
    await page.getByRole('spinbutton', { name: 'Wydatki do' }).fill('250.5');
    await expect.poll(
        () =>
            customerRequests.some((url) => {
                const params = new URL(url).searchParams;
                return (
                    params.get('gender') === 'female' &&
                    params.get('ageMin') === '25' &&
                    params.get('spentMax') === '250.5' &&
                    params.get('smsConsent') === 'false' &&
                    params.get('tagId') === '9'
                );
            }),
    ).toBe(true);

    await page.getByRole('button', { name: 'Wyczyść filtry' }).click();
    await expect(page.getByRole('combobox', { name: 'Płeć' })).toHaveValue('');
    await expect(page.getByRole('spinbutton', { name: 'Wiek od' })).toHaveValue('');
    await expect(page.getByRole('spinbutton', { name: 'Wydatki do' })).toHaveValue('');
    await expect(consent).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('combobox', { name: 'Tag klienta' })).toHaveValue('');

    await page.getByRole('button', { name: 'Bez rezerwacji online' }).click();
    await expect.poll(
        () =>
            customerRequests.some(
                (url) =>
                    new URL(url).searchParams.get('noOnlineReservations') === 'true',
            ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Bez rezerwacji online' }).click();


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

test('advanced filter layout stays aligned within the panel at varied widths', async ({
    page,
}, testInfo) => {
    await page.goto('/studio-v18/customers');
    await expect(page.getByText('Klient syntetyczny A')).toBeVisible();
    await page.getByText('Filtry zaawansowane', { exact: true }).click();

    const disclosure = page.locator('details').filter({
        has: page.getByText('Filtry zaawansowane', { exact: true }),
    });
    await expect(disclosure).toHaveAttribute('open', '');

    for (const [width, expectedColumns] of [
        [390, 1],
        [768, 1],
        [1024, 2],
        [1366, 3],
    ]) {
        await page.setViewportSize({ width, height: 900 });

        const layout = await disclosure.evaluate((element) => {
            const content = element.querySelector(':scope > div');
            if (!content) throw new Error('Missing advanced-filter grid');

            const panelRect = element.getBoundingClientRect();
            const blocks = Array.from(content.children).filter(
                (child) =>
                    child.tagName === 'LABEL' || child.tagName === 'FIELDSET',
            );
            const blockRects = blocks.map((block) =>
                block.getBoundingClientRect(),
            );
            const controls = Array.from(
                content.querySelectorAll('input, select'),
            );
            const controlRects = controls.map((control) =>
                control.getBoundingClientRect(),
            );
            // Compare the actual vertical input offsets within each of the
            // three groups, even if responsive wrapping puts them in new rows.
            const verticalControlOffsets = blocks.map((block) => {
                const control = block.querySelector('input, select');
                if (!control) throw new Error('Group without a filter control');
                return (
                    control.getBoundingClientRect().top -
                    block.getBoundingClientRect().top
                );
            });
            const firstControls = blocks.map((block) => {
                const control = block.querySelector('input, select');
                if (!control) throw new Error('Group without a filter control');
                return control.getBoundingClientRect();
            });

            const overlaps = blockRects.some((a, index) =>
                blockRects.some(
                    (b, otherIndex) =>
                        otherIndex > index &&
                        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
                ),
            );
            const outOfBounds = [...blockRects, ...controlRects].some(
                (rect) =>
                    rect.width < 1 ||
                    rect.left < panelRect.left - 1 ||
                    rect.right > panelRect.right + 1,
            );

            return {
                columns: getComputedStyle(content)
                    .gridTemplateColumns.split(/\s+/)
                    .filter(Boolean).length,
                blockCount: blockRects.length,
                controlCount: controlRects.length,
                overlaps,
                outOfBounds,
                horizontalOverflow: element.scrollWidth > element.clientWidth + 1,
                verticalControlOffsets,
                alignedOnSameRow: blockRects.every((rect, i) =>
                    blockRects.every((next, j) =>
                        i >= j ||
                        Math.abs(rect.top - next.top) > 2 ||
                        Math.abs(firstControls[i].top - firstControls[j].top) <= 2,
                    ),
                ),
            };
        });

        expect(layout.blockCount).toBe(3);
        expect(layout.controlCount).toBe(5);
        expect(layout.columns).toBe(expectedColumns);
        expect(layout.overlaps).toBe(false);
        expect(layout.outOfBounds).toBe(false);
        expect(layout.horizontalOverflow).toBe(false);
        // Regression for the owner screenshot: gender used to sit about one
        // label-height above the age and spending inputs.
        expect(
            Math.max(...layout.verticalControlOffsets) -
                Math.min(...layout.verticalControlOffsets),
        ).toBeLessThanOrEqual(2);
        expect(layout.alignedOnSameRow).toBe(true);

        if (width === 390 || width === 1366) {
            await disclosure.screenshot({
                path: testInfo.outputPath(`advanced-filters-layout-${width}.png`),
            });
        }
    }
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

    const tagFilteredRequests: string[] = [];
    await page.route(/\/api\/customers(?:\?.*)?$/, async (route) => {
        if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
        }
        const url = new URL(route.request().url());
        const tagId = Number(url.searchParams.get('tagId') || '0');
        if (tagId) tagFilteredRequests.push(url.toString());
        const rows = tagId
            ? assigned.some((tag) => tag.id === tagId)
                ? [customers[0]]
                : []
            : customers;
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
        .getByLabel('Nowy tag dla tego klienta')
        .fill('Zabieg testowy');
    await dialog.getByRole('button', { name: 'Utwórz i przypisz' }).click();
    await expect(
        dialog.getByRole('button', {
            name: 'Usuń tag Zabieg testowy od klienta',
        }),
    ).toBeVisible();
    await dialog
        .getByRole('button', { name: 'Zamknij zarządzanie tagami' })
        .click();
    await page.getByRole('combobox', { name: 'Tag klienta' }).selectOption('11');
    await expect(page.getByText('Klient syntetyczny A')).toBeVisible();
    await expect(page.getByText('Klient syntetyczny B')).toHaveCount(0);
    await expect.poll(
        () =>
            tagFilteredRequests.some(
                (url) => new URL(url).searchParams.get('tagId') === '11',
            ),
    ).toBe(true);
    expect(recordedWrites).toEqual([
        { method: 'POST', url: '/api/customers/99001/tags' },
        { method: 'DELETE', url: '/api/customers/99001/tags/7' },
        { method: 'POST', url: '/api/customer-tags' },
        { method: 'POST', url: '/api/customers/99001/tags' },
    ]);
    await page.screenshot({
        path: testInfo.outputPath('v18-tags-synthetic-only.png'),
        fullPage: true,
    });
});

test('group editor creates a selected-page group and edits its metadata safely', async ({
    page,
}, testInfo) => {
    const groups = [
        {
            id: 7,
            name: 'VIP test',
            description: 'Syntetyczna grupa',
            color: '#67538a',
            parentId: null,
            discountPercent: 5,
            memberCount: 1,
        },
    ];
    const writes: Array<{
        method: string;
        path: string;
        body: Record<string, unknown>;
    }> = [];

    await page.route('**/api/customer-groups', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
            const body = request.postDataJSON() as Record<string, unknown>;
            writes.push({
                method: 'POST',
                path: '/api/customer-groups',
                body,
            });
            const created = { ...body, id: 18, memberCount: 2 };
            groups.push(created as (typeof groups)[number]);
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groups),
        });
    });
    await page.route('**/api/customer-groups/7', async (route) => {
        const body = route.request().postDataJSON() as Record<string, unknown>;
        writes.push({
            method: route.request().method(),
            path: '/api/customer-groups/7',
            body,
        });
        groups[0] = { ...groups[0], ...body };
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groups[0]),
        });
    });

    await page.goto('/studio-v18/customers');
    await page
        .getByRole('checkbox', { name: 'Zaznacz klientów na stronie' })
        .check();
    await page
        .getByRole('button', { name: 'Nowa grupa z zaznaczonych' })
        .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Nazwa grupy').fill('Nowa grupa testowa');
    await dialog
        .getByLabel('Grupa nadrzędna')
        .selectOption('7');
    await dialog.getByLabel('Stały rabat (%)').fill('10');
    await dialog
        .getByRole('checkbox', {
            name: /Przypisz zaznaczonych klientów z bieżącej strony/,
        })
        .check();
    await dialog.getByRole('button', { name: 'Utwórz grupę' }).click();
    await expect(
        dialog.getByRole('status', { name: '' }).first(),
    ).toContainText('Grupa została utworzona.');
    await expect(
        dialog.getByRole('button', { name: 'Edytuj grupę Nowa grupa testowa' }),
    ).toBeVisible();

    await dialog
        .getByRole('button', { name: 'Edytuj grupę VIP test' })
        .click();
    await dialog.getByLabel('Nazwa grupy').fill('VIP zaktualizowane');
    await dialog
        .getByRole('button', { name: 'Zapisz grupę' })
        .click();
    await expect(
        dialog.getByRole('status', { name: '' }).first(),
    ).toContainText('Zmiany grupy zostały zapisane.');

    expect(writes).toEqual([
        {
            method: 'POST',
            path: '/api/customer-groups',
            body: {
                name: 'Nowa grupa testowa',
                description: '',
                color: '#67538a',
                parentId: 7,
                discountPercent: 10,
                memberIds: [99001, 99002],
            },
        },
        {
            method: 'PUT',
            path: '/api/customer-groups/7',
            body: {
                name: 'VIP zaktualizowane',
                description: 'Syntetyczna grupa',
                color: '#67538a',
                parentId: null,
                discountPercent: 5,
            },
        },
    ]);
    await dialog
        .getByRole('button', { name: 'Zamknij zarządzanie grupami' })
        .click();
    await expect(
        page.getByRole('combobox', { name: 'Grupa klientów' }),
    ).toContainText('Nowa grupa testowa');
    await page.screenshot({
        path: testInfo.outputPath('v18-groups-synthetic-only.png'),
        fullPage: true,
    });
});

test('tag catalog edits shared definitions without touching customer assignments', async ({
    page,
}, testInfo) => {
    const catalog = [
        {
            id: 9,
            name: 'Koloryzacja',
            color: '#67538a',
            createdAt: '2026-01-01T00:00:00Z',
        },
    ];
    const writes: Array<{
        method: string;
        path: string;
        body: Record<string, unknown>;
    }> = [];

    await page.route('**/api/customer-tags', async (route) => {
        const request = route.request();
        if (request.method() === 'POST') {
            const body = request.postDataJSON() as {
                name: string;
                color: string;
            };
            const created = {
                id: 15,
                ...body,
                createdAt: '2026-01-01T00:00:00Z',
            };
            catalog.push(created);
            writes.push({
                method: 'POST',
                path: '/api/customer-tags',
                body,
            });
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(catalog),
        });
    });
    await page.route('**/api/customer-tags/9', async (route) => {
        const request = route.request();
        const body = request.postDataJSON() as {
            name: string;
            color: string;
        };
        writes.push({
            method: request.method(),
            path: '/api/customer-tags/9',
            body,
        });
        catalog[0] = { ...catalog[0], ...body };
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(catalog[0]),
        });
    });

    await page.goto('/studio-v18/customers');
    await page
        .getByRole('button', { name: 'Zarządzaj tagami', exact: true })
        .click();
    const dialog = page.getByRole('dialog');
    await expect(
        dialog.getByRole('button', { name: 'Edytuj tag Koloryzacja' }),
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Edytuj tag Koloryzacja' }).click();
    await dialog.getByLabel('Nazwa tagu').fill('Koloryzacja premium');
    await dialog.getByLabel('Kolor tagu').fill('#aabbcc');
    await dialog.getByRole('button', { name: 'Zapisz tag' }).click();
    await expect(
        dialog.getByRole('button', { name: 'Edytuj tag Koloryzacja premium' }),
    ).toBeVisible();

    // The catalog uses the original tag ID; this keeps existing assignments.
    await expect(
        page.getByRole('combobox', { name: 'Tag klienta' }),
    ).toContainText('Koloryzacja premium');

    await dialog.getByLabel('Nazwa tagu').fill('KOLORYZACJA PREMIUM');
    await expect(
        dialog.getByRole('button', { name: 'Utwórz tag' }),
    ).toBeDisabled();

    await dialog.getByLabel('Nazwa tagu').fill('Pielęgnacja');
    await dialog.getByRole('button', { name: 'Utwórz tag' }).click();
    await expect(
        dialog.getByRole('button', { name: 'Edytuj tag Pielęgnacja' }),
    ).toBeVisible();

    expect(writes).toEqual([
        {
            method: 'PUT',
            path: '/api/customer-tags/9',
            body: { name: 'Koloryzacja premium', color: '#aabbcc' },
        },
        {
            method: 'POST',
            path: '/api/customer-tags',
            body: { name: 'Pielęgnacja', color: '#67538a' },
        },
    ]);
    await dialog.screenshot({
        path: testInfo.outputPath('v18-tag-catalog-synthetic.png'),
    });
    await dialog
        .getByRole('button', { name: 'Zamknij katalog tagów' })
        .click();
});

test('group hierarchy reorders siblings and confirms deletion without removing customers', async ({
    page,
}, testInfo) => {
    const groups = [
        {
            id: 7,
            name: 'Stali',
            parentId: null,
            sortOrder: 0,
            discountPercent: 8,
            color: '#67538a',
            memberCount: 1,
        },
        {
            id: 8,
            name: 'Lojalni',
            parentId: null,
            sortOrder: 1,
            discountPercent: 5,
            color: '#67538a',
            memberCount: 2,
        },
        {
            id: 9,
            name: 'VIP junior',
            parentId: 7,
            sortOrder: 0,
            discountPercent: 2,
            color: '#67538a',
            memberCount: 1,
        },
    ];
    const writes: Array<{
        method: string;
        path: string;
        body?: Record<string, unknown>;
    }> = [];

    await page.route('**/api/customer-groups', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groups),
        });
    });
    await page.route('**/api/customer-groups/sort', async (route) => {
        const body = route.request().postDataJSON() as {
            items: Array<{
                id: number;
                parentId: number | null;
                sortOrder: number;
            }>;
        };
        writes.push({
            method: route.request().method(),
            path: '/api/customer-groups/sort',
            body,
        });
        for (const item of body.items) {
            const group = groups.find((candidate) => candidate.id === item.id);
            if (group) {
                group.sortOrder = item.sortOrder;
                group.parentId = item.parentId;
            }
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(groups),
        });
    });
    await page.route('**/api/customer-groups/8', async (route) => {
        writes.push({
            method: route.request().method(),
            path: '/api/customer-groups/8',
        });
        const index = groups.findIndex((group) => group.id === 8);
        if (index >= 0) groups.splice(index, 1);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
        });
    });

    await page.goto('/studio-v18/customers');
    await page.getByRole('button', { name: 'Zarządzaj grupami' }).click();
    const dialog = page.getByRole('dialog');

    await expect(
        dialog.getByRole('button', { name: 'Edytuj grupę VIP junior' }),
    ).toBeVisible();
    await expect(
        dialog.getByRole('button', { name: 'Usuń grupę Stali' }),
    ).toBeDisabled();

    await dialog.getByRole('button', { name: 'Zmień kolejność' }).click();
    await dialog
        .getByRole('button', { name: 'Przesuń grupę Lojalni w górę' })
        .click();
    await dialog.getByRole('button', { name: 'Zapisz kolejność' }).click();
    await expect(dialog.getByText('Kolejność grup została zapisana.')).toBeVisible();

    expect(writes[0]).toEqual({
        method: 'POST',
        path: '/api/customer-groups/sort',
        body: {
            items: [
                { id: 8, parentId: null, sortOrder: 0 },
                { id: 7, parentId: null, sortOrder: 1 },
                { id: 9, parentId: 7, sortOrder: 0 },
            ],
        },
    });

    await dialog.getByRole('button', { name: 'Usuń grupę Lojalni' }).click();
    await expect(
        dialog.getByText('Konta klientów i historia wizyt pozostaną bez zmian.', {
            exact: false,
        }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Anuluj', exact: true }).click();
    expect(writes).toHaveLength(1);

    await dialog.getByRole('button', { name: 'Usuń grupę Lojalni' }).click();
    await dialog.getByRole('button', { name: 'Potwierdź usunięcie' }).click();
    await expect(dialog.getByText('Grupa została usunięta.', {
        exact: false,
    })).toBeVisible();

    expect(writes).toEqual([
        {
            method: 'POST',
            path: '/api/customer-groups/sort',
            body: {
                items: [
                    { id: 8, parentId: null, sortOrder: 0 },
                    { id: 7, parentId: null, sortOrder: 1 },
                    { id: 9, parentId: 7, sortOrder: 0 },
                ],
            },
        },
        { method: 'DELETE', path: '/api/customer-groups/8' },
    ]);
    await expect(
        dialog.getByRole('button', { name: 'Edytuj grupę VIP junior' }),
    ).toBeVisible();
    await dialog.screenshot({
        path: testInfo.outputPath('v18-group-hierarchy-synthetic.png'),
    });
});

test('V18 customer profile shows real-hook overview and keeps the legacy fallback', async ({
    page,
}, testInfo) => {
    const unsafeWrites: string[] = [];
    page.on('request', (request) => {
        const url = new URL(request.url());
        if (
            url.pathname.startsWith('/api/') &&
            !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
        ) {
            unsafeWrites.push(request.method() + ' ' + url.pathname);
        }
    });

    await page.route('**/api/customers/99001', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ...customers[0],
                phone: '123456789',
                email: 'a@example.invalid',
                gdprConsent: true,
                smsConsent: false,
                emailConsent: true,
                whatsappConsent: false,
                groups: [
                    {
                        id: 7,
                        name: 'VIP test',
                        discountPercent: 10,
                        parentId: null,
                    },
                ],
            }),
        });
    });
    await page.route('**/api/customers/99001/statistics', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                totalVisits: 6,
                completedVisits: 5,
                totalSpent: 420,
                lastVisitDate: '2026-10-09T10:00:00Z',
            }),
        });
    });
    await page.route('**/api/customers/99001/tags', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 9,
                    name: 'Koloryzacja test',
                    color: '#67538a',
                },
            ]),
        });
    });

    await page.goto('/studio-v18/customers');
    const customerLink = page.getByRole('link', {
        name: 'Klient syntetyczny A',
        exact: true,
    });
    await expect(customerLink).toHaveAttribute(
        'href',
        '/studio-v18/customers/99001',
    );
    await customerLink.click();

    await expect(page).toHaveURL(/\/studio-v18\/customers\/99001$/);
    await expect(
        page.getByRole('heading', { name: 'Klient syntetyczny A' }),
    ).toBeVisible();

    await expect(page.getByRole('region', { name: 'Dane klienta' })).toContainText(
        'a@example.invalid',
    );
    await expect(
        page.getByRole('region', { name: 'Statystyki klienta' }),
    ).toContainText('420');
    await expect(
        page.getByRole('region', { name: 'Grupy i tagi klienta' }),
    ).toContainText('VIP test');
    await expect(
        page.getByRole('region', { name: 'Grupy i tagi klienta' }),
    ).toContainText('Koloryzacja test');

    await expect(
        page.getByRole('region', { name: 'Zgody klienta' }),
    ).toContainText('RODO');
    await expect(
        page.getByRole('link', { name: 'Otwórz pełną kartę klienta' }),
    ).toHaveAttribute('href', '/customers/99001');
    await expect(
        page.getByRole('button', { name: 'Umów wizytę' }),
    ).toBeVisible();
    expect(unsafeWrites).toEqual([]);

    await page.screenshot({
        path: testInfo.outputPath('v18-customer-profile-synthetic.png'),
        fullPage: true,
    });
    await page
        .getByRole('link', { name: 'Wróć do klientów V18' })
        .click();
    await expect(
        page.getByRole('heading', { name: 'Klienci V18' }),
    ).toBeVisible();
});

test('V18 customer profile rejects invalid identifiers before requesting customer data', async ({
    page,
}) => {
    const customerRequests: string[] = [];
    page.on('request', (request) => {
        if (new URL(request.url()).pathname.startsWith('/api/customers/')) {
            customerRequests.push(request.url());
        }
    });
    const response = await page.goto('/studio-v18/customers/not-a-number');
    expect(response?.status()).toBe(404);
    expect(customerRequests).toEqual([]);
});

test('V18 editor changes supported fields and preserves consents via existing customer API', async ({
    page,
}, testInfo) => {
    let customer = {
        ...customers[0],
        firstName: 'Anna',
        lastName: 'Testowa',
        emailConsent: false,
        gdprConsent: true,
        smsConsent: false,
        whatsappConsent: false,
        termsConsent: true,
        notifyPanel: true,
        discountPercent: 10,
    };
    const writes: Array<Record<string, unknown>> = [];

    await page.route('**/api/customers/99001', async (route) => {
        const method = route.request().method();
        if (method === 'PUT') {
            const body = route.request().postDataJSON() as Record<
                string,
                unknown
            >;
            writes.push(body);
            customer = { ...customer, ...body } as typeof customer;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(customer),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(customer),
        });
    });

    await page.goto('/studio-v18/customers/99001');
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    const editor = page.getByTestId('v18-customer-editor');
    await expect(editor).toBeVisible();
    await expect(
        editor.getByRole('heading', { name: 'Edycja klienta' }),
    ).toBeVisible();
    await expect(editor.getByLabel('Imię', { exact: true })).toHaveValue('Anna');
    await expect(editor.getByLabel('Imię', { exact: true })).toHaveCSS(
        'border-radius',
        '11px',
    );
    // These were inert fields in the legacy form, not accepted by the
    // existing Create/UpdateCustomerDto. V18 intentionally does not show them.
    await expect(editor.getByLabel('9. Nr domu')).toHaveCount(0);
    await expect(editor.getByLabel('17. PESEL')).toHaveCount(0);

    await editor.getByLabel('Imię', { exact: true }).fill('Natalia');
    await editor.getByLabel('Zgoda na marketing email').check();
    await editor.getByRole('button', { name: 'zapisz zmiany' }).click();
    await expect(editor).toHaveCount(0);

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
        firstName: 'Natalia',
        lastName: 'Testowa',
        emailConsent: true,
        gdprConsent: true,
        smsConsent: false,
        whatsappConsent: false,
        termsConsent: true,
        discountPercent: 10,
    });
    expect(writes[0]).not.toHaveProperty('groups');
    expect(writes[0]).not.toHaveProperty('pesel');
    expect(writes[0]).not.toHaveProperty('buildingNo');

    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    await expect(editor.getByLabel('Imię', { exact: true })).toHaveValue('Natalia');
    await editor.screenshot({
        path: testInfo.outputPath('v18-edit-customer-synthetic.png'),
    });
    await editor.getByRole('button', { name: 'Zamknij edycję klienta' }).click();
});

test('V18 editor requires deletion confirmation and cancels safely', async ({
    page,
}) => {
    let deletes = 0;
    await page.route('**/api/customers/99001', async (route) => {
        if (route.request().method() === 'DELETE') {
            deletes += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true }),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...customers[0], firstName: 'Anna' }),
        });
    });
    await page.goto('/studio-v18/customers/99001');
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    const editor = page.getByTestId('v18-customer-editor');
    await editor.getByRole('button', { name: 'Usuń klienta' }).click();
    await expect(
        editor.getByRole('button', { name: 'Potwierdź usunięcie' }),
    ).toBeVisible();
    await editor.getByRole('button', { name: 'Anuluj usuwanie' }).click();
    expect(deletes).toBe(0);

    await editor.getByRole('button', { name: 'Usuń klienta' }).click();
    await editor.getByRole('button', { name: 'Potwierdź usunięcie' }).click();
    await expect(page).toHaveURL(/\/studio-v18\/customers$/);
    expect(deletes).toBe(1);
});

test('V18 editor keeps draft editable when CRM save fails', async ({
    page,
}) => {
    let attempts = 0;
    const customer = { ...customers[0], firstName: 'Anna' };
    await page.route('**/api/customers/99001', async (route) => {
        if (route.request().method() === 'PUT') {
            attempts += 1;
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Synthetic failure' }),
            });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(customer),
        });
    });
    await page.goto('/studio-v18/customers/99001');
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    const editor = page.getByTestId('v18-customer-editor');
    await editor.getByLabel('Imię', { exact: true }).fill('Natalia');
    await editor.getByRole('button', { name: 'zapisz zmiany' }).click();
    await expect(editor.getByRole('alert').first()).toBeVisible();
    await expect(editor.getByLabel('Imię', { exact: true })).toHaveValue('Natalia');
    await expect(
        editor.getByRole('button', { name: 'zapisz zmiany' }),
    ).toBeEnabled();
    expect(attempts).toBe(1);
    await editor.getByRole('button', { name: 'Zamknij edycję klienta' }).click();
    await page.getByRole('button', { name: 'Edytuj klienta' }).click();
    await expect(editor.getByLabel('Imię', { exact: true })).toHaveValue('Anna');
});

test('V18 booking opens from customer list with preselected client and does not write on cancel', async ({
    page,
}, testInfo) => {
    const writes: string[] = [];
    page.on('request', (request) => {
        if (
            new URL(request.url()).pathname.startsWith('/api/') &&
            !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
        ) {
            writes.push(request.method() + ' ' + request.url());
        }
    });
    await page.route('**/api/services?*', async (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 501,
                    name: 'Strzyżenie syntetyczne',
                    duration: 45,
                    price: 110,
                    isActive: true,
                },
            ]),
        }),
    );
    await page.route('**/api/employees', async (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 711, name: 'Stylistka testowa' }]),
        }),
    );
    await page.goto('/studio-v18/customers');
    await page
        .getByRole('button', {
            name: 'Umów wizytę klienta: Klient syntetyczny A',
        })
        .click();
    const dialog = page.getByRole('dialog', {
        name: 'Rezerwacja wizyty V18',
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('CRM V18')).toBeVisible();
    await expect(dialog.getByTestId('v18-selected-customer')).toContainText(
        'Klient syntetyczny A',
    );
    await expect(dialog.locator('#appointment-client')).toHaveCount(0);
    await expect(dialog.getByRole('searchbox', { name: 'Szukaj klienta' })).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Zmień klienta' }).click();
    await expect(dialog.locator('#appointment-client')).toHaveValue('99001');
    await dialog.getByRole('button', { name: 'Dodaj nowego klienta' }).click();
    await expect(dialog.getByPlaceholder('Imię', { exact: true })).toBeVisible();
    await dialog
        .getByRole('button', { name: 'Ukryj szybkie dodawanie klienta' })
        .click();
    await expect(dialog.locator('#appointment-employee')).toHaveValue('711');
    await expect(dialog.locator('#appointment-employee')).toHaveCSS(
        'border-radius',
        '12px',
    );
    await dialog.screenshot({
        path: testInfo.outputPath('v18-booking-list-synthetic.png'),
    });
    await dialog.getByRole('button', { name: 'Zamknij' }).click();
    await expect(dialog).toHaveCount(0);
    expect(writes).toEqual([]);
    await expect(page).toHaveURL(/\/studio-v18\/customers$/);
});

test('V18 booking reuses server conflict approval and creates one appointment from customer profile', async ({
    page,
}, testInfo) => {
    const bookingWrites: Array<Record<string, unknown>> = [];
    let conflictChecks = 0;
    await page.route('**/api/customers/99001', async (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(customers[0]),
        }),
    );
    await page.route('**/api/services?*', async (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: 501,
                    name: 'Strzyżenie syntetyczne',
                    duration: 45,
                    price: 110,
                    isActive: true,
                },
            ]),
        }),
    );
    await page.route('**/api/employees', async (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 711, name: 'Stylistka testowa' }]),
        }),
    );
    await page.route('**/api/calendar/conflicts?*', async (route) => {
        conflictChecks += 1;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                hasConflict: true,
                conflictingEvents: [{ id: 9000, title: 'Blokada syntetyczna' }],
            }),
        });
    });
    await page.route('**/api/appointments', async (route) => {
        expect(route.request().method()).toBe('POST');
        bookingWrites.push(
            route.request().postDataJSON() as Record<string, unknown>,
        );
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
                id: 90001,
                status: 'scheduled',
                ...bookingWrites[bookingWrites.length - 1],
            }),
        });
    });

    await page.goto('/studio-v18/customers/99001');
    await page.getByRole('button', { name: 'Umów wizytę' }).click();
    const dialog = page.getByRole('dialog', {
        name: 'Rezerwacja wizyty V18',
    });
    await expect(dialog.getByTestId('v18-selected-customer')).toContainText(
        'Klient syntetyczny A',
    );
    await expect(dialog.locator('#appointment-client')).toHaveCount(0);
    await expect(dialog.locator('#appointment-employee')).toHaveValue('711');
    const service = dialog.getByRole('combobox', { name: 'Usługa' });
    await service.click();
    await dialog
        .getByRole('option', { name: /Strzyżenie syntetyczne/ })
        .click();
    await expect(service).toHaveValue('Strzyżenie syntetyczne');
    await dialog.locator('#appointment-start-time').fill('12.11.2026, 14:30');
    await dialog.screenshot({
        path: testInfo.outputPath('v18-booking-profile-synthetic.png'),
    });
    await dialog.getByRole('button', { name: 'Utwórz wizytę' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Dodaj mimo to');
    expect(bookingWrites).toHaveLength(0);

    await dialog.getByRole('button', { name: 'Dodaj mimo to' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/studio-v18\/customers\/99001$/);
    expect(conflictChecks).toBe(1);
    expect(bookingWrites).toHaveLength(1);
    expect(bookingWrites[0]).toMatchObject({
        clientId: 99001,
        employeeId: 711,
        serviceId: 501,
        forceOverlap: true,
    });
    expect(
        String(bookingWrites[0].startTime).startsWith('2026-11-12T'),
    ).toBe(true);
});
