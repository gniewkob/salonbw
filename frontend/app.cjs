const path = require('path');
const fs = require('fs');

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

// Ensure the standalone server can resolve hashed assets even if the deployment
// environment does not pre-create the expected symlink.
function ensureStaticAssets() {
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

if (typeof globalThis.crypto === 'undefined') {
    try {
        globalThis.crypto = require('node:crypto').webcrypto;
    } catch (error) {
        console.warn('Unable to initialise webcrypto', error);
    }
}

require(server);
