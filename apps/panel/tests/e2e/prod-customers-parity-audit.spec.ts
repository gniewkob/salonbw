import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

type AppTarget = 'panel' | 'versum';

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

const DEFAULT_VERSUM_CUSTOMER_ID = 8177102;
const VISUAL_DIFF_THRESHOLD_PCT = 3.0;
const VISUAL_DIFF_ACTION_IDS = new Set([
    '01-list',
    '02-summary',
    '08-gallery',
    '09-files',
]);

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

function optionalNumericEnv(name: string): number | null {
    const value = process.env[name];
    if (!value) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid numeric env var: ${name}=${value}`);
    }
    return parsed;
}

async function ensureDir(dir: string) {
    await fs.mkdir(dir, { recursive: true });
}

async function runChecks(
    page: any,
    check: PageCheck,
): Promise<{ ok: boolean; details: string[] }> {
    const details: string[] = [];
    let ok = true;
    const pageText = (await page.locator('body').innerText())
        .toLowerCase()
        .replace(/\s+/g, ' ');

    if (check.requiredTexts?.length) {
        for (const text of check.requiredTexts) {
            const hasText = pageText.includes(text.toLowerCase());
            if (!hasText) {
                ok = false;
                details.push(`missing text: "${text}"`);
            }
        }
    }

    if (check.forbiddenTexts?.length) {
        for (const text of check.forbiddenTexts) {
            const hasForbidden = pageText.includes(text.toLowerCase());
            if (hasForbidden) {
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

    if (details.length === 0) {
        details.push('all checks passed');
    }

    return { ok, details };
}

async function assertNoAuthOrErrorFallback(
    page: any,
    target: AppTarget,
    url: string,
): Promise<{ ok: boolean; details: string[] }> {
    const details: string[] = [];
    let ok = true;
    const currentUrl = page.url().toLowerCase();
    const pageText = (await page.locator('body').innerText())
        .toLowerCase()
        .replace(/\s+/g, ' ');
    if (target === 'panel') {
        if (currentUrl.includes('/auth/login')) {
            ok = false;
            details.push('redirected to /auth/login');
        }
    } else if (
        currentUrl.includes('/users/sign_in') ||
        currentUrl.includes('/sign_in')
    ) {
        ok = false;
        details.push('redirected to versum sign_in');
    }

    const fallbackSnippets = [
        'this page could not be found',
        'application error: a client-side exception has occurred',
        '404',
        '500',
        'internal server error',
    ];
    for (const snippet of fallbackSnippets) {
        if (pageText.includes(snippet)) {
            ok = false;
            details.push(`fallback content present: "${snippet}"`);
        }
    }
    if (!ok) {
        details.push(`checked url: ${url}`);
    }
    return { ok, details };
}

async function loginPanel(page: any) {
    const email = requireEnv('PANEL_LOGIN_EMAIL');
    const password = requireEnv('PANEL_LOGIN_PASSWORD');

    await page.goto('https://panel.salon-bw.pl/auth/login', {
        waitUntil: 'domcontentloaded',
    });

    const emailInput = page.locator(
        'input[name="email"], input[type="email"], input[placeholder*="Email"], input[aria-label*="Email"]',
    );
    const passwordInput = page.locator(
        'input[name="password"], input[type="password"]',
    );

    await emailInput.first().waitFor({ state: 'visible', timeout: 25_000 });
    await emailInput.first().fill(email);
    await passwordInput.first().fill(password);

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

    await page.goto('https://panel.versum.com/salonblackandwhite/customers', {
        waitUntil: 'domcontentloaded',
    });

    const hasPasswordField = (await page.locator('input[type="password"]').count()) > 0;
    if (!hasPasswordField) return;

    const loginInput = page.locator(
        'input[type="text"]:visible, input[type="email"]:visible, input[name="email"]:visible, input[name="login"]:visible',
    );
    const passwordInput = page.locator('input[type="password"]:visible');

    await loginInput.first().waitFor({ state: 'visible', timeout: 25_000 });
    await loginInput.first().fill(login);
    await passwordInput.first().fill(password);

    await Promise.all([
        page
            .waitForURL(
                (url: URL) =>
                    url.hostname.includes('panel.versum.com') &&
                    url.pathname.includes('/salonblackandwhite') &&
                    !url.pathname.includes('/users/sign_in'),
                { timeout: 35_000 },
            )
            .catch(() => null),
        page.click(
            'button[type="submit"], button:has-text("Zaloguj"), button:has-text("Zaloguj się"), input[type="submit"]',
        ),
    ]);
}

async function resolveCustomerId(page: any): Promise<number> {
    await page.goto('https://panel.salon-bw.pl/customers', {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
    });
    await page.waitForTimeout(1200);

    const hrefs = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => a.getAttribute('href') || ''),
    );
    for (const href of hrefs) {
        if (!href) continue;
        const match = href.match(/\/(?:customers|clients)\/(\d+)(?:[/?#]|$|\/)/);
        if (!match) continue;
        const id = Number(match[1]);
        if (!Number.isFinite(id) || id <= 0) continue;
        return id;
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
        'No valid customer ID found on /customers. Ensure at least one customer exists in production panel.',
    );
}

async function resolvePanelCustomerId(
    page: any,
    preferredId: number | null,
): Promise<number> {
    if (preferredId !== null) {
        const preferredUrl = `https://panel.salon-bw.pl/customers/${preferredId}`;
        await page.goto(preferredUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45_000,
        });
        await page.waitForTimeout(1200);
        const currentUrl = page.url().toLowerCase();
        const pageText = (await page.locator('body').innerText())
            .toLowerCase()
            .replace(/\s+/g, ' ');
        const fallbackSnippets = [
            'this page could not be found',
            'application error: a client-side exception has occurred',
            '404',
            '500',
            'internal server error',
        ];
        const hasFallback = fallbackSnippets.some((snippet) =>
            pageText.includes(snippet),
        );
        const isLoginRedirect = currentUrl.includes('/auth/login');
        const hasCustomerShell =
            (await page
                .locator(
                    '#customers_main, .customer-summary, .customer-personal-view, .customer-gallery-tab, .customer-files-tab',
                )
                .count()) > 0;
        if (!isLoginRedirect && !hasFallback && hasCustomerShell) {
            return preferredId;
        }
    }
    return resolveCustomerId(page);
}

