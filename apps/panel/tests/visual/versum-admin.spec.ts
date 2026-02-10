import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type TestInfo } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import sharp from 'sharp';

type VisualScreen = {
    key: string;
    route: string;
    reference: string;
};

const screens: VisualScreen[] = [
    {
        key: 'calendar',
        route: '/calendar',
        reference: 'Screenshot 2026-02-03 at 21.24.56.png',
    },
    {
        key: 'clients',
        route: '/clients',
        reference: 'Screenshot 2026-02-03 at 21.25.23.png',
    },
    {
        key: 'products',
        route: '/products',
        reference: 'Screenshot 2026-02-03 at 21.25.34.png',
    },
    {
        key: 'statistics',
        route: '/statistics',
        reference: 'Screenshot 2026-02-03 at 21.25.44.png',
    },
    {
        key: 'services',
        route: '/services',
        reference: 'Screenshot 2026-02-03 at 21.25.55.png',
    },
    {
        key: 'communication',
        route: '/communication',
        reference: 'Screenshot 2026-02-03 at 21.27.20.png',
    },
    {
        key: 'settings',
        route: '/settings',
        reference: 'Screenshot 2026-02-03 at 21.27.30.png',
    },
    {
        key: 'extension',
        route: '/extension',
        reference: 'Screenshot 2026-02-03 at 21.27.42.png',
    },
];

const CRITICAL_TOPBAR_HEIGHT = 42;
const CRITICAL_SIDEBAR_WIDTH = 62 + 214;

const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const referenceRoot = path.resolve(
    projectRoot,
    'static_preview',
    'screenshots',
);

