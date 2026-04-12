import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

interface PageCheck {
    requiredTexts?: string[];
    requiredSelectors?: string[];
    forbiddenTexts?: string[];
}

interface AuditAction {
    id: string;
    name: string;
    panelUrl: string;
    versumUrl: string;
    panelCheck: PageCheck;
    versumCheck: PageCheck;
}

interface AuditResult {
    action: string;
    panel: 'YES' | 'NO';
    versum: 'YES' | 'NO';
    parity: 'YES' | 'NO';
    panelUrl: string;
    versumUrl: string;
    panelDetails: string;
    versumDetails: string;
}

interface PixelDiffResult {
    action: string;
    mismatchPct: number;
    thresholdPct: number;
    pass: boolean;
    diffArtifact: string;
}

const VISUAL_DIFF_THRESHOLD_PCT = 3.0;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

async function runChecks(page: any, check: PageCheck) {
    const details: string[] = [];
    let ok = true;
    const pageText = (await page.locator('body').innerText())
        .toLowerCase()
        .replace(/\s+/g, ' ');

    if (check.requiredTexts?.length) {
        for (const text of check.requiredTexts) {
            if (!pageText.includes(text.toLowerCase())) {
                ok = false;
                details.push(`missing text: "${text}"`);
            }
        }
    }

    if (check.forbiddenTexts?.length) {
        for (const text of check.forbiddenTexts) {
            if (pageText.includes(text.toLowerCase())) {
                ok = false;
                details.push(`forbidden text present: "${text}"`);
            }
        }
    }

    if (check.requiredSelectors?.length) {
        for (const selector of check.requiredSelectors) {
            const count = await page.locator(selector).count();
            if (count < 1) {
                ok = false;
                details.push(`missing selector: ${selector}`);
            }
        }
    }

    if (!details.length) details.push('all checks passed');
    return { ok, details: details.join('; ') };
}

async function loginPanel(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

        if (!page.url().includes('/auth/login')) return;

        const throttled = await page
            .locator('text=Too Many Requests, text=ThrottlerException')
            .first()
            .isVisible()
            .catch(() => false);
        if (throttled) {
            await page.waitForTimeout(35_000);
            continue;
        }

        await page.waitForTimeout(1000);
    }
}

