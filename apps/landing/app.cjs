/**
 * Production server for Landing (dev.salon-bw.pl)
 * Uses standard Next.js build (not standalone)
 * Compatible with Passenger/MyDevil hosting
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment from .env files if present
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
const PORT =
    parseInt(process.env.PORT || process.env.PASSENGER_PORT || '3000', 10);
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

console.log('[landing] Starting Next.js server');
console.log('[landing] Node version:', process.version);
console.log('[landing] Working directory:', __dirname);
console.log('[landing] PORT:', PORT);
console.log('[landing] HOSTNAME:', HOSTNAME);

// Verify Next.js build exists
const nextDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextDir)) {
    console.error('[landing] ERROR: .next directory not found. Run `next build` first.');
    process.exit(1);
}

const buildManifest = path.join(nextDir, 'build-manifest.json');
if (!fs.existsSync(buildManifest)) {
    console.error('[landing] ERROR: build-manifest.json not found. Build may be incomplete.');
    process.exit(1);
}

console.log('[landing] Next.js build directory found');

// Initialize webcrypto polyfill if needed
if (typeof globalThis.crypto === 'undefined') {
    try {
        globalThis.crypto = require('node:crypto').webcrypto;
        console.log('[landing] Initialized webcrypto polyfill');
    } catch (error) {
        console.warn('[landing] Unable to initialize webcrypto:', error.message);
    }
}

// Start Next.js server
try {
    const next = require('next');
    const app = next({
        dev: false,
        dir: __dirname,
        hostname: HOSTNAME,
        port: PORT,
    });

    const handle = app.getRequestHandler();

    console.log('[landing] Preparing Next.js application...');

    app.prepare().then(() => {
        const server = http.createServer((req, res) => {
            handle(req, res);
        });

        server.listen(PORT, HOSTNAME, (err) => {
            if (err) {
                console.error('[landing] Failed to start server:', err);
                throw err;
            }
            console.log(`[landing] Server ready on http://${HOSTNAME}:${PORT}`);
            console.log('[landing] Build ID:', app.buildId);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('[landing] SIGTERM received, closing server...');
            server.close(() => {
                console.log('[landing] Server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('[landing] SIGINT received, closing server...');
            server.close(() => {
                console.log('[landing] Server closed');
                process.exit(0);
            });
        });
    }).catch((err) => {
        console.error('[landing] Failed to prepare Next.js app:', err);
        process.exit(1);
    });
} catch (error) {
    console.error('[landing] Fatal error starting server:', error);
    process.exit(1);
}