test.beforeEach(async ({ context, page, baseURL }) => {
    const targetUrl = baseURL ?? 'http://127.0.0.1:3000';
    const targetHost = new URL(targetUrl).host;

    await context.addCookies([
        { name: 'sbw_auth', value: 'true', url: targetUrl },
        { name: 'accessToken', value: 'visual-token', url: targetUrl },
        { name: 'refreshToken', value: 'visual-refresh', url: targetUrl },
    ]);

    await page.addInitScript(() => {
        const fixed = new Date('2026-02-03T11:00:00.000Z').valueOf();
        const NativeDate = Date;

        class FixedDate extends NativeDate {
            constructor(...args: ConstructorParameters<typeof Date>) {
                if (args.length === 0) {
                    super(fixed);
                    return;
                }
                super(...args);
            }

            static now() {
                return fixed;
            }

            static parse(value: string) {
                return NativeDate.parse(value);
            }

            static UTC(...args: Parameters<typeof Date.UTC>) {
                return NativeDate.UTC(...args);
            }
        }

        // @ts-expect-error test-only override
        window.Date = FixedDate;

        const style = document.createElement('style');
        style.innerHTML = `
            *,*::before,*::after{animation:none!important;transition:none!important;}
            nextjs-portal,
            [data-nextjs-dev-tools-button],
            button[aria-label="Open Next.js Dev Tools"]{
                display:none!important;
                visibility:hidden!important;
            }
        `;
        document.head.appendChild(style);

        window.localStorage.setItem('jwtToken', 'visual-token');
        window.localStorage.setItem('refreshToken', 'visual-refresh');
    });

    await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());

        // Keep tests deterministic: block external hosts (fonts, GTM, etc.).
        if (
            url.host !== targetHost &&
            !url.hostname.includes('api.salon-bw.pl')
        ) {
            await route.abort();
            return;
        }

        // Allow the vendored calendar bootstrap HTML and static assets to load normally.
        if (
            url.pathname === '/api/calendar-embed' ||
            url.pathname.startsWith('/versum-calendar/')
        ) {
            await route.continue();
            return;
        }

        const apiPath = normalizeApiPath(url);

        if (!apiPath) {
            await route.continue();
            return;
        }

        if (apiPath === '/users/profile') {
            await fulfillJson(route, {
                id: 1,
                email: 'admin@salon-bw.pl',
                name: 'Gniewko Bodora',
                role: 'admin',
            });
            return;
        }

        // Versum compat calendar endpoints (used by the vendored embed on `/calendar`)
        if (
            apiPath.startsWith('/events') &&
            !apiPath.includes('screen_data') &&
            !apiPath.includes('finalize')
        ) {
            await fulfillJson(route, []);
            return;
        }
        if (apiPath.includes('/settings/timetable/schedules')) {
            await fulfillJson(route, {});
            return;
        }
        if (apiPath.includes('track_new_events')) {
            await fulfillJson(route, { events: [] });
            return;
        }
        if (apiPath === '/graphql') {
            const body = route.request().postDataJSON() as {
                operationName?: string;
            };
            const operationName = body?.operationName ?? '';

            switch (operationName) {
                case 'GetViewer':
                    await fulfillJson(route, {
                        data: {
                            viewer: {
                                branch: {
                                    resourcesActivated: false,
                                    currency: 'PLN',
                                    vatRates: [23, 8, 5, 0],
                                    vatPayer: true,
                                },
                                abilities: [],
                            },
                        },
                    });
                    return;
                case 'GetEmployees':
                    await fulfillJson(route, {
                        data: {
                            employees: { items: [] },
                        },
                    });
                    return;
                default:
                    await fulfillJson(route, { data: {} });
                    return;
            }
        }

        if (apiPath.startsWith('/calendar/events')) {
            await fulfillJson(route, {
                events: [
                    {
                        id: 101,
                        type: 'appointment',
                        title: 'Matuszkiewicz Teresa',
                        startTime: '2026-02-03T14:00:00.000Z',
                        endTime: '2026-02-03T16:00:00.000Z',
                        employeeId: 1,
                        employeeName: 'Aleksandra Bodora',
                        clientName: 'Matuszkiewicz Teresa',
                    },
                    {
                        id: 102,
                        type: 'appointment',
                        title: 'Nierobi Marta',
                        startTime: '2026-02-03T15:00:00.000Z',
                        endTime: '2026-02-03T16:00:00.000Z',
                        employeeId: 1,
                        employeeName: 'Aleksandra Bodora',
                        clientName: 'Nierobi Marta',
                    },
                ],
                employees: [
                    {
                        id: 1,
                        name: 'Aleksandra Bodora',
                        color: '#f3a8c8',
                    },
                ],
                dateRange: {
                    start: '2026-02-03T00:00:00.000Z',
                    end: '2026-02-04T00:00:00.000Z',
                },
            });
            return;
        }

        if (apiPath.startsWith('/employees')) {
            await fulfillJson(route, [
                {
                    id: 1,
                    name: 'Aleksandra Bodora',
                    firstName: 'Aleksandra',
                    lastName: 'Bodora',
                },
            ]);
            return;
        }

        if (apiPath.startsWith('/customers')) {
            await fulfillJson(route, {
                items: [
                    {
                        id: 1,
                        name: 'Marzena Adamska',
                        email: 'marzena@example.com',
                        phone: '+48 691 433 821',
                        smsConsent: true,
                        emailConsent: true,
                        gdprConsent: true,
                        createdAt: '2026-01-10T11:00:00.000Z',
                        updatedAt: '2026-01-10T11:00:00.000Z',
                    },
                    {
                        id: 2,
                        name: 'Piotr Adamski',
                        email: 'piotr@example.com',
                        phone: '+48 601 433 822',
                        smsConsent: true,
                        emailConsent: true,
                        gdprConsent: true,
                        createdAt: '2026-01-23T10:45:00.000Z',
                        updatedAt: '2026-01-23T10:45:00.000Z',
                    },
                ],
                total: 784,
                page: 1,
                limit: 20,
                totalPages: 40,
            });
            return;
        }

        if (apiPath.startsWith('/product-categories/tree')) {
            await fulfillJson(route, [
                {
                    id: 1,
                    name: 'Londa',
                    sortOrder: 1,
                    isActive: true,
                    children: [],
                },
                {
                    id: 2,
                    name: 'Nioxin',
                    sortOrder: 2,
                    isActive: true,
                    children: [],
                },
            ]);
            return;
        }

        if (apiPath.startsWith('/products')) {
            await fulfillJson(route, [
                {
                    id: 1,
                    name: 'Invigo odżywka zimny blond(200ml)',
                    unitPrice: 0,
                    stock: 0,
                    vatRate: 23,
                    categoryId: 1,
                    productType: 'product',
                    category: {
                        id: 1,
                        name: 'brak kategorii',
                        sortOrder: 1,
                        isActive: true,
                    },
                    sku: '8005610642857',
                },
                {
                    id: 2,
                    name: 'I/0 Color Touch (60 ml)',
                    unitPrice: 0,
                    stock: 0,
                    vatRate: 23,
                    categoryId: 2,
                    productType: 'supply',
                    category: {
                        id: 2,
                        name: 'Color Touch',
                        sortOrder: 2,
                        isActive: true,
                    },
                    sku: '81387089',
                },
            ]);
            return;
        }

        if (apiPath.startsWith('/statistics/dashboard')) {
            await fulfillJson(route, {
                todayRevenue: 300,
                todayAppointments: 2,
                todayCompletedAppointments: 2,
                todayNewClients: 0,
                weekRevenue: 300,
                weekAppointments: 2,
                monthRevenue: 300,
                monthAppointments: 2,
                pendingAppointments: 0,
                averageRating: 5,
            });
            return;
        }

        if (apiPath.startsWith('/statistics/employees')) {
            await fulfillJson(route, [
                {
                    employeeId: 1,
                    employeeName: 'Aleksandra Bodora',
                    revenue: 300,
                    appointments: 2,
                    completedAppointments: 2,
                    averageDuration: 120,
                    averageRevenue: 150,
                    tips: 0,
                    rating: 5,
                    reviewCount: 2,
                },
            ]);
            return;
        }

        if (apiPath.startsWith('/sms/history')) {
            await fulfillJson(route, {
                items: [
                    {
                        id: 1,
                        recipient: '+48 661 665 772',
                        channel: 'sms',
                        content: 'Twoja wizyta została dodana. Zapraszamy.',
                        status: 'delivered',
                        partsCount: 1,
                        cost: 0,
                        createdAt: '2026-02-03T17:01:00.000Z',
                        sentAt: '2026-02-03T17:01:00.000Z',
                    },
                    {
                        id: 2,
                        recipient: '+48 501 734 006',
                        channel: 'sms',
                        content: 'Przypomnienie o wizycie umówionej na jutro.',
                        status: 'sent',
                        partsCount: 1,
                        cost: 0,
                        createdAt: '2026-02-03T12:05:00.000Z',
                        sentAt: '2026-02-03T12:05:00.000Z',
                    },
                ],
                total: 139,
                page: 1,
                limit: 20,
            });
            return;
        }

        if (apiPath.startsWith('/services/with-relations')) {
            await fulfillJson(route, [
                {
                    id: 1,
                    name: 'Botox na włosy',
                    duration: 150,
                    price: 300,
                    vatRate: 23,
                    isActive: true,
                    onlineBooking: true,
                    sortOrder: 1,
                    categoryRelation: {
                        id: 1,
                        name: 'Damskie',
                        sortOrder: 1,
                        isActive: true,
                    },
                },
                {
                    id: 2,
                    name: 'Combo Strzyżenie włosów + brody + kompres',
                    duration: 90,
                    price: 130,
                    vatRate: 23,
                    isActive: true,
                    onlineBooking: true,
                    sortOrder: 1,
                    categoryRelation: {
                        id: 2,
                        name: 'Barber',
                        sortOrder: 2,
                        isActive: true,
                    },
                },
            ]);
            return;
        }

        if (apiPath.startsWith('/services')) {
            await fulfillJson(route, []);
            return;
        }

        await fulfillJson(route, []);
    });
});