function buildMarkdown(results: AuditResult[], generatedAt: string): string {
    const lines: string[] = [];
    lines.push('# Customers Parity Audit (Production, Full)');
    lines.push('');
    lines.push(`Generated: ${generatedAt}`);
    lines.push('');
    lines.push('## YES/NO per Screen/Action');
    lines.push(
        '| Action | Panel | Versum | Parity | Panel URL | Versum URL | Notes |',
    );
    lines.push('|---|---|---|---|---|---|---|');

    for (const row of results) {
        const notes = `panel: ${row.panelDetails}; versum: ${row.versumDetails}`;
        lines.push(
            `| ${row.action} | ${row.panel} | ${row.versum} | ${row.parity} | ${row.panelUrl} | ${row.versumUrl} | ${notes} |`,
        );
    }

    const allYes = results.every((r) => r.parity === 'YES');
    lines.push('');
    lines.push('## Final Verdict');
    lines.push(`- Overall parity: \`${allYes ? 'YES' : 'NO'}\``);
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
        { threshold: 0.1, includeAA: true },
    );
    const mismatchPct =
        Number(((mismatchPixels / (width * height)) * 100).toFixed(3)) || 0;

    await fs.writeFile(diffPath, PNG.sync.write(diffPng));
    return { width, height, mismatchPixels, mismatchPct };
}

function buildMarkdownWithVisual(
    results: AuditResult[],
    generatedAt: string,
    pixelDiffResults: PixelDiffResult[],
): string {
    const lines = buildMarkdown(results, generatedAt).trimEnd().split('\n');
    lines.push('');
    lines.push('## Visual Parity (Strict)');
    lines.push('| Action | Mismatch % | Threshold % | Pass | Diff Artifact |');
    lines.push('|---|---:|---:|---|---|');
    for (const diff of pixelDiffResults) {
        lines.push(
            `| ${diff.actionName} | ${diff.mismatchPct.toFixed(3)} | ${diff.thresholdPct.toFixed(1)} | ${diff.pass ? 'YES' : 'NO'} | ${diff.diffScreenshot} |`,
        );
    }

    const visualParity = pixelDiffResults.every((x) => x.pass) ? 'YES' : 'NO';
    lines.push('');
    lines.push('## Final Visual Verdict');
    lines.push(`- Visual parity (critical screens): \`${visualParity}\``);
    lines.push(
        `- Threshold policy: each critical screen must be <= ${VISUAL_DIFF_THRESHOLD_PCT.toFixed(1)}% mismatch.`,
    );
    lines.push('');
    lines.push('## Artifacts (Visual)');
    lines.push('- Pixel diff JSON: `pixel-diff.json`');
    lines.push('- Baseline directory: `../<YYYY-MM-DD>-customers-visual-baseline`');
    lines.push('');
    return `${lines.join('\n')}\n`;
}

