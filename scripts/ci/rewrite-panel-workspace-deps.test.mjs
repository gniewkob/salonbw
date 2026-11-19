import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./rewrite-panel-workspace-deps.mjs', import.meta.url));

function fixture(t, { brand = true, brandPresent = true, extraDependency = null } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sbw-panel-deps-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));

    const bundle = path.join(dir, 'bundle');
    const manifest = path.join(bundle, 'package.json');
    for (const [subdir, name] of [
        ['api', '@salonbw/api'],
        ...(brandPresent ? [['brand-tokens', '@salonbw/brand-tokens']] : []),
    ]) {
        const dirPath = path.join(bundle, 'packages', subdir);
        fs.mkdirSync(dirPath, { recursive: true });
        fs.writeFileSync(path.join(dirPath, 'package.json'), JSON.stringify({ name }));
    }
    fs.writeFileSync(manifest, JSON.stringify({
        name: '@salonbw/panel',
        dependencies: {
            '@salonbw/api': 'workspace:*',
            ...(brand ? { '@salonbw/brand-tokens': 'workspace:*' } : {}),
            ...(extraDependency ? { [extraDependency]: 'workspace:*' } : {}),
            next: '15.5.28',
        },
    }));
    return { manifest };
}

test('converts both bundled workspace dependencies into npm-installable local packages', (t) => {
    const { manifest } = fixture(t);
    const result = spawnSync(process.execPath, [script, manifest], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const updated = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    assert.equal(updated.dependencies['@salonbw/api'], 'file:./packages/api');
    assert.equal(updated.dependencies['@salonbw/brand-tokens'], 'file:./packages/brand-tokens');
    assert.equal(updated.dependencies.next, '15.5.28');
});

test('refuses a brand-token workspace dependency without a bundled package', (t) => {
    const { manifest } = fixture(t, { brandPresent: false });
    const result = spawnSync(process.execPath, [script, manifest], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.equal(JSON.parse(fs.readFileSync(manifest, 'utf8')).dependencies['@salonbw/api'], 'workspace:*');
});

test('rejects any unbundled workspace dependency instead of leaving npm22 to fail', (t) => {
    const { manifest } = fixture(t, { extraDependency: '@salonbw/unexpected' });
    const result = spawnSync(process.execPath, [script, manifest], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
});

test('retains compatibility with a V18 panel that predates brand tokens', (t) => {
    const { manifest } = fixture(t, { brand: false, brandPresent: false });
    const result = spawnSync(process.execPath, [script, manifest], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    const deps = JSON.parse(fs.readFileSync(manifest, 'utf8')).dependencies;
    assert.equal(deps['@salonbw/api'], 'file:./packages/api');
    assert.equal(deps['@salonbw/brand-tokens'], undefined);
});
