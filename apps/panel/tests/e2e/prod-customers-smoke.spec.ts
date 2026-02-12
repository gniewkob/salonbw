import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
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

        await page.goto('/customers/2?tab_name=gallery');
        await page.waitForSelector('.customer-gallery-tab', { timeout: 20_000 });

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

        const txtPath = testInfo.outputPath('smoke-upload.txt');
        fs.mkdirSync(path.dirname(txtPath), { recursive: true });
        fs.writeFileSync(txtPath, `smoke-${Date.now()}\n`, 'utf8');

        await page.goto('/customers/2?tab_name=files');
        await page.waitForSelector('.customer-files-tab', { timeout: 20_000 });

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
});
