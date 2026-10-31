'use strict';

// Runs on the target after npm install, before migrations or restart. Keep this
// self-contained: the runtime tree must not supply the verifier's dependencies.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const allowed = {
    'follow-redirects': new Set(['1.16.2']),
    'ip-address': new Set(['10.7.4']),
    'js-yaml': new Set(['3.15.2', '4.3.2', '5.4.1']),
};
const found = new Map(Object.keys(allowed).map((name) => [name, new Set()]));

function scanModules(modules) {
    if (!fs.existsSync(modules)) return;
    for (const entry of fs.readdirSync(modules, { withFileTypes: true })) {
        if (entry.name === '.bin' || entry.name.startsWith('.')) continue;
        const item = path.join(modules, entry.name);
        if (entry.isSymbolicLink()) throw new Error('Unexpected package symlink');
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith('@')) {
            for (const scoped of fs.readdirSync(item, { withFileTypes: true })) {
                if (scoped.isSymbolicLink()) throw new Error('Unexpected package symlink');
                if (scoped.isDirectory()) scanPackage(path.join(item, scoped.name));
            }
        } else scanPackage(item);
    }
}
function scanPackage(dir) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    if (Object.hasOwn(allowed, manifest.name)) {
        if (!allowed[manifest.name].has(manifest.version)) {
            throw new Error(`Unapproved ${manifest.name} version: ${manifest.version}`);
        }
        found.get(manifest.name).add(manifest.version);
    }
    scanModules(path.join(dir, 'node_modules'));
}
try {
    if (process.argv[2] === '--manifest-only') {
        const manifest = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
        const required = {
            'follow-redirects': '1.16.2',
            'ip-address@^10.0.0': '10.7.4',
            'js-yaml@^3': '3.15.2',
            'js-yaml@^4': '4.3.2',
            'js-yaml@^5': '5.4.1',
        };
        for (const [name, version] of Object.entries(required)) {
            if (manifest.overrides?.[name] !== version) {
                throw new Error(`Missing approved npm override: ${name}`);
            }
        }
        console.log('API_MANIFEST_GATE=PASS');
        process.exit(0);
    }
    const axiosManifest = require.resolve('axios/package.json', { paths: [root] });
    const redirectManifest = require.resolve('follow-redirects/package.json', { paths: [path.dirname(axiosManifest)] });
    const modulesRoot = path.resolve(root, 'node_modules') + path.sep;
    if (!fs.realpathSync(axiosManifest).startsWith(modulesRoot) ||
        !fs.realpathSync(redirectManifest).startsWith(modulesRoot)) {
        throw new Error('Axios or follow-redirects resolved outside API installation');
    }
    const redirects = JSON.parse(fs.readFileSync(redirectManifest, 'utf8'));
    if (redirects.name !== 'follow-redirects' || !allowed['follow-redirects'].has(redirects.version)) {
        throw new Error('Axios does not resolve approved follow-redirects');
    }
    scanModules(path.join(root, 'node_modules'));
    if (!found.get('follow-redirects').size) throw new Error('Missing follow-redirects');
    for (const [name, versions] of found) {
        console.log(`${name}: ${[...versions].sort().join(', ') || 'not installed'}`);
    }
    console.log('API_DEPENDENCY_GATE=PASS');
} catch (error) {
    console.error('API_DEPENDENCY_GATE=FAIL');
    console.error(error instanceof Error ? error.message : 'Unknown failure');
    process.exitCode = 1;
}
