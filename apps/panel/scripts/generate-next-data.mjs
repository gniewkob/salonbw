import fs from 'fs';
import path from 'path';

const nextDir = path.join(process.cwd(), '.next');
const buildIdPath = path.join(nextDir, 'BUILD_ID');
const manifestPath = path.join(nextDir, 'server', 'pages-manifest.json');

if (!fs.existsSync(buildIdPath) || !fs.existsSync(manifestPath)) {
    console.warn('[generate-next-data] Missing build output, skipping.');
    process.exit(0);
}

const buildId = fs.readFileSync(buildIdPath, 'utf8').trim();
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const outDir = path.join(nextDir, 'data', buildId);

const shouldSkip = (route) => {
    if (route.startsWith('/_')) return true;
    if (route.startsWith('/api')) return true;
    if (route === '/404' || route === '/500') return true;
    if (route.endsWith('.xml')) return true;
    return false;
};

const toDataPath = (route) => {
    const normalized = route === '/' ? '/index' : route;
    return `${normalized}.json`;
};

fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const route of Object.keys(manifest)) {
    if (shouldSkip(route)) continue;
    const rel = toDataPath(route);
    const target = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (!fs.existsSync(target)) {
        const payload = JSON.stringify({ pageProps: {} });
        fs.writeFileSync(target, payload);
        count += 1;
    }
}

console.log(`[generate-next-data] Wrote ${count} data files to ${outDir}`);