for (const screen of screens) {
    test(`${screen.key} visual parity`, async ({ page }, testInfo) => {
        await page.goto(screen.route, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.versum-shell');
        await page.waitForTimeout(400);

        const viewport = page.viewportSize();
        if (!viewport) {
            throw new Error('Viewport is not available for visual test');
        }

        const actualScreenshot = await page.screenshot({ fullPage: false });

        const referencePath = path.join(referenceRoot, screen.reference);
        if (!fs.existsSync(referencePath)) {
            throw new Error(
                `Reference screenshot does not exist: ${referencePath}`,
            );
        }

        const fullRatio = await compareWithReference({
            actualBuffer: actualScreenshot,
            referencePath,
            width: viewport.width,
            height: viewport.height,
        });

        const topbarRatio = await compareWithReference({
            actualBuffer: actualScreenshot,
            referencePath,
            width: viewport.width,
            height: viewport.height,
            clip: {
                left: 0,
                top: 0,
                width: viewport.width,
                height: Math.min(CRITICAL_TOPBAR_HEIGHT, viewport.height),
            },
        });

        const sideNavRatio = await compareWithReference({
            actualBuffer: actualScreenshot,
            referencePath,
            width: viewport.width,
            height: viewport.height,
            clip: {
                left: 0,
                top: Math.min(CRITICAL_TOPBAR_HEIGHT, viewport.height),
                width: Math.min(CRITICAL_SIDEBAR_WIDTH, viewport.width),
                height: Math.max(viewport.height - CRITICAL_TOPBAR_HEIGHT, 1),
            },
        });

        await attachRatio(testInfo, `${screen.key}-full-ratio`, fullRatio);
        await attachRatio(testInfo, `${screen.key}-topbar-ratio`, topbarRatio);
        await attachRatio(
            testInfo,
            `${screen.key}-sidenav-ratio`,
            sideNavRatio,
        );

        expect(fullRatio).toBeLessThanOrEqual(0.005);
        expect(topbarRatio).toBeLessThanOrEqual(0.002);
        expect(sideNavRatio).toBeLessThanOrEqual(0.002);
    });
}

function normalizeApiPath(url: URL): string | null {
    if (url.pathname === '/api/calendar-embed') {
        return null;
    }
    if (url.pathname.startsWith('/api/')) {
        return url.pathname.replace('/api', '');
    }

    if (url.hostname.includes('api.salon-bw.pl')) {
        return url.pathname;
    }

    // Handle Versum compat paths (same-origin requests)
    if (url.pathname.startsWith('/events')) {
        return url.pathname;
    }
    if (url.pathname.startsWith('/settings/timetable')) {
        return url.pathname;
    }
    if (url.pathname.includes('track_new_events')) {
        return url.pathname;
    }
    if (url.pathname === '/graphql') {
        return url.pathname;
    }

    return null;
}

async function fulfillJson(
    route: Parameters<Parameters<typeof test.beforeEach>[0]>[0]['route'],
    data: unknown,
) {
    await route.fulfill({
        status: 200,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

async function compareWithReference(options: {
    actualBuffer: Buffer;
    referencePath: string;
    width: number;
    height: number;
    clip?: { left: number; top: number; width: number; height: number };
}) {
    const { actualBuffer, referencePath, width, height, clip } = options;

    const normalizedActual = await sharp(actualBuffer)
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer();

    const normalizedExpected = await sharp(referencePath)
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer();

    const actualTarget = clip
        ? await sharp(normalizedActual)
              .extract({
                  left: clip.left,
                  top: clip.top,
                  width: clip.width,
                  height: clip.height,
              })
              .png()
              .toBuffer()
        : normalizedActual;

    const expectedTarget = clip
        ? await sharp(normalizedExpected)
              .extract({
                  left: clip.left,
                  top: clip.top,
                  width: clip.width,
                  height: clip.height,
              })
              .png()
              .toBuffer()
        : normalizedExpected;

    const actualPng = PNG.sync.read(actualTarget);
    const expectedPng = PNG.sync.read(expectedTarget);

    const diffPixels = pixelmatch(
        actualPng.data,
        expectedPng.data,
        undefined,
        actualPng.width,
        actualPng.height,
        {
            threshold: 0.1,
        },
    );

    return diffPixels / (actualPng.width * actualPng.height);
}

async function attachRatio(testInfo: TestInfo, name: string, ratio: number) {
    await testInfo.attach(name, {
        body: `${ratio}`,
        contentType: 'text/plain',
    });
}
