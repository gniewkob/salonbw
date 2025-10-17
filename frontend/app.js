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

const polyfillTarget = path.join(
    standaloneDir,
    'node_modules',
    'next',
    'dist',
    'server',
    'node-polyfill-crypto.js',
);

if (!fs.existsSync(polyfillTarget)) {
    const polyfillSource = path.join(
        __dirname,
        'node_modules',
        'next',
        'dist',
        'server',
        'node-polyfill-crypto.js',
    );
    fs.mkdirSync(path.dirname(polyfillTarget), { recursive: true });
    fs.copyFileSync(polyfillSource, polyfillTarget);
}

if (typeof globalThis.crypto === 'undefined') {
    try {
        globalThis.crypto = require('node:crypto').webcrypto;
    } catch (error) {
        console.warn('Unable to initialise webcrypto', error);
    }
}

require(server);
