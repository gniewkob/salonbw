#!/usr/bin/env node
/**
 * Build-time image optimisation for the landing.
 *
 * Next's image optimiser is off on MyDevil (no runtime sharp), so photos were
 * served as single full-size JPEGs. This script runs before `next build` and
 * writes WebP renditions at a few widths to public/images/_opt/ (gitignored,
 * regenerated every build), plus src/generated/imageManifest.json (committed),
 * which <ResponsiveImage> reads to build srcset.
 *
 *   node scripts/optimize-images.mjs          generate renditions + manifest
 *   node scripts/optimize-images.mjs --check  fail if the manifest is stale
 *
 * Only images listed in OPTIMIZE are processed: the ones the responsive
 * component uses. Unchanged sources are skipped (mtime + size check).
 */
import sharp from 'sharp';
import {
    mkdirSync,
    readFileSync,
    writeFileSync,
    existsSync,
    statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'images', '_opt');
const manifestPath = join(root, 'src', 'generated', 'imageManifest.json');

const OPTIMIZE = [
    '/images/hero/DSC_9576.jpg',
    '/images/hero/DSC_9576-m.jpg',
    '/images/hero/DSC_9583.jpg',
    '/images/hero/DSC_9583-m.jpg',
    '/images/hero/DSC_9584.jpg',
    '/images/salon/salon1.jpg',
    '/images/salon/salon2.jpg',
    '/images/salon/salon3.jpg',
    '/images/salon/salon4.jpg',
    '/images/salon/salon5.jpg',
    '/images/salon/salon6.jpg',
    '/images/salon/salon7.jpg',
    '/images/salon/salon8.jpg',
    '/images/work/airtouch-warkocz.jpg',
    '/images/work/balayage-fale.jpg',
    '/images/work/blond-fale.jpg',
    '/images/work/blond-prosty.jpg',
    '/images/work/chlodny-blond-bob.jpg',
    '/images/work/fale-blond.jpg',
    '/images/work/koloryzacja-farba.jpg',
    '/images/work/pasemka-folie.jpg',
    '/images/work/polysk.jpg',
    '/images/work/prosty-ciemny.jpg',
    '/images/work/upiecie-slubne.jpg',
];
const WIDTHS = [480, 828, 1200, 1600, 2200];
const QUALITY = 70;

const check = process.argv.includes('--check');
const manifest = {};
for (const src of OPTIMIZE) {
    const file = join(publicDir, src);
    const meta = await sharp(file).metadata();
    const widths = WIDTHS.filter((w) => w < meta.width);
    widths.push(meta.width);
    manifest[src] = { width: meta.width, height: meta.height, widths };
    if (check) continue;
    const st = statSync(file);
    for (const w of widths) {
        const out = join(
            outDir,
            `${src.replace(/^\/images\//, '').replace(/\.jpe?g$/i, '')}-${w}.webp`,
        );
        if (existsSync(out) && statSync(out).mtimeMs >= st.mtimeMs) continue;
        mkdirSync(dirname(out), { recursive: true });
        await sharp(file)
            .resize({ width: w })
            .webp({ quality: QUALITY })
            .toFile(out);
    }
}

const json = JSON.stringify(manifest, null, 2) + '\n';
if (check) {
    const current = existsSync(manifestPath)
        ? readFileSync(manifestPath, 'utf8')
        : '';
    if (current !== json) {
        console.error(
            'imageManifest.json is stale: run node scripts/optimize-images.mjs',
        );
        process.exit(1);
    }
    console.log('IMAGE_MANIFEST=OK');
} else {
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, json);
    console.log(`IMAGES_OPTIMIZED=${OPTIMIZE.length}`);
}
