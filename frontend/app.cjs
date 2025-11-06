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
const server = path.join(standaloneDir, 'server.js');

const staticSource = path.join(__dirname, '.next', 'static');
const standaloneNextDir = path.join(standaloneDir, '.next');
const staticTarget = path.join(standaloneNextDir, 'static');
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
    for (const p of extraNodePaths) {
        if (!Module.globalPaths.includes(p)) {
            Module.globalPaths.push(p);
        }
        if (require.main && !require.main.paths.includes(p)) {
            require.main.paths.push(p);
        }
    }
}

configureModuleResolution();

function ensureStandaloneDependency(packageName) {
    if (!isStandaloneRuntime) return;
    const source = path.join(__dirname, 'node_modules', packageName);
    const target = path.join(standaloneNodeModules, packageName);
    if (!fs.existsSync(source)) return;
    try {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (fs.existsSync(target)) return;
        try {
            fs.symlinkSync(source, target, 'junction');
        } catch {
            fs.cpSync(source, target, { recursive: true });
        }
    } catch (error) {
        console.warn(
            `Unable to link ${packageName} into standalone bundle (${error.message}).`,
        );
    }
}

function syncNextRuntimeArtifacts() {
    if (!isStandaloneRuntime) return;
    const source = path.join(__dirname, 'node_modules', 'next', 'dist');
    const target = path.join(standaloneNodeModules, 'next', 'dist');
    try {
        if (!fs.existsSync(source)) return;
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.cpSync(source, target, { recursive: true });
    } catch (error) {
        console.warn(
            `Unable to synchronise Next.js runtime assets (${error.message}).`,
        );
    }
}

ensureStandaloneDependency('@next/env');
ensureStandaloneDependency('@swc/helpers');
ensureStandaloneDependency('styled-jsx');
ensureStandaloneDependency('picocolors');
syncNextRuntimeArtifacts();

// Ensure the standalone server can resolve hashed assets even if the deployment
// environment does not pre-create the expected symlink.
function ensureStaticAssets() {
    if (!isStandaloneRuntime) return;
    if (!fs.existsSync(staticSource)) {
        console.warn(
            `Next.js static assets directory not found at ${staticSource}.`,
        );
        return;
    }

    fs.mkdirSync(standaloneNextDir, { recursive: true });

    let needsLink = true;
    if (fs.existsSync(staticTarget)) {
        try {
            const targetStat = fs.lstatSync(staticTarget);
            if (targetStat.isSymbolicLink()) {
                try {
                    const resolved = fs.realpathSync(staticTarget);
                    if (resolved === staticSource) {
                        needsLink = false;
                    } else {
                        fs.rmSync(staticTarget, { recursive: true, force: true });
                    }
                } catch {
                    fs.rmSync(staticTarget, { recursive: true, force: true });
                }
            } else if (targetStat.isDirectory()) {
                needsLink = false;
            } else {
                fs.rmSync(staticTarget, { recursive: true, force: true });
            }
        } catch {
            fs.rmSync(staticTarget, { recursive: true, force: true });
        }
    }

    if (needsLink) {
        const relative = path.relative(standaloneNextDir, staticSource) || '.';
        try {
            fs.symlinkSync(relative, staticTarget, 'junction');
            needsLink = false;
        } catch (error) {
            console.warn(
                `Unable to create symlink for Next.js static assets: ${error.message}`,
            );
        }
    }

    if (needsLink) {
        try {
            fs.cpSync(staticSource, staticTarget, { recursive: true });
        } catch (error) {
            console.error(
                `Failed to copy Next.js static assets into standalone bundle: ${error.message}`,
            );
        }
    }
}

ensureStaticAssets();

if (process.env.NODE_DEBUG?.includes('standalone')) {
    console.log('[standalone] NODE_PATH', process.env.NODE_PATH);
    if (require.main) {
        console.log('[standalone] main paths', require.main.paths);
    }
}

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
