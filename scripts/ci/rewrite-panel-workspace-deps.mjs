#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Make a self-contained Mac-built panel installable by npm22 on FreeBSD.
// Fail before touching the manifest when a declared workspace package is absent.
const manifest = process.argv[2];
if (process.argv.length !== 3 || !manifest) {
    throw new Error('Usage: rewrite-panel-workspace-deps.mjs <bundle/package.json>');
}
const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8'));
if (pkg.name !== '@salonbw/panel' ||
    pkg.dependencies?.['@salonbw/api'] !== 'workspace:*') {
    throw new Error('Unexpected panel dependency manifest');
}

const packageNames = [
    ['@salonbw/api', 'api'],
    ['@salonbw/brand-tokens', 'brand-tokens'],
];
for (const [name, directory] of packageNames) {
    if (!(name in pkg.dependencies)) continue;
    if (pkg.dependencies[name] !== 'workspace:*') {
        throw new Error(`Unexpected workspace specifier for ${name}`);
    }

    const packageFile = path.join(path.dirname(manifest), 'packages', directory, 'package.json');
    const status = fs.lstatSync(packageFile);
    if (!status.isFile() || status.isSymbolicLink() ||
        JSON.parse(fs.readFileSync(packageFile, 'utf8')).name !== name) {
        throw new Error(`Invalid bundled workspace package: ${name}`);
    }
    pkg.dependencies[name] = `file:./packages/${directory}`;
}

if (Object.values(pkg.dependencies).some(
    (version) => typeof version === 'string' && version.startsWith('workspace:'),
)) {
    throw new Error('Unbundled workspace dependency');
}
fs.writeFileSync(manifest, JSON.stringify(pkg, null, 2) + '\n');
