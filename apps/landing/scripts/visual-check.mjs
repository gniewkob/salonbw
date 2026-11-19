#!/usr/bin/env node
/**
 * Visual check for the landing: screenshots every public route on a phone
 * and a desktop viewport, and (optionally) compares them with a baseline.
 *
 *   node scripts/visual-check.mjs <baseUrl> <outDir> [--baseline <dir>]
 *        [--executable <chromium path>] [--auth user:pass]
 *
 * - Reduced motion, cookie banner dismissed, lazy content scrolled into view,
 *   so screenshots are stable and comparable.
 * - With --baseline, writes <name>.diff.png next to each changed screenshot
 *   and prints the share of changed pixels per route. Exit code 0 always:
 *   a visual change is a question for a human, not a failure.
 * - Read-only: it only loads pages.
 */
import { chromium, devices } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const ROUTES = [
    '/',
    '/services',
    '/services/coloring',
    '/services/balayage',
    '/services/highlights',
    '/gallery',
    '/contact',
    '/policy',
    '/privacy',
    '/data-deletion',
    '/nie-istnieje',
];
const VIEWPORTS = [
    { name: 'phone', ...devices['iPhone 15'] },
    { name: 'desktop', viewport: { width: 1440, height: 900 } },
];

const args = process.argv.slice(2);
const [baseUrl, outDir] = args;
const opt = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
};
if (!baseUrl || !outDir) {
    console.error(
        'Usage: node scripts/visual-check.mjs <baseUrl> <outDir> [--baseline <dir>] [--executable <path>] [--auth user:pass]',
    );
    process.exit(2);
}
const baseline = opt('--baseline');
const executablePath = opt('--executable');
const auth = opt('--auth');
mkdirSync(outDir, { recursive: true });

const fileName = (vp, route) =>
    `${vp}-${route.replace(/^\//, '').replace(/\//g, '_') || 'home'}.png`;

const browser = await chromium.launch(executablePath ? { executablePath } : {});
const results = [];
for (const vp of VIEWPORTS) {
    const { name, ...ctxOptions } = vp;
    const context = await browser.newContext({
        ...ctxOptions,
        reducedMotion: 'reduce',
        httpCredentials: auth
            ? {
                  username: auth.split(':')[0],
                  password: auth.split(':').slice(1).join(':'),
              }
            : undefined,
    });
    for (const route of ROUTES) {
        const page = await context.newPage();
        try {
            await page.goto(baseUrl + route, {
                waitUntil: 'load',
                timeout: 30000,
            });
            await page.waitForTimeout(800);
            const decline = page.getByRole('button', { name: 'Odrzuć' });
            if (await decline.count()) await decline.first().click();
            // Bring lazy images in, then back to the top.
            const height = await page.evaluate(
                () => document.documentElement.scrollHeight,
            );
            for (let y = 0; y < height; y += 600) {
                await page.evaluate((top) => window.scrollTo(0, top), y);
                await page.waitForTimeout(40);
            }
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(400);
            const file = join(outDir, fileName(name, route));
            await page.screenshot({ path: file, fullPage: true });
            const entry = { route, viewport: name, file };
            if (baseline) {
                const basePath = join(baseline, fileName(name, route));
                if (existsSync(basePath)) {
                    const a = PNG.sync.read(readFileSync(basePath));
                    const b = PNG.sync.read(readFileSync(file));
                    const w = Math.max(a.width, b.width);
                    const h = Math.max(a.height, b.height);
                    const pad = (img) => {
                        if (img.width === w && img.height === h) return img;
                        const out = new PNG({ width: w, height: h });
                        PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
                        return out;
                    };
                    const diff = new PNG({ width: w, height: h });
                    const changed = pixelmatch(
                        pad(a).data,
                        pad(b).data,
                        diff.data,
                        w,
                        h,
                        {
                            threshold: 0.15,
                        },
                    );
                    entry.changed = +((changed / (w * h)) * 100).toFixed(2);
                    entry.heightBefore = a.height;
                    entry.heightAfter = b.height;
                    if (changed)
                        writeFileSync(
                            file.replace(/\.png$/, '.diff.png'),
                            PNG.sync.write(diff),
                        );
                } else {
                    entry.changed = null;
                }
            }
            results.push(entry);
        } catch (error) {
            results.push({
                route,
                viewport: name,
                error: String(error).slice(0, 200),
            });
        } finally {
            await page.close();
        }
    }
    await context.close();
}
await browser.close();

writeFileSync(join(outDir, 'summary.json'), JSON.stringify(results, null, 2));
for (const r of results) {
    const change = r.error
        ? `ERROR ${r.error}`
        : r.changed === undefined
          ? 'captured'
          : r.changed === null
            ? 'new (no baseline)'
            : `${r.changed}% px changed, height ${r.heightBefore} → ${r.heightAfter}`;
    console.log(`${r.viewport.padEnd(8)} ${r.route.padEnd(22)} ${change}`);
}
