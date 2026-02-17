import { test } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

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

const actions: AuditAction[] = [
    {
        id: '01-list',
        name: 'Customers list',
        panelUrl: 'https://panel.salon-bw.pl/customers',
        versumUrl: 'https://panel.versum.com/salonblackandwhite/customers',
        panelCheck: {
            requiredTexts: ['klienci', 'dodaj klienta', 'wszyscy klienci'],
            requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['klienci', 'dodaj klienta', 'wszyscy klienci'],
            requiredSelectors: ['#sidebar', '#main-content', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '02-summary',
        name: 'Customer card summary',
        panelUrl: 'https://panel.salon-bw.pl/customers/2',
        versumUrl: 'https://panel.versum.com/salonblackandwhite/customers/8177102',
        panelCheck: {
            requiredTexts: [
                'karta klienta',
                'podsumowanie',
                'zaplanowane wizyty',
                'zrealizowane wizyty',
            ],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['ładowanie danych klienta', 'this page could not be found'],
        },
        versumCheck: {
            requiredTexts: [
                'karta klienta',
                'podsumowanie',
                'zaplanowane wizyty',
                'zrealizowane wizyty',
            ],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '03-personal',
        name: 'Customer tab: personal_data',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=personal_data',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=personal_data',
        panelCheck: {
            requiredTexts: ['dane osobowe', 'dane podstawowe', 'dane rozszerzone'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['dane osobowe', 'dane podstawowe', 'dane rozszerzone'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '04-statistics',
        name: 'Customer tab: statistics',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=statistics',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=statistics',
        panelCheck: {
            requiredTexts: ['statystyki', 'okres', 'wykonane usługi'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['statystyki', 'okres', 'wykonane usługi'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '05-history',
        name: 'Customer tab: events_history',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=events_history',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=events_history',
        panelCheck: {
            requiredTexts: ['historia wizyt', 'wszystkie wizyty'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['historia wizyt', 'wszystkie wizyty'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '06-opinions',
        name: 'Customer tab: opinions (comments)',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=opinions',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=opinions',
        panelCheck: {
            requiredTexts: ['komentarze', 'dodaj komentarz'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['komentarze'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '07-communication',
        name: 'Customer tab: communication_preferences',
        panelUrl:
            'https://panel.salon-bw.pl/customers/2?tab_name=communication_preferences',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=communication_preferences',
        panelCheck: {
            requiredTexts: [
                'komunikacja',
                'ustawienia kanałów komunikacji',
                'historia komunikacji',
            ],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: [
                'komunikacja',
                'ustawienia kanałów komunikacji',
                'zgody udzielone przez klienta',
            ],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '08-gallery',
        name: 'Customer tab: gallery',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=gallery',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=gallery',
        panelCheck: {
            requiredTexts: ['galeria zdjęć', 'dodaj zdjęcie'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['galeria zdjęć'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '09-files',
        name: 'Customer tab: files',
        panelUrl: 'https://panel.salon-bw.pl/customers/2?tab_name=files',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102?tab_name=files',
        panelCheck: {
            requiredTexts: ['załączone pliki', 'dodaj plik'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['załączone pliki', 'dodaj plik'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '10-edit',
        name: 'Customer edit form',
        panelUrl: 'https://panel.salon-bw.pl/customers/2/edit',
        versumUrl:
            'https://panel.versum.com/salonblackandwhite/customers/8177102/edit',
        panelCheck: {
            requiredTexts: ['edytuj klienta', 'dane podstawowe', 'zapisz zmiany'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['dane podstawowe'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
    {
        id: '11-new',
        name: 'Add customer form',
        panelUrl: 'https://panel.salon-bw.pl/customers/new',
        versumUrl: 'https://panel.versum.com/salonblackandwhite/customers/new',
        panelCheck: {
            requiredTexts: ['nowy klient', 'dane podstawowe', 'dodaj klienta'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['this page could not be found'],
        },
        versumCheck: {
            requiredTexts: ['nowy klient', 'dane podstawowe', 'dodaj klienta'],
            requiredSelectors: ['#sidebar', '.sidenav'],
            forbiddenTexts: ['404'],
        },
    },
];

test.describe('PROD audit: customers panel vs versum', () => {
    test.setTimeout(12 * 60 * 1000);

    test('generate full checklist and screenshots', async ({ browser }) => {
        requireEnv('PANEL_LOGIN_EMAIL');
        requireEnv('PANEL_LOGIN_PASSWORD');
        requireEnv('VERSUM_LOGIN_EMAIL');
        requireEnv('VERSUM_LOGIN_PASSWORD');

        const outDir = path.resolve(
            process.cwd(),
            '../../output/parity/2026-02-17-customers-prod-full',
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

        const results: AuditResult[] = [];

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

            const panel = panelCheckResult.ok ? 'YES' : 'NO';
            const versum = versumCheckResult.ok ? 'YES' : 'NO';
            const parity = panel === 'YES' && versum === 'YES' ? 'YES' : 'NO';

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
            buildMarkdown(results, new Date().toISOString()),
            'utf8',
        );

        await panelContext.close();
        await versumContext.close();
    });
});
