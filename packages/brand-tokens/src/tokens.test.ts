import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { tokens, color } from './index.ts';

const css = fs.readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const declared = new Map(
    [...css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]),
);

test('.brand-fonts resolves the next/font variables', () => {
    const block = css.slice(css.indexOf('.brand-fonts {'));
    assert.match(block, /--font-display: var\(--font-playfair\)/);
    assert.match(block, /--font-body: var\(--font-open-sans\)/);
    assert.match(block, /font-family: var\(--font-body\);/);
});

test('tokens.css mirrors index.ts exactly', () => {
    for (const [name, value] of Object.entries(tokens)) {
        assert.equal(declared.get(name), value, `--${name}`);
    }
    const extra = [...declared.keys()].filter(k => !(k in tokens) && k !== 'brand-hero-black-rgb');
    assert.deepEqual(extra, []);
});

test('palette stays monochrome except the error state', () => {
    for (const [name, hex] of Object.entries(color)) {
        if (name === 'state-error') continue;
        const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
        assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 12, `${name} ${hex} is not neutral`);
    }
});

const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
};

test('documented text pairings meet WCAG AA (skill contrast table)', () => {
    const pairs: [keyof typeof color, keyof typeof color][] = [
        ['brand-silver-ink', 'brand-white'],
        ['brand-warm-muted', 'brand-warm-bg'],
        ['brand-warm-label', 'brand-warm-bg'],
        ['brand-warm-ink', 'brand-warm-bg'],
        ['brand-black', 'brand-silver'],
        ['brand-silver-on-dark', 'brand-hero-black'],
        ['brand-silver-on-dark', 'brand-surface-dark'],
        ['state-error', 'brand-black'],
    ];
    for (const [fg, bg] of pairs) {
        assert.ok(ratio(color[fg], color[bg]) >= 4.5, `${fg} on ${bg} = ${ratio(color[fg], color[bg]).toFixed(2)}`);
    }
    // Silver is decorative only: confirm it really fails as text on white.
    assert.ok(ratio(color['brand-silver'], color['brand-white']) < 3);
});
