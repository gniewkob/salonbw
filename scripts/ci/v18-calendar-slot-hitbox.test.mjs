import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// Fast, dependency-free preflight. Source regression evidence only; the real
// FullCalendar/browser/Nest/Postgres behavior is verified by Docker Playwright.
const root = new URL('../../', import.meta.url);
const css = readFileSync(new URL('apps/panel/src/styles/V18Calendar.module.css', root), 'utf8');
const e2e = readFileSync(
    new URL('apps/panel/tests/visual/studio-v18-owner-real-stack.spec.ts', root),
    'utf8',
);

test('Studio V18 non-business overlay remains visual and cannot steal pointer clicks', () => {
    assert.match(
        css,
        /\.calendarSurface\s+:global\(\.fc \.fc-non-business\)\s*\{\s*pointer-events:\s*none;\s*\}/,
    );
    assert.doesNotMatch(css, /\.fc-non-business\s*\{\s*pointer-events:\s*none/);
});

test('real-stack mobile UAT chooses a future service-length slot from live opening hours', () => {
    assert.match(e2e, /chooseOwnerUatSlot\(openingHours\.hours!\)/);
    assert.match(e2e, /page\.request\.get\(\s*'\/api\/calendar\/opening-hours'/);
    assert.match(e2e, /slot \+ 45 > close/);
    assert.match(e2e, /\.fc-timegrid-slot-lane\[data-time=/);
    assert.match(e2e, /await timedSlot\.click\(\)/);
    assert.doesNotMatch(e2e, /timedSlot\.click\(\{\s*force:\s*true/);
    assert.doesNotMatch(e2e, /data-time="10:15:00"/);
});

test('real-stack UAT explicitly asserts shading and selected calendar date', () => {
    assert.match(e2e, /nonBusinessBands\.first\(\)\)\.toHaveCSS\(/);
    assert.match(e2e, /'pointer-events',[\s\S]*?'none'/);
    assert.match(e2e, /searchParams\.get\('date'\)[\s\S]*?\.toBe\(targetDate\)/);
});