async function loginVersum(page: any) {
    const login = requireEnv('VERSUM_LOGIN_EMAIL');
    const password = requireEnv('VERSUM_LOGIN_PASSWORD');

    await page.goto('https://panel.versum.com/salonblackandwhite/settings', {
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

async function computePixelDiff(panelPath: string, versumPath: string, diffPath: string) {
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
    const mismatchPct = Number(((mismatchPixels / (width * height)) * 100).toFixed(3)) || 0;

    await fs.writeFile(diffPath, PNG.sync.write(diffPng));
    return { mismatchPct };
}

function buildReport(results: AuditResult[], pixelDiffResults: PixelDiffResult[]) {
    const functionalParity = results.every((row) => row.parity === 'YES');
    const visualParity =
        pixelDiffResults.length > 0 &&
        pixelDiffResults.every((row) => row.pass);

    const lines = [
        '# Settings Parity Audit (Production, Full)',
        '',
        `Generated: ${new Date().toISOString()}`,
        '',
        '## YES/NO per Screen/Action',
        '| Action | Panel | Versum | Parity | Panel URL | Versum URL | Notes |',
        '|---|---|---|---|---|---|---|',
        ...results.map(
            (row) =>
                `| ${row.action} | ${row.panel} | ${row.versum} | ${row.parity} | ${row.panelUrl} | ${row.versumUrl} | panel: ${row.panelDetails}; versum: ${row.versumDetails} |`,
        ),
        '',
        '## Final Verdict',
        `- Functional parity: \`${functionalParity ? 'YES' : 'NO'}\``,
        '',
        '## Visual Parity (Strict)',
        '| Action | Mismatch % | Threshold % | Pass | Diff Artifact |',
        '|---|---:|---:|---|---|',
        ...pixelDiffResults.map(
            (row) =>
                `| ${row.action} | ${row.mismatchPct.toFixed(3)} | ${row.thresholdPct.toFixed(1)} | ${row.pass ? 'YES' : 'NO'} | ${row.diffArtifact} |`,
        ),
        '',
        '## Final Visual Verdict',
        `- Visual parity (critical screens): \`${visualParity ? 'YES' : 'NO'}\``,
        `- Threshold policy: each critical screen must be <= ${VISUAL_DIFF_THRESHOLD_PCT.toFixed(1)}% mismatch.`,
        '',
    ];

    return `${lines.join('\n')}\n`;
}

const actions: AuditAction[] = [
    {
        id: '01-settings',
        name: 'Settings main page',
        panelUrl: 'https://panel.salon-bw.pl/settings',
        versumUrl: 'https://panel.versum.com/salonblackandwhite/settings',
        panelCheck: {
            requiredTexts: ['ustawienia'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['ustawienia'],
            requiredSelectors: ['#sidebar', '#main-content'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
    {
        id: '02-payment-configuration',
        name: 'Settings payment configuration',
        panelUrl: 'https://panel.salon-bw.pl/settings/payment-configuration',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/settings/payment_configuration',
        panelCheck: {
            requiredTexts: ['moment pay'],
            requiredSelectors: [
                '#sidebar',
                '#main-content',
                '#sidenav',
                'body#settings_online_payments_config',
            ],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['moment pay'],
            requiredSelectors: [
                '#sidebar',
                '#main-content',
                'body#settings_online_payments_config',
            ],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
];

test.describe('PROD audit: settings panel vs versum', () => {
    test.setTimeout(10 * 60 * 1000);

    test('generate full checklist and screenshots', async ({ browser }) => {
        requireEnv('PANEL_LOGIN_EMAIL');
        requireEnv('PANEL_LOGIN_PASSWORD');
        requireEnv('VERSUM_LOGIN_EMAIL');
        requireEnv('VERSUM_LOGIN_PASSWORD');

        const runDate = new Date().toISOString().slice(0, 10);
        const outDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-settings-prod-full`,
        );
        const baselineDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-settings-visual-baseline`,
        );
        await ensureDir(outDir);
        await ensureDir(baselineDir);

        const panelContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pl-PL' });
        const versumContext = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pl-PL' });

        const panelPage = await panelContext.newPage();
        const versumPage = await versumContext.newPage();

        await loginPanel(panelPage);
        await loginVersum(versumPage);

        const results: AuditResult[] = [];
        const pixelDiffResults: PixelDiffResult[] = [];

        for (const [index, action] of actions.entries()) {
            const seq = String(index + 1).padStart(2, '0');

            await panelPage.goto(action.panelUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            if (/\/auth\/login(\?|$)/.test(panelPage.url())) {
                await loginPanel(panelPage);
                await panelPage.goto(action.panelUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            }
            await panelPage.waitForTimeout(1200);
            await panelPage.screenshot({ path: path.join(outDir, `panel-${seq}-${action.id}.png`), fullPage: false });

            await versumPage.goto(action.versumUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            await versumPage.waitForTimeout(1200);
            await versumPage.screenshot({ path: path.join(outDir, `versum-${seq}-${action.id}.png`), fullPage: false });

            const panelShot = path.join(outDir, `panel-${seq}-${action.id}.png`);
            const versumShot = path.join(outDir, `versum-${seq}-${action.id}.png`);
            await Promise.all([
                fs.copyFile(panelShot, path.join(baselineDir, `panel-${seq}-${action.id}.png`)),
                fs.copyFile(versumShot, path.join(baselineDir, `versum-${seq}-${action.id}.png`)),
            ]);

            const panelRes = await runChecks(panelPage, action.panelCheck);
            const versumRes = await runChecks(versumPage, action.versumCheck);

            const parity = panelRes.ok && versumRes.ok ? 'YES' : 'NO';
            results.push({
                action: action.name,
                panel: panelRes.ok ? 'YES' : 'NO',
                versum: versumRes.ok ? 'YES' : 'NO',
                parity,
                panelUrl: action.panelUrl,
                versumUrl: action.versumUrl,
                panelDetails: panelRes.details,
                versumDetails: versumRes.details,
            });

            const diffPath = path.join(outDir, `diff-${seq}-${action.id}.png`);
            const { mismatchPct } = await computePixelDiff(panelShot, versumShot, diffPath);
            const visualPass = mismatchPct <= VISUAL_DIFF_THRESHOLD_PCT;
            pixelDiffResults.push({
                action: action.name,
                mismatchPct,
                thresholdPct: VISUAL_DIFF_THRESHOLD_PCT,
                pass: visualPass,
                diffArtifact: path.basename(diffPath),
            });
        }

        await fs.writeFile(
            path.join(outDir, 'REPORT.md'),
            buildReport(results, pixelDiffResults),
        );
        await fs.writeFile(
            path.join(outDir, 'checklist.json'),
            `${JSON.stringify(results, null, 2)}\n`,
        );
        await fs.writeFile(
            path.join(outDir, 'pixel-diff.json'),
            `${JSON.stringify(pixelDiffResults, null, 2)}\n`,
        );

        await panelContext.close();
        await versumContext.close();
    });
});
