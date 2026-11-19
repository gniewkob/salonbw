import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('V18 panel consumes brand package before its own styles', () => {
    const manifest = JSON.parse(read('apps/panel/package.json'));
    const app = read('apps/panel/src/pages/_app.tsx');
    assert.equal(manifest.dependencies['@salonbw/brand-tokens'], 'workspace:*');
    const sequence = [
        "import 'bootstrap/dist/css/bootstrap.min.css';",
        "import '@salonbw/brand-tokens/tokens.css';",
        "import '@salonbw/brand-tokens/fonts.css';",
        "import '@/styles/salon-theme.css';",
    ];
    const positions = sequence.map((line) => app.indexOf(line));
    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
});

test('self-hosted brand fonts exist and document has no Google Fonts', () => {
    const manifest = JSON.parse(read('packages/brand-tokens/package.json'));
    assert.equal(manifest.exports['./fonts.css'], './src/fonts.css');
    const css = read('packages/brand-tokens/src/fonts.css');
    for (const font of ['OpenSans.woff2', 'PlayfairDisplay.woff2', 'PlayfairDisplay-Italic.woff2']) {
        assert.match(css, new RegExp(font.replace('.', '\\.')));
        assert.ok(statSync(resolve(root, 'packages/brand-tokens/fonts', font)).size > 10_000);
    }
    const doc = read('apps/panel/src/pages/_document.tsx');
    assert.doesNotMatch(doc, /fonts\.(?:googleapis|gstatic)\.com|\bLato\b/);
    assert.match(doc, /cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/);
});

test('legacy panel color values resolve to shared tokens', () => {
    const css = read('apps/panel/src/styles/salon-theme.css');
    for (const [alias, token] of [
        ['--salon-accent', '--brand-silver'],
        ['--salon-brand', '--brand-silver'],
        ['--salon-brand-hover', '--brand-silver-dark'],
        ['--salon-bg', '--brand-white'],
        ['--bs-primary', '--brand-black'],
    ]) {
        assert.ok(css.includes(`${alias}: var(${token});`), alias);
    }
    assert.match(read('packages/brand-tokens/src/tokens.css'), /--brand-black:\s*#0d0d0d/);
});
