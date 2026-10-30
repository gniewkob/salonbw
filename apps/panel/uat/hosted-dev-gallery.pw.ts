/**
 * Opt-in, write-scoped gallery UAT on the isolated MyDevil DEV deployment.
 * NEVER run against production, a real customer, or an unpinned release.
 *
 * Allowed writes: one unique synthetic customer, that customer's gallery
 * images, and cleanup of those exact created IDs. No appointment writes.
 * Traces, screenshots, videos and browser console capture are disabled.
 */
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';

const PANEL = 'https://dev-panel.salon-bw.pl';
const API = 'https://dev-api.salon-bw.pl';
const RELEASE = 'e97b8909b83dd79fa4000be2bdbfaceec8fb9603';
const STAFF_EMAIL = 'stylist@salonbw.example.test';

type GalleryImage = {
    id: number;
    mimeType: string;
    url: string;
    thumbnailUrl: string;
};

function customerApi(id: number): string {
    return PANEL + '/api/customers/' + id;
}

function refuseUnlessApproved(): void {
    if (
        process.env.GITHUB_ACTIONS !== 'true' ||
        process.env.GITHUB_REF !== 'refs/heads/master' ||
        process.env.GALLERY_UAT_WRITE_ACK !== 'APPROVED_SYNTHETIC_DEV_ONLY' ||
        process.env.PLAYWRIGHT_BASE_URL !== PANEL ||
        process.env.E2E_ADMIN_EMAIL !== STAFF_EMAIL ||
        process.env.DEV_ACCESS_USER !== 'uat' ||
        !process.env.DEV_ACCESS_PASSWORD ||
        !process.env.E2E_ADMIN_PASSWORD
    ) {
        throw new Error('GALLERY_UAT_BLOCKED: missing hard DEV scope or credential preflight');
    }
}

async function assertExactDevRelease(page: Page): Promise<void> {
    const panel = await page.request.get(PANEL + '/__release.json', {
        maxRedirects: 0,
        headers: { 'Cache-Control': 'no-cache' },
    });
    expect(panel.status(), 'DEV panel release endpoint').toBe(200);
    const panelRelease = (await panel.json()) as {
        sha?: string;
        environment?: string;
    };
    expect(panelRelease.sha).toBe(RELEASE);
    expect(panelRelease.environment).toBe('development');

    // Basic authentication is sent only to the explicitly pinned DEV API.
    const gatewayBasic =
        'Basic ' +
        Buffer.from(
            process.env.DEV_ACCESS_USER + ':' + process.env.DEV_ACCESS_PASSWORD,
        ).toString('base64');
    const api = await page.request.get(API + '/healthz', {
        maxRedirects: 0,
        headers: {
            'Cache-Control': 'no-cache',
            Authorization: gatewayBasic,
        },
    });
    expect(api.status(), 'DEV API health endpoint').toBe(200);
    const apiRelease = (await api.json()) as {
        status?: string;
        release?: string;
        services?: { database?: string };
    };
    expect(apiRelease.status).toBe('ok');
    expect(apiRelease.release).toBe(RELEASE);
    expect(apiRelease.services?.database).toBe('ok');
}

async function csrfHeaders(page: Page): Promise<Record<string, string>> {
    const token = await page.evaluate(() => {
        const pair = document.cookie.split('; ').find((item) => {
            const key = item.split('=')[0];
            return key === 'XSRF-TOKEN' || key.endsWith('_XSRF-TOKEN');
        });
        return pair?.slice(pair.indexOf('=') + 1);
    });
    if (!token) {
        throw new Error('GALLERY_UAT_BLOCKED: browser CSRF cookie unavailable');
    }
    // Keep the token exclusively in a request header; never print it.
    return { 'X-XSRF-TOKEN': token };
}

