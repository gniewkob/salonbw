const path = require('path');
const fs = require('fs');

// Load environment from .env files if present (server-side only)
function loadDotEnvFiles() {
    const files = ['.env.production', '.env.local', '.env'];
    for (const file of files) {
        const filePath = path.join(__dirname, file);
        try {
            if (!fs.existsSync(filePath)) continue;
            const content = fs.readFileSync(filePath, 'utf8');
            for (const line of content.split('\n')) {
                if (!line || line.trim().startsWith('#')) continue;
                const idx = line.indexOf('=');
                if (idx === -1) continue;
                const key = line.slice(0, idx).trim();
                const valueRaw = line.slice(idx + 1).trim();
                const value = valueRaw.replace(/^['\"]|['\"]$/g, '');
                if (!(key in process.env)) {
                    process.env[key] = value;
                }
            }
        } catch {}
    }
}

loadDotEnvFiles();

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT =
    process.env.PORT ||
    process.env.PASSENGER_PORT ||
    process.env.APP_PORT ||
    '3000';

const standaloneDir = path.join(__dirname, '.next', 'standalone');

// In monorepo builds, Next.js places the standalone server under apps/landing/
// Try monorepo path first, then fall back to root standalone path
const serverMonorepo = path.join(standaloneDir, 'apps', 'landing', 'server.js');
const serverRoot = path.join(standaloneDir, 'server.js');
const server = fs.existsSync(serverMonorepo) ? serverMonorepo : serverRoot;

const staticSource = path.join(__dirname, '.next', 'static');
// For monorepo, standaloneNextDir is inside apps/landing/
const standaloneAppDir = fs.existsSync(serverMonorepo)
    ? path.join(standaloneDir, 'apps', 'landing')
    : standaloneDir;
const standaloneNextDir = path.join(standaloneAppDir, '.next');
const staticTarget = path.join(standaloneNextDir, 'static');
const publicSource = path.join(__dirname, 'public');
const publicTarget = path.join(standaloneAppDir, 'public');
const isStandaloneRuntime = fs.existsSync(server);
const standaloneNodeModules = path.join(standaloneDir, 'node_modules');

function configureModuleResolution() {
    if (!isStandaloneRuntime) return;
    const Module = require('module');
    const extraNodePaths = [
        path.join(standaloneDir, 'node_modules'),
        path.join(__dirname, 'node_modules'),
    ];
    const existingNodePath = process.env.NODE_PATH
        ? process.env.NODE_PATH.split(path.delimiter)
        : [];
    const nodePathSet = new Set(
        [...extraNodePaths, ...existingNodePath].filter(Boolean),
    );
    process.env.NODE_PATH = Array.from(nodePathSet).join(path.delimiter);
    Module._initPaths();
}

function linkDependency(packageName) {
    if (!isStandaloneRuntime) return;
    const source = path.join(__dirname, 'node_modules', packageName);
    const target = path.join(standaloneNodeModules, packageName);
    if (!fs.existsSync(source)) return;
    if (fs.existsSync(target)) return;
    try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.symlinkSync(source, target, 'junction');
        if (process.env.NODE_DEBUG?.includes('standalone')) {
            console.log('[standalone] linking dependency', packageName, '->', target);
        }
    } catch (error) {
        if (error.code !== 'EEXIST') {
            console.warn(
                `Unable to link ${packageName} into standalone bundle (${error.message}).`,
            );
        }
    }
}

function syncNextDist() {
    if (!isStandaloneRuntime) return;
    const source = path.join(__dirname, 'node_modules', 'next', 'dist');
    const target = path.join(standaloneNodeModules, 'next', 'dist');
    if (!fs.existsSync(source)) return;
    try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (fs.existsSync(target)) {
            fs.rmSync(target, { recursive: true, force: true });
        }
        fs.symlinkSync(source, target, 'junction');
        if (process.env.NODE_DEBUG?.includes('standalone')) {
            console.log('[standalone] syncing Next dist to', target);
        }
    } catch (error) {
        console.warn('Unable to sync Next.js dist:', error.message);
    }
}

// Ensure the standalone server can resolve hashed assets
function linkStaticAssets() {
    if (!isStandaloneRuntime) return;
    if (!fs.existsSync(staticSource)) return;
    try {
        fs.mkdirSync(standaloneNextDir, { recursive: true });
        if (!fs.existsSync(staticTarget)) {
            try {
                fs.symlinkSync(staticSource, staticTarget, 'junction');
            } catch {
                // fallback: copy
                fs.cpSync(staticSource, staticTarget, { recursive: true });
            }
        }
        const relative = path.relative(standaloneNextDir, staticSource) || '.';
        if (process.env.NODE_DEBUG?.includes('standalone')) {
            console.log('[standalone] linked static assets', relative, '->', staticTarget);
        }
    } catch (error) {
        console.warn(
            `Failed to copy Next.js static assets into standalone bundle: ${error.message}`,
        );
    }
}

function linkPublicAssets() {
    if (!isStandaloneRuntime) return;
    if (!fs.existsSync(publicSource)) return;
    try {
        if (!fs.existsSync(publicTarget)) {
            try {
                fs.symlinkSync(publicSource, publicTarget, 'junction');
            } catch {
                fs.cpSync(publicSource, publicTarget, { recursive: true });
            }
        }
        const relative = path.relative(standaloneDir, publicSource) || '.';
        if (process.env.NODE_DEBUG?.includes('standalone')) {
            console.log('[standalone] linked public assets', relative, '->', publicTarget);
        }
    } catch (error) {
        console.warn(
            `Unable to prepare public assets for standalone runtime (${error.message}).`,
        );
    }
}

configureModuleResolution();
linkDependency('sharp');
linkDependency('next');
syncNextDist();
linkStaticAssets();
linkPublicAssets();

// Initialize webcrypto polyfill if needed
if (typeof globalThis.crypto === 'undefined') {
    try {
        globalThis.crypto = require('node:crypto').webcrypto;
    } catch (error) {
        console.warn('Unable to initialise webcrypto', error);
    }
}

if (!isStandaloneRuntime) {
    throw new Error(
        'Missing Next.js standalone server. Run `next build` before starting.',
    );
}

require(server);
