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
    actionId: string;
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
    actionId: string;
    actionName: string;
    panelScreenshot: string;
    versumScreenshot: string;
    diffScreenshot: string;
    width: number;
    height: number;
    mismatchPixels: number;
    mismatchPct: number;
    thresholdPct: number;
    pass: boolean;
}

const VISUAL_DIFF_THRESHOLD_PCT = 3.0;
const VISUAL_DIFF_ACTION_IDS = new Set([
    '01-dashboard',
    '02-employees',
    '03-commissions',
]);

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

    if (!details.length) {
        details.push('all checks passed');
    }

    return { ok, details: details.join('; ') };
}

async function loginPanel(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    await page.goto('https://panel.salon-bw.pl/auth/login', {
        waitUntil: 'domcontentloaded',
    });

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

    await page.goto(
        'https://panel.versum.com/salonblackandwhite/statistics/dashboard',
        {
            waitUntil: 'domcontentloaded',
        },
    );

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

function buildReport(results: AuditResult[]) {
    const lines: string[] = [];
    lines.push('# Statistics Parity Audit (Production, Full)');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## YES/NO per Screen/Action');
    lines.push(
        '| Action | Panel | Versum | Parity | Panel URL | Versum URL | Notes |',
    );
    lines.push('|---|---|---|---|---|---|---|');
    for (const row of results) {
        lines.push(
            `| ${row.action} | ${row.panel} | ${row.versum} | ${row.parity} | ${row.panelUrl} | ${row.versumUrl} | panel: ${row.panelDetails}; versum: ${row.versumDetails} |`,
        );
    }
    lines.push('');
    const allYes = results.every((x) => x.parity === 'YES');
    lines.push('## Final Verdict');
    lines.push(`- Functional parity: \`${allYes ? 'YES' : 'NO'}\``);
    lines.push(
        '- Rule: parity=YES only when both panel and versum checks passed for a given action.',
    );
    lines.push('');
    lines.push('## Artifacts');
    lines.push('- Screenshots: `panel-*.png`, `versum-*.png`');
    lines.push('- Raw checklist: `checklist.json`');
    lines.push('');
    return `${lines.join('\n')}\n`;
}

async function computePixelDiff(
    panelPath: string,
    versumPath: string,
    diffPath: string,
): Promise<{
    width: number;
    height: number;
    mismatchPixels: number;
    mismatchPct: number;
}> {
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
    const mismatchPct =
        Number(((mismatchPixels / (width * height)) * 100).toFixed(3)) || 0;

    await fs.writeFile(diffPath, PNG.sync.write(diffPng));
    return { width, height, mismatchPixels, mismatchPct };
}

function buildReportWithVisual(
    results: AuditResult[],
    pixelDiffResults: PixelDiffResult[],
) {
    const baseReport = buildReport(results).trimEnd();
    const lines: string[] = [baseReport, '', '## Visual Parity (Strict)'];

    if (!pixelDiffResults.length) {
        lines.push('- No visual diff data generated.');
    } else {
        lines.push(
            '| Action | Mismatch % | Threshold % | Pass | Diff Artifact |',
        );
        lines.push('|---|---:|---:|---|---|');
        for (const diff of pixelDiffResults) {
            lines.push(
                `| ${diff.actionName} | ${diff.mismatchPct.toFixed(3)} | ${diff.thresholdPct.toFixed(1)} | ${diff.pass ? 'YES' : 'NO'} | ${diff.diffScreenshot} |`,
            );
        }
    }

    const visualParity =
        pixelDiffResults.length > 0 && pixelDiffResults.every((x) => x.pass)
            ? 'YES'
            : 'NO';
    lines.push('');
    lines.push('## Final Visual Verdict');
    lines.push(`- Visual parity (critical screens): \`${visualParity}\``);
    lines.push(
        `- Threshold policy: each critical screen must be <= ${VISUAL_DIFF_THRESHOLD_PCT.toFixed(1)}% mismatch.`,
    );
    lines.push('');
    return `${lines.join('\n')}\n`;
}

const actions: AuditAction[] = [
    {
        id: '01-dashboard',
        name: 'Statistics dashboard',
        panelUrl: 'https://panel.salon-bw.pl/statistics',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/statistics/dashboard',
        panelCheck: {
            requiredTexts: ['raport finansowy'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['raport finansowy'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
    {
        id: '02-employees',
        name: 'Statistics employees',
        panelUrl: 'https://panel.salon-bw.pl/statistics/employees',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/statistics/employees',
        panelCheck: {
            requiredTexts: ['pracownicy'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['pracownicy'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
    {
        id: '03-commissions',
        name: 'Statistics commissions',
        panelUrl: 'https://panel.salon-bw.pl/statistics/commissions',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/reports/commissions',
        panelCheck: {
            requiredTexts: ['prowizje pracowników'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['prowizje pracowników'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
    {
        id: '04-services',
        name: 'Statistics services',
        panelUrl: 'https://panel.salon-bw.pl/statistics/services',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/statistics/services',
        panelCheck: {
            requiredTexts: ['usługi'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
        versumCheck: {
            requiredTexts: ['usługi'],
            requiredSelectors: ['#sidebar', '#main-content', '#sidenav'],
            forbiddenTexts: ['application error: a client-side exception has occurred'],
        },
    },
];

test.describe('PROD audit: statistics panel vs versum', () => {
    test.setTimeout(12 * 60 * 1000);

    test('generate full checklist and screenshots', async ({ browser }) => {
        requireEnv('PANEL_LOGIN_EMAIL');
        requireEnv('PANEL_LOGIN_PASSWORD');
        requireEnv('VERSUM_LOGIN_EMAIL');
        requireEnv('VERSUM_LOGIN_PASSWORD');

        const runDate = new Date().toISOString().slice(0, 10);
        const outDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-statistics-prod-full`,
        );
        const baselineDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-statistics-visual-baseline`,
        );
        await ensureDir(outDir);
        await ensureDir(baselineDir);

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

        const results: AuditResult[] = [];
        const pixelDiffResults: PixelDiffResult[] = [];

        for (const [index, action] of actions.entries()) {
            const seq = String(index + 1).padStart(2, '0');
            await panelPage.goto(action.panelUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 45_000,
            });
            await panelPage.waitForTimeout(1200);
            await panelPage.screenshot({
                path: path.join(outDir, `panel-${seq}-${action.id}.png`),
                fullPage: false,
            });

            await versumPage.goto(action.versumUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 45_000,
            });
            await versumPage.waitForTimeout(1200);
            await versumPage.screenshot({
                path: path.join(outDir, `versum-${seq}-${action.id}.png`),
                fullPage: false,
            });

            const panelShot = path.join(outDir, `panel-${seq}-${action.id}.png`);
            const versumShot = path.join(
                outDir,
                `versum-${seq}-${action.id}.png`,
            );
            if (VISUAL_DIFF_ACTION_IDS.has(action.id)) {
                const panelBaseline = path.join(
                    baselineDir,
                    `panel-${seq}-${action.id}.png`,
                );
                const versumBaseline = path.join(
                    baselineDir,
                    `versum-${seq}-${action.id}.png`,
                );
                await Promise.all([
                    fs.copyFile(panelShot, panelBaseline),
                    fs.copyFile(versumShot, versumBaseline),
                ]);

                const diffName = `diff-${seq}-${action.id}.png`;
                const diffPath = path.join(outDir, diffName);
                const diffStats = await computePixelDiff(
                    panelShot,
                    versumShot,
                    diffPath,
                );

                pixelDiffResults.push({
                    actionId: action.id,
                    actionName: action.name,
                    panelScreenshot: path.basename(panelShot),
                    versumScreenshot: path.basename(versumShot),
                    diffScreenshot: diffName,
                    width: diffStats.width,
                    height: diffStats.height,
                    mismatchPixels: diffStats.mismatchPixels,
                    mismatchPct: diffStats.mismatchPct,
                    thresholdPct: VISUAL_DIFF_THRESHOLD_PCT,
                    pass: diffStats.mismatchPct <= VISUAL_DIFF_THRESHOLD_PCT,
                });
            }

            const panelRes = await runChecks(panelPage, action.panelCheck);
            const versumRes = await runChecks(versumPage, action.versumCheck);

            results.push({
                actionId: action.id,
                action: action.name,
                panel: panelRes.ok ? 'YES' : 'NO',
                versum: versumRes.ok ? 'YES' : 'NO',
                parity: panelRes.ok && versumRes.ok ? 'YES' : 'NO',
                panelUrl: action.panelUrl,
                versumUrl: action.versumUrl,
                panelDetails: panelRes.details,
                versumDetails: versumRes.details,
            });
        }

        await fs.writeFile(
            path.join(outDir, 'REPORT.md'),
            buildReportWithVisual(results, pixelDiffResults),
            'utf8',
        );
        await fs.writeFile(
            path.join(outDir, 'checklist.json'),
            JSON.stringify(results, null, 2),
            'utf8',
        );
        await fs.writeFile(
            path.join(outDir, 'pixel-diff.json'),
            JSON.stringify(
                {
                    thresholdPct: VISUAL_DIFF_THRESHOLD_PCT,
                    generatedAt: new Date().toISOString(),
                    actions: pixelDiffResults,
                },
                null,
                2,
            ),
            'utf8',
        );

        await panelContext.close();
        await versumContext.close();
    });
});