test.describe('Hosted DEV synthetic gallery — exact release', () => {
    test.describe.configure({ retries: 0 });
    test.use({
        httpCredentials: {
            username: process.env.DEV_ACCESS_USER ?? '',
            password: process.env.DEV_ACCESS_PASSWORD ?? '',
            origin: PANEL,
        },
    });

    test('JPEG, PNG, WebP, EXIF, auth, thumbnails, UI and scoped cleanup', async ({
        page,
    }) => {
        test.setTimeout(180_000);
        refuseUnlessApproved();
        await assertExactDevRelease(page);

        let customerId: number | null = null;
        const uploadedIds: number[] = [];
        const syntheticEmail = 'gallery-uat-' + randomUUID() + '@salonbw.example.test';
        let headers: Record<string, string> = {};

        // Block incidental UI writes from React/third-party components.
        // APIRequestContext writes below are separately hardcoded and checked.
        await page.route('**/*', async (route) => {
            const request = route.request();
            const method = request.method().toUpperCase();
            const url = new URL(request.url());
            if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
                await route.continue();
                return;
            }
            const login =
                method === 'POST' &&
                ((url.origin === PANEL && url.pathname === '/api/auth/login') ||
                    (url.origin === API && url.pathname === '/auth/login'));
            const galleryUpload =
                customerId !== null &&
                url.origin === PANEL &&
                method === 'POST' &&
                url.pathname === '/api/customers/' + customerId + '/gallery';
            const galleryDelete =
                customerId !== null &&
                url.origin === PANEL &&
                method === 'DELETE' &&
                uploadedIds.some(
                    (id) =>
                        url.pathname ===
                        '/api/customers/' + customerId + '/gallery/' + id,
                );
            if (login || galleryUpload || galleryDelete) {
                await route.continue();
                return;
            }
            await route.abort('blockedbyclient');
        });

        await page.goto('/auth/login');
        await page.locator('input[name="email"]').fill(STAFF_EMAIL);
        await page.locator('input[name="password"]').fill(process.env.E2E_ADMIN_PASSWORD!);
        await page.getByRole('button', { name: 'Zaloguj się' }).click();
        await expect
            .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
            .not.toBe('/auth/login');

        const profileResponse = await page.request.get(PANEL + '/api/users/profile', {
            maxRedirects: 0,
        });
        expect(profileResponse.status()).toBe(200);
        const profile = (await profileResponse.json()) as {
            email?: string;
            role?: string;
            isSystemAdmin?: boolean;
        };
        expect(profile.email).toBe(STAFF_EMAIL);
        expect(profile.role).toBe('admin');
        expect(profile.isSystemAdmin).toBe(false);
        headers = await csrfHeaders(page);

        let cleanupFailure: string | null = null;
        try {
            // The only customer written is this new, uniquely marked DEV fixture.
            const create = await page.request.post(PANEL + '/api/customers', {
                headers,
                data: {
                    firstName: 'Gallery',
                    lastName: 'Synthetic UAT',
                    email: syntheticEmail,
                    smsConsent: false,
                    whatsappConsent: false,
                    emailConsent: false,
                    notifyPanel: false,
                    gdprConsent: false,
                    termsConsent: false,
                },
                maxRedirects: 0,
            });
            expect(create.status(), 'synthetic customer create').toBe(201);
            const created = (await create.json()) as { id?: number; email?: string };
            expect(created.email).toBe(syntheticEmail);
            expect(Number.isInteger(created.id) && Number(created.id) > 0).toBe(true);
            customerId = Number(created.id);
            const base = customerApi(customerId);

            const checkFixture = await page.request.get(base);
            expect(checkFixture.status()).toBe(200);
            expect(((await checkFixture.json()) as { email?: string }).email).toBe(
                syntheticEmail,
            );

            await page.setViewportSize({ width: 1440, height: 900 });
            await page.goto('/customers/' + customerId + '?tab_name=gallery');
            await expect(page.locator('.customer-gallery-tab')).toBeVisible();
            await expect(page.getByText('Galeria jest pusta')).toBeVisible();

            const files = [
                {
                    name: 'synthetic-exif6.jpg',
                    mimeType: 'image/jpeg',
                    bytes: await sharp({
                        create: {
                            width: 800,
                            height: 400,
                            channels: 3,
                            background: { r: 50, g: 100, b: 150 },
                        },
                    }).jpeg().withMetadata({ orientation: 6 }).toBuffer(),
                    width: 160,
                    height: 320,
                },
                {
                    name: 'synthetic-transparent.png',
                    mimeType: 'image/png',
                    bytes: await sharp({
                        create: {
                            width: 640,
                            height: 360,
                            channels: 4,
                            background: { r: 20, g: 180, b: 90, alpha: 0.35 },
                        },
                    }).png().toBuffer(),
                    width: 320,
                    height: 180,
                },
                {
                    name: 'synthetic.webp',
                    mimeType: 'image/webp',
                    bytes: await sharp({
                        create: {
                            width: 720,
                            height: 480,
                            channels: 3,
                            background: { r: 120, g: 60, b: 210 },
                        },
                    }).webp().toBuffer(),
                    width: 320,
                    height: 213,
                },
            ];

            const saved: GalleryImage[] = [];
            for (const file of files) {
                const uploadResponse = page.waitForResponse(
                    (response) =>
                        response.url() === base + '/gallery' &&
                        response.request().method() === 'POST',
                );
                await page
                    .locator('.customer-gallery-tab input[type="file"]')
                    .setInputFiles({
                        name: file.name,
                        mimeType: file.mimeType,
                        buffer: file.bytes,
                    });
                const response = await uploadResponse;
                expect(response.status(), file.name + ' upload').toBe(201);
                const item = (await response.json()) as GalleryImage;
                expect(Number.isInteger(item.id) && item.id > 0).toBe(true);
                uploadedIds.push(item.id);
                saved.push(item);
                expect(item.mimeType).toBe(file.mimeType);
                expect(item.url).toBe('/customers/' + customerId + '/gallery/' + item.id);
                expect(item.thumbnailUrl).toBe(item.url + '/thumbnail');

                const original = await page.request.get(PANEL + '/api' + item.url);
                expect(original.status()).toBe(200);
                expect(original.headers()['content-type']).toContain(file.mimeType);
                expect(await original.body()).toEqual(file.bytes);

                const thumbnail = await page.request.get(
                    PANEL + '/api' + item.thumbnailUrl,
                );
                expect(thumbnail.status()).toBe(200);
                expect(thumbnail.headers()['content-type']).toContain('image/jpeg');
                const meta = await sharp(await thumbnail.body()).metadata();
                expect(meta.format).toBe('jpeg');
                expect(meta.width).toBe(file.width);
                expect(meta.height).toBe(file.height);

                const thumb = page.locator(
                    '.customer-gallery-thumb img[src$="/' + item.id + '/thumbnail"]',
                );
                await expect(thumb).toBeVisible();
                await expect
                    .poll(() => thumb.evaluate((img) => (img as HTMLImageElement).naturalWidth))
                    .toBeGreaterThan(0);
            }

            // Real browser rendering: same authentic cookie/proxy flow at
            // desktop 1440 and mobile 390, including opening the full original.
            const first = saved[0];
            for (const width of [1440, 390]) {
                await page.setViewportSize({ width, height: 844 });
                const thumb = page.locator(
                    '.customer-gallery-thumb img[src$="/' + first.id + '/thumbnail"]',
                );
                await thumb.click();
                const preview = page.locator('.customer-modal-open img');
                await expect(preview).toBeVisible();
                await expect
                    .poll(() => preview.evaluate((img) => (img as HTMLImageElement).naturalWidth))
                    .toBeGreaterThan(0);
                const rect = await preview.boundingBox();
                expect(rect, 'preview must be measurable').not.toBeNull();
                expect(rect!.width, 'preview must fit the visible screen').toBeLessThanOrEqual(
                    width + 2,
                );
                await page.locator('.customer-modal-open button[aria-label="Zamknij"]').click();
            }

            // UI delete + both deleted resource routes returning 404.
            await page.setViewportSize({ width: 1440, height: 900 });
            await page
                .locator(
                    '.customer-gallery-thumb img[src$="/' + first.id + '/thumbnail"]',
                )
                .click();
            await page.locator('.customer-modal-open').getByRole('button', {
                name: 'usuń',
                exact: true,
            }).click();
            const confirm = page.getByRole('dialog', { name: 'Usuń zdjęcie' });
            await expect(confirm).toBeVisible();
            const deletion = page.waitForResponse(
                (response) =>
                    response.url() === base + '/gallery/' + first.id &&
                    response.request().method() === 'DELETE',
            );
            await confirm.getByRole('button', { name: 'Usuń', exact: true }).click();
            const deleteResponse = await deletion;
            expect(deleteResponse.status()).toBe(200);
            uploadedIds.splice(uploadedIds.indexOf(first.id), 1);

            expect((await page.request.get(PANEL + '/api' + first.url)).status()).toBe(
                404,
            );
            expect(
                (await page.request.get(PANEL + '/api' + first.thumbnailUrl)).status(),
            ).toBe(404);

        } finally {
            // Never delete any user other than the exact fixture created here.
            // If gallery cleanup fails, leave the fixture for an audited repair
            // rather than deleting its DB record and orphaning media files.
            if (customerId !== null) {
                for (const id of uploadedIds) {
                    try {
                        const result = await page.request.delete(
                            customerApi(customerId) + '/gallery/' + id,
                            { headers, maxRedirects: 0 },
                        );
                        if (result.status() !== 200 && result.status() !== 404) {
                            cleanupFailure = 'gallery cleanup HTTP ' + result.status();
                        }
                    } catch {
                        cleanupFailure = 'gallery cleanup request failed';
                    }
                }
                if (cleanupFailure === null) {
                    try {
                        const check = await page.request.get(customerApi(customerId), {
                            maxRedirects: 0,
                        });
                        if (
                            check.status() !== 200 ||
                            ((await check.json()) as { email?: string }).email !==
                                syntheticEmail
                        ) {
                            cleanupFailure = 'synthetic customer identity changed';
                        } else {
                            const remove = await page.request.delete(
                                customerApi(customerId),
                                { headers, maxRedirects: 0 },
                            );
                            if (remove.status() !== 200) {
                                cleanupFailure =
                                    'synthetic customer cleanup HTTP ' + remove.status();
                            }
                        }
                    } catch {
                        cleanupFailure = 'synthetic customer cleanup request failed';
                    }
                }
            }
            if (cleanupFailure) {
                throw new Error('GALLERY_UAT_CLEANUP_FAILED: ' + cleanupFailure);
            }
        }
        // Report acceptance only AFTER cleanup; failure at any point stays FAIL.
        console.log(
            'HOSTED_DEV_GALLERY_UAT=PASS: exact release, synthetic staff, 3 formats, EXIF, originals, thumbnails, 1440px/390px, UI delete, HTTP 404 and cleanup',
        );
    });
});
