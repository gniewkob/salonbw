const path = require('path');
const fs = require('fs');
const http = require('http');

// Global error handler to report errors via HTTP if possible
function reportStartupError(err) {
    console.error('CRITICAL STARTUP ERROR:', err);
    const port = process.env.PORT || process.env.PASSENGER_PORT || '3000';
    try {
        const server = http.createServer((req, res) => {
            res.writeHead(500, {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(
                `Application Failed to Start (Global Catch)\n\nError: ${err.message}\nStack: ${err.stack}\n\nEnvironment:\n${JSON.stringify(process.env, null, 2)}`,
            );
        });
        server.listen(port, () => {
            console.log(`Diagnostic server running on port ${port}`);
        });
    } catch (e) {
        process.exit(1);
    }
}

try {
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
                    const value = valueRaw.replace(/^["']|["']$/g, '');
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
    const serverFile = path.join(standaloneDir, 'server.js');

    const standaloneNodeModules = path.join(standaloneDir, 'node_modules');

    function configureModuleResolution() {
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

    function ensureStandaloneDependency(packageName) {
        let resolvedDir;
        try {
            const resolved = require.resolve(`${packageName}/package.json`, {
                paths: [__dirname],
            });
            resolvedDir = path.dirname(resolved);
        } catch {
            try {
                const nextPkg = require.resolve('next/package.json', {
                    paths: [__dirname],
                });
                const nextRequire = require('module').createRequire(nextPkg);
                resolvedDir = path.dirname(
                    nextRequire.resolve(`${packageName}/package.json`),
                );
            } catch {
                return;
            }
        }
        const source = resolvedDir;
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
            console.warn(`Unable to link ${packageName}: ${error.message}`);
        }
    }

    if (fs.existsSync(standaloneDir)) {
        configureModuleResolution();
        ensureStandaloneDependency('next');
        ensureStandaloneDependency('@next/env');
        ensureStandaloneDependency('@swc/helpers');
        ensureStandaloneDependency('styled-jsx');
        ensureStandaloneDependency('picocolors');
    }

    if (typeof globalThis.crypto === 'undefined') {
        try {
            globalThis.crypto = require('node:crypto').webcrypto;
        } catch (error) {
            console.warn('Unable to initialise webcrypto', error);
        }
    }

    if (!fs.existsSync(serverFile)) {
        throw new Error(
            `Missing Next.js standalone server at ${serverFile}. Run next build first.`,
        );
    }

    // Try starting the real server
    console.log('Loading standalone server from', serverFile);
    require(serverFile);
} catch (err) {
    reportStartupError(err);
}