function buildActions(
    panelCustomerId: number,
    versumCustomerId: number,
): AuditAction[] {
    const panelBase = `https://panel.salon-bw.pl/customers/${panelCustomerId}`;
    const versumBase = `https://panel.versum.com/salonblackandwhite/customers/${versumCustomerId}`;
    return [
        {
            id: '01-list',
            name: 'Customers list',
            panelUrl: 'https://panel.salon-bw.pl/customers',
            versumUrl: 'https://panel.versum.com/salonblackandwhite/customers',
            panelCheck: {
                requiredTexts: ['klienci', 'dodaj klienta'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['klienci', 'dodaj klienta'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '02-summary',
            name: 'Customer card summary',
            panelUrl: panelBase,
            versumUrl: versumBase,
            panelCheck: {
                requiredTexts: ['klienci', 'edytuj'],
                requiredSelectors: [
                    '#sidebar',
                    '#main-content',
                    '.sidenav',
                    '#customers_main',
                ],
                forbiddenTexts: [
                    'ładowanie danych klienta',
                    'this page could not be found',
                ],
            },
            versumCheck: {
                requiredTexts: ['klienci', 'edytuj'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '03-personal',
            name: 'Customer tab: personal_data',
            panelUrl: `${panelBase}?tab_name=personal_data`,
            versumUrl: `${versumBase}?tab_name=personal_data`,
            panelCheck: {
                requiredTexts: ['dane osobowe', 'dane podstawowe'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['dane osobowe', 'dane podstawowe'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '04-statistics',
            name: 'Customer tab: statistics',
            panelUrl: `${panelBase}?tab_name=statistics`,
            versumUrl: `${versumBase}?tab_name=statistics`,
            panelCheck: {
                requiredTexts: ['statystyki', 'okres'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['statystyki', 'okres'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '05-history',
            name: 'Customer tab: events_history',
            panelUrl: `${panelBase}?tab_name=events_history`,
            versumUrl: `${versumBase}?tab_name=events_history`,
            panelCheck: {
                requiredTexts: ['historia wizyt', 'filtruj'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['historia wizyt'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '06-opinions',
            name: 'Customer tab: opinions (comments)',
            panelUrl: `${panelBase}?tab_name=opinions`,
            versumUrl: `${versumBase}?tab_name=opinions`,
            panelCheck: {
                requiredTexts: ['komentarze'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['komentarze'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '07-communication',
            name: 'Customer tab: communication_preferences',
            panelUrl: `${panelBase}?tab_name=communication_preferences`,
            versumUrl: `${versumBase}?tab_name=communication_preferences`,
            panelCheck: {
                requiredTexts: ['komunikacja'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['komunikacja'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '08-gallery',
            name: 'Customer tab: gallery',
            panelUrl: `${panelBase}?tab_name=gallery`,
            versumUrl: `${versumBase}?tab_name=gallery`,
            panelCheck: {
                requiredTexts: ['galeria'],
                requiredSelectors: [
                    '#sidebar',
                    '#main-content',
                    '.sidenav',
                    '.customer-gallery-tab',
                ],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['galeria'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '09-files',
            name: 'Customer tab: files',
            panelUrl: `${panelBase}?tab_name=files`,
            versumUrl: `${versumBase}?tab_name=files`,
            panelCheck: {
                requiredTexts: ['pliki'],
                requiredSelectors: [
                    '#sidebar',
                    '#main-content',
                    '.sidenav',
                    '.customer-files-tab',
                ],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['pliki'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '10-edit',
            name: 'Customer edit form',
            panelUrl: `${panelBase}/edit`,
            versumUrl: `${versumBase}/edit`,
            panelCheck: {
                requiredTexts: ['edytuj klienta', 'zapisz zmiany'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['dane podstawowe'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
        {
            id: '11-new',
            name: 'Add customer form',
            panelUrl: 'https://panel.salon-bw.pl/customers/new',
            versumUrl: 'https://panel.versum.com/salonblackandwhite/customers/new',
            panelCheck: {
                requiredTexts: ['nowy klient', 'dodaj klienta'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['this page could not be found'],
            },
            versumCheck: {
                requiredTexts: ['nowy klient', 'dodaj klienta'],
                requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
                forbiddenTexts: ['404'],
            },
        },
    ];
}

test.describe('PROD audit: customers panel vs versum', () => {
    test.setTimeout(12 * 60 * 1000);

    test('generate full checklist and screenshots', async ({ browser }) => {
        requireEnv('PANEL_LOGIN_EMAIL');
        requireEnv('PANEL_LOGIN_PASSWORD');
        requireEnv('VERSUM_LOGIN_EMAIL');
        requireEnv('VERSUM_LOGIN_PASSWORD');
        const versumCustomerId =
            optionalNumericEnv('VERSUM_CUSTOMER_ID') ??
            DEFAULT_VERSUM_CUSTOMER_ID;
        const panelCustomerIdHint =
            optionalNumericEnv('PANEL_PARITY_CUSTOMER_ID') ??
            versumCustomerId;

        const runDate = new Date().toISOString().slice(0, 10);
        const outDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-customers-prod-full`,
        );
        const baselineDir = path.resolve(
            process.cwd(),
            `../../output/parity/${runDate}-customers-visual-baseline`,
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
        const panelCustomerId = await resolvePanelCustomerId(
            panelPage,
            panelCustomerIdHint,
        );
        const actions = buildActions(panelCustomerId, versumCustomerId);

        const results: AuditResult[] = [];
        const pixelDiffResults: PixelDiffResult[] = [];

        for (const [index, action] of actions.entries()) {
            const seq = String(index + 1).padStart(2, '0');

            for (const target of ['panel', 'versum'] as AppTarget[]) {
                const page = target === 'panel' ? panelPage : versumPage;
                const url = target === 'panel' ? action.panelUrl : action.versumUrl;
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
                await page.waitForTimeout(1500);
                await page.screenshot({
                    path: path.join(outDir, `${target}-${seq}-${action.id}.png`),
                    fullPage: true,
                });
            }

            const panelCheckResult = await runChecks(panelPage, action.panelCheck);
            const versumCheckResult = await runChecks(versumPage, action.versumCheck);
            const panelPrecheck = await assertNoAuthOrErrorFallback(
                panelPage,
                'panel',
                action.panelUrl,
            );
            const versumPrecheck = await assertNoAuthOrErrorFallback(
                versumPage,
                'versum',
                action.versumUrl,
            );
            if (!panelPrecheck.ok) {
                panelCheckResult.ok = false;
                panelCheckResult.details.push(...panelPrecheck.details);
            }
            if (!versumPrecheck.ok) {
                versumCheckResult.ok = false;
                versumCheckResult.details.push(...versumPrecheck.details);
            }

            const panel = panelCheckResult.ok ? 'YES' : 'NO';
            const versum = versumCheckResult.ok ? 'YES' : 'NO';
            const parity = panel === 'YES' && versum === 'YES' ? 'YES' : 'NO';

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

            results.push({
                actionId: action.id,
                action: action.name,
                panel,
                versum,
                parity,
                panelUrl: action.panelUrl,
                versumUrl: action.versumUrl,
                panelDetails: panelCheckResult.details.join('; '),
                versumDetails: versumCheckResult.details.join('; '),
            });
        }

        await fs.writeFile(
            path.join(outDir, 'checklist.json'),
            JSON.stringify(results, null, 2),
            'utf8',
        );
        await fs.writeFile(
            path.join(outDir, 'REPORT.md'),
            buildMarkdownWithVisual(
                results,
                new Date().toISOString(),
                pixelDiffResults,
            ),
            'utf8',
        );
        await fs.writeFile(
            path.join(outDir, 'pixel-diff.json'),
            JSON.stringify(pixelDiffResults, null, 2),
            'utf8',
        );

        await panelContext.close().catch(() => null);
        await versumContext.close().catch(() => null);
    });
});
