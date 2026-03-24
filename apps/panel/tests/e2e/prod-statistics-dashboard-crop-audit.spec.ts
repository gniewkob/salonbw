import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface CropTarget {
    id: string;
    name: string;
    panelSelector: string;
    versumSelector: string;
}

const DASHBOARD_URL = 'https://panel.salon-bw.pl/statistics';
const VERSUM_DASHBOARD_URL =
    'https://panel.versum.com/salonblackandwhite/statistics/dashboard';

const CROPS: CropTarget[] = [
    {
        id: 'summary',
        name: 'Summary Block',
        panelSelector: '.statistics-price-summary',
        versumSelector: '.col-lg-5',
    },
    {
        id: 'payments-chart',
        name: 'Payments Chart Block',
        panelSelector: '.statistics-chart-wrap',
        versumSelector: '.col-lg-7',
    },
    {
        id: 'employees-table',
        name: 'Employees Table',
        panelSelector: '.data_table',
        versumSelector: '.data_table',
    },
    {
        id: 'employees-chart',
        name: 'Employees Chart',
        panelSelector: '.statistics-employee-chart-wrap',
        versumSelector: '#info2 >> xpath=..',
    },
];

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

async function loginPanel(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    await page.goto('https://panel.salon-bw.pl/auth/login', {
        waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle').catch(() => null);

    if (!page.url().includes('/auth/login')) return;

    await page
        .locator(
            'input[name="email"], input[type="email"], input[placeholder*="Email"], input[aria-label*="Email"]',
        )
        .first()
        .fill(email);
    await page.locator('input[type="password"]').first().fill(password);

    await Promise.all([
        page
            .waitForURL((url: URL) => !url.pathname.includes('/auth/login'), {
                timeout: 30_000,
            })
            .catch(() => null),
        page.click(
            'button[type="submit"], button:has-text("Sign in"), button:has-text("Zaloguj"), button:has-text("Zaloguj się")',
        ),
    ]);
}

async function loginVersum(page: any) {
    const login = requireEnv('VERSUM_LOGIN_EMAIL');
    const password = requireEnv('VERSUM_LOGIN_PASSWORD');

    await page.goto(VERSUM_DASHBOARD_URL, {
        waitUntil: 'domcontentloaded',
    });

    const hasPasswordInput =
        (await page.locator('input[type="password"]').count()) > 0;
    if (!hasPasswordInput) return;

    await page
        .locator('input[type="text"]:visible, input[type="email"]:visible')
        .first()
        .fill(login);
    await page.locator('input[type="password"]:visible').first().fill(password);

    await Promise.all([
        page
            .waitForURL(
                (url: URL) =>
                    url.hostname.includes('panel.versum.com') &&
                    !url.pathname.includes('sign_in'),
                { timeout: 35_000 },
            )
            .catch(() => null),
        page.click(
            'button[type="submit"], button:has-text("Zaloguj"), button:has-text("Zaloguj się"), input[type="submit"]',
        ),
    ]);
}

async function screenshotLocator(page: any, selector: string, outputPath: string) {
    const locator = page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 20_000 });
    await locator.screenshot({ path: outputPath });
}

async function computePixelDiff(
    panelPath: string,
    versumPath: string,
    diffPath: string,
) {
    const [panelBytes, versumBytes] = await Promise.all([
        fs.readFile(panelPath),
        fs.readFile(versumPath),
    ]);
    const panelPng = PNG.sync.read(panelBytes);
    const versumPng = PNG.sync.read(versumBytes);

    const width = Math.min(panelPng.width, versumPng.width);
    const height = Math.min(panelPng.height, versumPng.height);

    const panelCrop = new PNG({ width, height });
    const versumCrop = new PNG({ width, height });
    const diffPng = new PNG({ width, height });

    for (let y = 0; y < height; y += 1) {
        const srcOffsetPanel = y * panelPng.width * 4;
        const srcOffsetVersum = y * versumPng.width * 4;
        const dstOffset = y * width * 4;
        panelPng.data.copy(
            panelCrop.data,
            dstOffset,
            srcOffsetPanel,
            srcOffsetPanel + width * 4,
        );
        versumPng.data.copy(
            versumCrop.data,
            dstOffset,
            srcOffsetVersum,
            srcOffsetVersum + width * 4,
        );
    }

    const mismatchPixels = pixelmatch(
        panelCrop.data,
        versumCrop.data,
        diffPng.data,
        width,
        height,
        {
            threshold: 0.1,
            includeAA: true,
        },
    );

    await fs.writeFile(diffPath, PNG.sync.write(diffPng));
    return {
        width,
        height,
        mismatchPixels,
        mismatchPct:
            Number(((mismatchPixels / (width * height)) * 100).toFixed(3)) || 0,
    };
}

test.describe('PROD audit: statistics dashboard crops', () => {
    test.setTimeout(8 * 60 * 1000);

    test('capture and diff dashboard blocks', async ({ browser }) => {
        requireEnv('PANEL_LOGIN_EMAIL');
        requireEnv('PANEL_LOGIN_PASSWORD');
        requireEnv('VERSUM_LOGIN_EMAIL');
        requireEnv('VERSUM_LOGIN_PASSWORD');

        const runDate = new Date().toISOString().slice(0, 10);
        const outDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-statistics-dashboard-crops`,
        );
        await ensureDir(outDir);

        const panelContext = await browser.newContext({
            viewport: { width: 1366, height: 768 },
            locale: 'pl-PL',
        });
        const versumContext = await browser.newContext({
            viewport: { width: 1366, height: 768 },
            locale: 'pl-PL',
        });

        const panelPage = await panelContext.newPage();
        const versumPage = await versumContext.newPage();

        await loginPanel(panelPage);
        await loginVersum(versumPage);

        await panelPage.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
        await versumPage.goto(VERSUM_DASHBOARD_URL, {
            waitUntil: 'domcontentloaded',
        });
        await panelPage.waitForTimeout(1500);
        await versumPage.waitForTimeout(1500);

        const results = [];

        for (const crop of CROPS) {
            const panelPath = path.join(outDir, `panel-${crop.id}.png`);
            const versumPath = path.join(outDir, `versum-${crop.id}.png`);
            const diffPath = path.join(outDir, `diff-${crop.id}.png`);

            await screenshotLocator(panelPage, crop.panelSelector, panelPath);
            await screenshotLocator(
                versumPage,
                crop.versumSelector,
                versumPath,
            );

            const diff = await computePixelDiff(panelPath, versumPath, diffPath);
            results.push({
                id: crop.id,
                name: crop.name,
                ...diff,
                panelScreenshot: path.basename(panelPath),
                versumScreenshot: path.basename(versumPath),
                diffScreenshot: path.basename(diffPath),
            });
        }

        results.sort((a, b) => b.mismatchPct - a.mismatchPct);
        await fs.writeFile(
            path.join(outDir, 'crop-report.json'),
            JSON.stringify(results, null, 2),
        );
    });
});
