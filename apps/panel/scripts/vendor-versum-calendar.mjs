import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const panelRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(panelRoot, '..', '..');
const templatePath = path.resolve(
    repoRoot,
    'static_preview/templates/calendar_template.html',
);
const outRoot = path.resolve(panelRoot, 'public/versum-calendar');
const manifestPath = path.resolve(outRoot, 'asset-manifest.json');

const CDN = 'https://app-cdn.versum.net';

const extraAssetUrls = [
    'https://app-cdn.versum.net/assets/libphonenumber-556af29858c1016d2dfaafef0c2bada81b3535278345c228e54f576a9b7f268f.js',
];

function toAbsoluteUrl(url) {
    if (url.startsWith('https://')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${CDN}${url}`;
    return `${CDN}/${url.replace(/^\/+/, '')}`;
}

function normalizeToLocalPath(sourceUrl) {
    const u = new URL(sourceUrl);
    const pathname = u.pathname.replace(/^\//, '');
    return pathname;
}

async function ensureDir(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function downloadTo(sourceUrl, destination) {
    const res = await fetch(sourceUrl);
    if (!res.ok) {
        return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await ensureDir(destination);
    await fs.writeFile(destination, buffer);
    return buffer;
}

function sha256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

function extractAssetUrls(html) {
    const urls = new Set();
    const linkOrScript = /<(?:link|script)[^>]+(?:href|src)=["']([^"']+)["']/gi;
    let m;
    while ((m = linkOrScript.exec(html)) !== null) {
        const raw = m[1].trim();
        if (raw.includes('app-cdn.versum.net')) {
            urls.add(toAbsoluteUrl(raw));
        }
    }
    return [...urls];
}

function extractCssUrls(cssText, baseUrl) {
    const urls = new Set();
    const re = /url\(([^)]+)\)/gi;
    let m;
    while ((m = re.exec(cssText)) !== null) {
        const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (
            !raw ||
            raw.startsWith('data:') ||
            raw.startsWith('#') ||
            raw.startsWith('svg(')
        )
            continue;
        if (
            raw.startsWith('http://') ||
            raw.startsWith('https://') ||
            raw.startsWith('//')
        ) {
            if (
                raw.includes('app-cdn.versum.net') ||
                raw.startsWith('//app-cdn.versum.net')
            ) {
                urls.add(toAbsoluteUrl(raw));
            }
            continue;
        }
        if (raw.startsWith('/')) {
            urls.add(toAbsoluteUrl(raw));
            continue;
        }
        if (baseUrl) {
            urls.add(new URL(raw, baseUrl).toString());
        }
    }
    return [...urls];
}

async function main() {
    const template = await fs.readFile(templatePath, 'utf8');
    await fs.rm(outRoot, { recursive: true, force: true });
    await fs.mkdir(outRoot, { recursive: true });

    const initialUrls = new Set([
        ...extractAssetUrls(template),
        ...extraAssetUrls.map(toAbsoluteUrl),
    ]);
    const downloaded = new Map();
    const missing = [];

    const queue = [...initialUrls];

    while (queue.length > 0) {
        const sourceUrl = queue.shift();
        if (!sourceUrl || downloaded.has(sourceUrl)) continue;

        const localRel = normalizeToLocalPath(sourceUrl);
        const destination = path.resolve(outRoot, localRel);
        const content = await downloadTo(sourceUrl, destination);
        if (!content) {
            missing.push(sourceUrl);
            continue;
        }
        downloaded.set(sourceUrl, {
            source: sourceUrl,
            localPath: `/versum-calendar/${localRel}`,
            file: localRel,
            sha256: sha256(content),
            bytes: content.length,
        });

        if (sourceUrl.endsWith('.css')) {
            const cssText = content.toString('utf8');
            const cssAssets = extractCssUrls(cssText, sourceUrl);
            for (const u of cssAssets) {
                if (!downloaded.has(u)) queue.push(u);
            }
        }
    }

    const manifest = {
        generatedAt: new Date().toISOString(),
        sourceTemplate: path.relative(repoRoot, templatePath),
        assets: [...downloaded.values()].sort((a, b) =>
            a.file.localeCompare(b.file),
        ),
        missing,
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    let html = template;

    html = html.replaceAll('https://app-cdn.versum.net/', '/versum-calendar/');
    html = html.replaceAll('//app-cdn.versum.net/', '/versum-calendar/');

    html = html.replaceAll('/salonblackandwhite/events/', '/events/');
    html = html.replaceAll(
        '/salonblackandwhite/settings/timetable/schedules/',
        '/settings/timetable/schedules/',
    );
    html = html.replaceAll(
        '/salonblackandwhite/track_new_events.json',
        '/track_new_events.json',
    );
    html = html.replaceAll('/salonblackandwhite/graphql', '/graphql');
    html = html.replaceAll('/salonblackandwhite/calendar', '/calendar');
    html = html.replaceAll('/salonblackandwhite/customers', '/clients');
    html = html.replaceAll('/salonblackandwhite/products', '/products');
    html = html.replaceAll(
        '/salonblackandwhite/statistics/dashboard',
        '/statistics',
    );
    html = html.replaceAll(
        '/salonblackandwhite/communication',
        '/communication',
    );
    html = html.replaceAll('/salonblackandwhite/services', '/services');
    html = html.replaceAll('/salonblackandwhite/settings', '/settings');
    html = html.replaceAll('/salonblackandwhite/extension/', '/extension/');
    html = html.replaceAll('/salonblackandwhite/helps/new', '/helps/new');
    html = html.replaceAll('/salonblackandwhite/signout', '/signout');
    html = html.replaceAll(
        '/salonblackandwhite/global_searches',
        '/global_searches',
    );
    html = html.replaceAll(
        'https://panel.versum.com/salonblackandwhite',
        '/dashboard',
    );

    html = html.replace(
        'return "https://app-cdn.versum.net/" + basePath + "";',
        'return "/versum-calendar/" + basePath.replace(/^\\/+/, "");',
    );

    const compatBootstrap = `\n<script>\nwindow.reactLegacyBridge = window.reactLegacyBridge || {};\nwindow.reactLegacyBridge.notificationCenter = window.reactLegacyBridge.notificationCenter || { renderNotificationCenterNavbar: function(){} };\nwindow.TodoHelpers = window.TodoHelpers || { resizeTasksBox: function(){} };\nwindow.__VERSUM_CALENDAR_EMBED__ = true;\n</script>\n`;

    html = html.replace('</head>', `${compatBootstrap}</head>`);

    const outHtmlPath = path.resolve(outRoot, 'index.html');
    await fs.writeFile(outHtmlPath, html);

    console.log(`Vendored ${manifest.assets.length} assets`);
    if (missing.length > 0) {
        console.log(`Skipped missing assets: ${missing.length}`);
    }
    console.log(`HTML written to ${path.relative(repoRoot, outHtmlPath)}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
