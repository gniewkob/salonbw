import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { chooseOwnerUatSlot } from '../../apps/panel/tests/visual/helpers/v18-owner-uat-slot.mjs';

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
    assert.match(e2e, /chooseOwnerUatSlot\(/);
    assert.match(e2e, /page\.request\.get\(\s*'\/api\/calendar\/opening-hours'/);
    const helper = readFileSync(
        new URL('apps/panel/tests/visual/helpers/v18-owner-uat-slot.mjs', root),
        'utf8',
    );
    assert.match(helper, /start \+ 45 > close/);
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

test('disposable real-stack QA seeds explicit branch hours before starting Nest', () => {
    const fixture = readFileSync(
        new URL('backend/salonbw-backend/scripts/qa-owner-browser-postgres.ts', root),
        'utf8',
    );
    assert.match(fixture, /async function seed\(db: DataSource\)/);
    assert.match(fixture, /getRepository\(Branch\)/);
    assert.match(fixture, /status: BranchStatus\.Active/);
    assert.match(fixture, /mon: \{ open: '10:00', close: '19:00' \}/);
    assert.match(fixture, /sat: \{ open: '09:00', close: '15:00' \}/);
    assert.match(fixture, /sun: null/);
    assert.match(fixture, /OWNER_BROWSER_WEEKLY_HOURS_FIXTURE=PASS/);
    assert.match(e2e, /expect\(openingHours\.source\)\.toBe\('branch'\)/);
    assert.doesNotMatch(e2e, /page\.route\([^\n]*calendar\/opening-hours/);
});

test('real weekly slot parser selects Monday after closed Sunday (regression: escaped digit regex)', () => {
    const hours = {
        mon: [{ open: '10:00', close: '19:00' }],
        tue: [{ open: '10:00', close: '19:00' }],
        wed: [{ open: '10:00', close: '19:00' }],
        thu: [{ open: '10:00', close: '19:00' }],
        fri: [{ open: '10:00', close: '19:00' }],
        sat: [{ open: '09:00', close: '15:00' }],
        sun: [],
    };
    assert.deepEqual(chooseOwnerUatSlot(hours, '2026-11-15'),
        { date: '2026-11-16', time: '10:15:00' });
    assert.deepEqual(chooseOwnerUatSlot(hours, '2026-11-21'),
        { date: '2026-11-21', time: '09:15:00' });
    assert.deepEqual(chooseOwnerUatSlot(hours, '2026-12-13'),
        { date: '2026-12-14', time: '10:15:00' });
});

test('real weekly slot parser rejects malformed/too-short schedules without force-click fallback', () => {
    assert.throws(
        () => chooseOwnerUatSlot({ mon: [{ open: '10:00', close: '10:30' }] }, '2026-11-16'),
        /OWNER_BROWSER_UAT_NO_BOOKABLE_WEEKLY_SLOT/,
    );
    assert.throws(
        () => chooseOwnerUatSlot({ mon: [{ open: 'wrong', close: '19:00' }] }, '2026-11-16'),
        /OWNER_BROWSER_UAT_NO_BOOKABLE_WEEKLY_SLOT/,
    );
    assert.throws(
        () => chooseOwnerUatSlot({}, 'invalid'),
        /OWNER_BROWSER_UAT_INVALID_DATE/,
    );
});
