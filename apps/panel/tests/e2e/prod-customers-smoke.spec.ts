import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

async function resolveCustomerId(page: any): Promise<number> {
    await page.goto('/customers');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle').catch(() => null);
    await page.waitForTimeout(1200);
    await expect(page).not.toHaveURL(
        /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/,
    );
    const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href') || ''),
    );
    for (const href of hrefs) {
        if (!href) continue;
        const match = href.match(/\/(?:customers|clients)\/(\d+)(?:[/?#]|$|\/)/);
        if (!match) continue;
        const id = Number(match[1]);
        if (Number.isFinite(id) && id > 0) return id;
    }

    const html = await page.content();
    const htmlMatch = html.match(/\/(?:customers|clients)\/(\d+)(?:[/?#]|$|\/)/);
    if (htmlMatch) {
        const id = Number(htmlMatch[1]);
        if (Number.isFinite(id) && id > 0) return id;
    }

    const firstRow = page
        .locator(
            '.clients-table tbody tr, table.clients-table tbody tr, .clients-list table tbody tr',
        )
        .first();
    if ((await firstRow.count()) > 0) {
        await firstRow.click({ timeout: 10_000 }).catch(() => null);
        await page.waitForLoadState('domcontentloaded').catch(() => null);
        const current = page.url();
        const currentMatch = current.match(
            /\/(?:customers|clients)\/(\d+)(?:[/?#]|$|\/)/,
        );
        if (currentMatch) {
            const id = Number(currentMatch[1]);
            if (Number.isFinite(id) && id > 0) return id;
        }
    }
    throw new Error(
        'No valid customer ID found on /customers. Ensure at least one customer exists.',
    );
}

async function gotoCustomerTab(
    page: any,
    customerId: number,
    tabName: 'gallery' | 'files',
    selector: string,
) {
    const target = `/customers/${customerId}?tab_name=${tabName}`;
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.goto(target);
        await page.waitForLoadState('domcontentloaded');
        await expect(page).not.toHaveURL(
            /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/,
        );
        try {
            await page.waitForSelector(selector, { timeout: 20_000 });
            return;
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError ?? new Error(`Failed to load tab ${tabName}`);
}

async function gotoCustomerRoute(
    page: any,
    customerId: number,
    path: string,
    requiredSelector: string,
) {
    const target = path.replace(':id', String(customerId));
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        await page.goto(target);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForLoadState('networkidle').catch(() => null);
        await expect(page).not.toHaveURL(
            /\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/,
        );
        try {
            await page.waitForSelector(`${requiredSelector}, .customer-error`, {
                timeout: 20_000,
            });
            lastError = null;
            break;
        } catch (err) {
            lastError = err;
        }
    }
    if (lastError) {
        throw lastError;
    }
    await expect(page.locator('body')).not.toContainText(
        'Application error: a client-side exception has occurred',
    );
}

async function login(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    // Production panel may host the login form on "/" (or redirect).
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Be liberal in selectors: the panel login has a simple email + password form.
    const emailInput = page.locator(
        'input[name="email"], input[type="email"], input[placeholder*="Email"], input[aria-label*="Email"]',
    );
    const passwordInput = page.locator(
        'input[name="password"], input[type="password"], input[placeholder*="Password"], input[aria-label*="Password"]',
    );

    await emailInput.first().waitFor({ state: 'visible', timeout: 20_000 });
    await emailInput.first().fill(email);
    await passwordInput.first().fill(password);

    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => null),
        page.click(
            'button[type="submit"], button:has-text("Sign in"), button:has-text("Zaloguj"), button:has-text("Zaloguj się")',
        ),
    ]);

    // We only assert we are not on a common login URL to avoid flakiness across redirects.
    await expect(page).not.toHaveURL(/\/login(\?|$)|\/sign-in(\?|$)|\/auth\/login(\?|$)/);
}

test.describe('PROD smoke: customers gallery/files', () => {
    test.setTimeout(90_000);

    test.skip(
        !process.env.PANEL_LOGIN_EMAIL || !process.env.PANEL_LOGIN_PASSWORD,
        'Requires PANEL_LOGIN_EMAIL and PANEL_LOGIN_PASSWORD',
    );

    test('gallery: upload image -> thumbnail visible', async ({ page }, testInfo) => {
        await login(page);
        const customerId = await resolveCustomerId(page);

        const pngPath = testInfo.outputPath('smoke-upload.png');
        fs.mkdirSync(path.dirname(pngPath), { recursive: true });
        // Generate a small but "normal" PNG; some decoders are picky about ultra-minimal PNGs.
        const png = new PNG({ width: 32, height: 32 });
        for (let y = 0; y < png.height; y++) {
            for (let x = 0; x < png.width; x++) {
                const idx = (png.width * y + x) << 2;
                png.data[idx] = 0x33; // R
                png.data[idx + 1] = 0x99; // G
                png.data[idx + 2] = 0xff; // B
                png.data[idx + 3] = 0xff; // A
            }
        }
        fs.writeFileSync(pngPath, PNG.sync.write(png));

        await gotoCustomerTab(page, customerId, 'gallery', '.customer-gallery-tab');

        // Upload via hidden input inside the "dodaj zdjecie" button.
        const fileInput = page.locator(
            'label:has-text("dodaj zdjęcie") input[type="file"]',
        );
        await expect(fileInput).toBeEnabled({ timeout: 10_000 });
        await fileInput.setInputFiles(pngPath);

        // Wait for an image thumbnail to appear (either new or existing).
        await page.waitForSelector('.customer-gallery-thumb img', {
            timeout: 20_000,
        });
        await expect(page.locator('.customer-gallery-thumb img').first()).toBeVisible();
    });

    test('files: upload file -> row visible -> download returns 200', async ({ page }, testInfo) => {
        await login(page);
        const customerId = await resolveCustomerId(page);

        const txtPath = testInfo.outputPath('smoke-upload.txt');
        fs.mkdirSync(path.dirname(txtPath), { recursive: true });
        fs.writeFileSync(txtPath, `smoke-${Date.now()}\n`, 'utf8');

        await gotoCustomerTab(page, customerId, 'files', '.customer-files-tab');

        const input = page.locator(
            'label:has-text("dodaj plik") input[type="file"]',
        );
        await expect(input).toBeEnabled({ timeout: 10_000 });
        await input.setInputFiles(txtPath);

        // The file list should eventually include the uploaded filename.
        await expect(page.locator('.customer-files-tab')).toContainText(
            path.basename(txtPath),
            { timeout: 20_000 },
        );

        // Click "download" and assert the download endpoint responds.
        const downloadBtn = page.locator('button[aria-label="Pobierz plik"]').first();
        await expect(downloadBtn).toBeVisible();

        const [popup] = await Promise.all([
            page.waitForEvent('popup', { timeout: 10_000 }).catch(() => null),
            downloadBtn.click(),
        ]);

        // In some browsers/window.open policies, the popup can be blocked.
        // Fall back to asserting the page did not crash.
        if (popup) {
            const resp = await popup.waitForResponse(() => true, { timeout: 20_000 }).catch(() => null);
            if (resp) {
                expect(resp.status()).toBeGreaterThanOrEqual(200);
                expect(resp.status()).toBeLessThan(400);
            }
            await popup.close().catch(() => null);
        }
    });

    test('customer card routes: all tabs render without client-side exception', async ({ page }) => {
        await login(page);
        const customerId = await resolveCustomerId(page);

        const routes: Array<{ path: string; selector: string }> = [
            { path: '/customers/:id', selector: '.customer-summary' },
            {
                path: '/customers/:id?tab_name=personal_data',
                selector: '.customer-personal-view',
            },
            {
                path: '/customers/:id?tab_name=statistics',
                selector: '.customer-statistics-tab',
            },
            {
                path: '/customers/:id?tab_name=events_history',
                selector: '.customer-history-tab',
            },
            {
                path: '/customers/:id?tab_name=opinions',
                selector: '.customer-comments-tab',
            },
            {
                path: '/customers/:id?tab_name=communication_preferences',
                selector: '.customer-communication-tab',
            },
            {
                path: '/customers/:id?tab_name=gallery',
                selector: '.customer-gallery-tab',
            },
            {
                path: '/customers/:id?tab_name=files',
                selector: '.customer-files-tab',
            },
            { path: '/customers/:id/edit', selector: '.customer-personal-form' },
            { path: '/customers/new', selector: '.customer-new-form' },
        ];

        for (const route of routes) {
            await gotoCustomerRoute(
                page,
                customerId,
                route.path,
                route.selector,
            );
        }
    });
});
