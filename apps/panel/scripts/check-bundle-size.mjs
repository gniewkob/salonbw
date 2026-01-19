#!/usr/bin/env node
/**
 * Simple bundle size guard based on Next.js build-manifest.
 * Calculates first-load JS by summing unique JS assets required for each route.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const DEFAULT_LIMIT_KB = 300;
const DEFAULT_ROUTES = [
    '/dashboard/admin',
    '/dashboard/admin/retail',
    '/dashboard/admin/scheduler',
    '/dashboard/employee',
    '/appointments',
];

const limitArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--limit='),
);
const routesArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--routes='),
);

const envLimit = process.env.BUNDLE_FIRST_LOAD_LIMIT_KB;
const limitKb =
    (envLimit ? Number(envLimit) : undefined) ??
    (limitArgIndex !== -1
        ? Number(process.argv[limitArgIndex].split('=')[1])
        : undefined) ??
    DEFAULT_LIMIT_KB;

if (!Number.isFinite(limitKb) || limitKb <= 0) {
    console.error(
        `Invalid bundle size limit "${limitKb}". Provide a positive number via BUNDLE_FIRST_LOAD_LIMIT_KB or --limit.`,
    );
    process.exit(1);
}

const envRoutes = process.env.BUNDLE_ROUTES;
const routesRaw =
    envRoutes ??
    (routesArgIndex !== -1
        ? process.argv[routesArgIndex].split('=')[1]
        : undefined);

const monitoredRoutes = routesRaw
    ? routesRaw
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean)
    : DEFAULT_ROUTES;

if (monitoredRoutes.length === 0) {
    console.error('No routes specified for bundle size check.');
    process.exit(1);
}

const nextDir = fileURLToPath(new URL('../.next/', import.meta.url));
const manifestPath = path.join(nextDir, 'build-manifest.json');

let manifest;
try {
    const manifestRaw = await readFile(manifestPath, 'utf8');
    manifest = JSON.parse(manifestRaw);
} catch (error) {
    console.error(
        `Failed to read Next.js build manifest at ${manifestPath}:`,
        error,
    );
    process.exit(1);
}

const polyfillFiles = new Set(
    Array.isArray(manifest.polyfillFiles) ? manifest.polyfillFiles : [],
);
const rootMainFiles = new Set(
    Array.isArray(manifest.rootMainFiles) ? manifest.rootMainFiles : [],
);
const appFiles = new Set(
    Array.isArray(manifest.pages?.['/_app']) ? manifest.pages['/_app'] : [],
);

const sizeCache = new Map();

async function fileSizeBytes(relativePath) {
    if (sizeCache.has(relativePath)) {
        return sizeCache.get(relativePath);
    }
    const fullPath = path.join(nextDir, relativePath);
    try {
        const content = await readFile(fullPath);
        const gzipped = gzipSync(content);
        const size = gzipped.length;
        sizeCache.set(relativePath, size);
        return size;
    } catch (error) {
        throw new Error(
            `Failed to read bundle file ${relativePath}: ${error.message}`,
        );
    }
}

async function firstLoadBytes(route) {
    const routeFiles = manifest.pages?.[route];
    if (!Array.isArray(routeFiles) || routeFiles.length === 0) {
        throw new Error(`Route "${route}" not found in build-manifest.json`);
    }

    const files = new Set([
        ...polyfillFiles,
        ...rootMainFiles,
        ...appFiles,
        ...routeFiles,
    ]);

    let total = 0;
    for (const file of files) {
        if (typeof file !== 'string') continue;
        if (!file.endsWith('.js')) continue; // skip CSS or other assets
        total += await fileSizeBytes(file);
    }
    return total;
}

const limitBytes = limitKb * 1024;
const results = [];
const violations = [];

for (const route of monitoredRoutes) {
    try {
        const bytes = await firstLoadBytes(route);
        results.push({ route, bytes });
        if (bytes > limitBytes) {
            violations.push({ route, bytes });
        }
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

const formatKb = (bytes) => (bytes / 1024).toFixed(1);

console.log(`Bundle size check (limit ${limitKb} kB first-load JS):`);
for (const { route, bytes } of results) {
    const status = bytes > limitBytes ? '❌' : '✅';
    console.log(
        ` ${status} ${route}: ${formatKb(bytes)} kB (files: ${bytes} bytes)`,
    );
}

if (violations.length > 0) {
    console.error(
        `Bundle size limit exceeded for ${violations
            .map((v) => `${v.route} (${formatKb(v.bytes)} kB)`)
            .join(', ')}.`,
    );
    process.exit(1);
}

console.log('All monitored routes are within the bundle size budget.');
