import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('Docker runner never publishes host ports or bind-mounts host files', () => {
    const compose = read('scripts/qa/v18-docker/compose.yaml');
    assert.match(compose, /network_mode:\s*"service:db"/);
    assert.match(compose, /internal:\s*true/);
    assert.match(compose, /tmpfs:/);
    assert.doesNotMatch(compose, /^\s*ports\s*:/m);
    assert.doesNotMatch(compose, /^\s*volumes\s*:/m);
    assert.doesNotMatch(compose, /network_mode:\s*host/);
    assert.match(compose, /QA_ISOLATED_DOCKER:\s*"1"/);
});

test('Dockerfile-specific ignores prevent importing local secrets', () => {
    const ignore = read('scripts/qa/v18-docker/Dockerfile.dockerignore');
    for (const glob of [
        '**/.git',
        '**/.env',
        '**/.env.*',
        '**/.ssh',
        '**/node_modules',
        '**/*.pem',
        '**/*.key',
    ]) {
        assert.ok(ignore.includes(glob), 'Missing ignore rule: ' + glob);
    }
    const dockerfile = read('scripts/qa/v18-docker/Dockerfile');
    assert.match(dockerfile, /API_PROXY_URL=http:\/\/127\.0\.0\.1:3200/);
    assert.match(dockerfile, /OUTBOUND_DELIVERY_ENABLED=false/);
    assert.match(dockerfile, /NEXT_PUBLIC_DEPLOYMENT_ENV=development/);
});

test('fixture requires a Docker identity and exact immutable SHA for local mode', () => {
    const fixture = read(
        'backend/salonbw-backend/scripts/qa-owner-browser-postgres.ts',
    );
    const desktop = read(
        'apps/panel/tests/visual/studio-v18-calendar-drag-real-stack.spec.ts',
    );
    const mobile = read(
        'apps/panel/tests/visual/studio-v18-owner-real-stack.spec.ts',
    );
    for (const source of [fixture, desktop, mobile]) {
        assert.match(source, /QA_ISOLATED_DOCKER\s*===\s*'1'/);
        assert.match(source, /existsSync\('\/\.dockerenv'\)/);
        assert.match(source, /V18_QA_SOURCE_SHA/);
        assert.match(source, /process\.env\.CI\s*===\s*'true'/);
        assert.match(source, /GITHUB_ACTIONS\s*===\s*'true'/);
    }
    assert.match(fixture, /dropSchema:\s*false/);
    assert.match(fixture, /BEGIN TRANSACTION READ ONLY/);
    assert.match(fixture, /OWNER_BROWSER_PG_NONEMPTY_DB=BLOCKED/);
    const runner = read('scripts/qa/v18-docker/run.sh');
    assert.match(
        runner,
        /grep -qx 'OWNER_BROWSER_PG_NONEMPTY_DB=BLOCKED'/,
    );
});

test('manual V18 off-hours grid shading cannot intercept appointment slot clicks', () => {
    const calendar = read('apps/panel/src/components/calendar/CalendarView.tsx');
    const css = read('apps/panel/src/styles/globals.css');
    const mobileUat = read(
        'apps/panel/tests/visual/studio-v18-owner-real-stack.spec.ts',
    );
    // Only opt in when a manual slot click handler is provided. Legacy calendar
    // and other FullCalendar views retain their original pointer behavior.
    assert.match(calendar, /salonbw-calendar-frame--manual-slot-create/);
    assert.match(calendar, /onTimeSlotClick\s*\?/);
    assert.match(
        css,
        /\.salonbw-calendar-frame--manual-slot-create\s+\.fc-timegrid-col-bg\s*\{\s*pointer-events:\s*none;\s*\}/,
    );
    assert.match(css, /\.fc-non-business\s*\{/);
    // Mobile UAT emulates an iPhone: choose an actual visible calendar-column
    // intersection, then tap through Playwright's native touch input.
    assert.match(mobileUat, /await page\.touchscreen\.tap\(hit\.x, hit\.y\)/);
    assert.match(mobileUat, /page\.viewportSize\(\)/);
    assert.match(mobileUat, /Math\.min\(browserViewport\.width, columnRect\.right\)/);
    assert.match(mobileUat, /Math\.min\(\s*browserViewport\.height,/);
    assert.match(mobileUat, /document\.elementFromPoint\(x, y\)/);
    // FullCalendar's time-grid slats are sibling cells of the dated columns.
    // A real touch can hit the slot-lane <td> directly (verified on Mac).
    assert.match(mobileUat, /\.fc-timegrid-slot-lane, \.fc-timegrid-col/);
    assert.doesNotMatch(mobileUat, /element\.closest\('\.fc-timegrid-col'\)/);
    // 00 represents both an hour and a minute; strict locator must choose
    // the minute button rather than two identical accessible names.
    assert.match(
        mobileUat,
        /getByRole\('button', \{ name: '00', exact: true \}\)\.last\(\)\.click\(\)/,
    );
    // FullCalendar's first .fc-timegrid-col is the 21px time-axis column,
    // never the dated working-day cell. Scope the mobile target to data-date.
    assert.match(mobileUat, /dayColumnSelector/);
    assert.match(mobileUat, /fc-timegrid-col\[data-date=/);
    assert.match(mobileUat, /V18 mobile calendar slot opens manual drawer/);
    assert.match(
        mobileUat,
        /P0 browser -> Next -> Nest -> PostgreSQL: owner creates, reschedules and cancels/,
    );
    assert.match(mobileUat, /const edit = page\.getByRole\('dialog', \{ name: 'Rezerwacja wizyty V18' \}\)/);
    // Only executable code counts: a documentation comment reading
    // "Do not use force:true" must not fail this safety contract.
    const withoutStandaloneComments = mobileUat.replace(/^\s*\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(withoutStandaloneComments, /\bforce\s*:\s*true\b/);
});

test('forced-click contract ignores comments but rejects actual Playwright options', () => {
    const strip = (source) => source.replace(/^\s*\/\/[^\n]*$/gm, '');
    assert.doesNotMatch(
        strip('// Do not use force:true: preserve real pointer hit testing.'),
        /\bforce\s*:\s*true\b/,
    );
    assert.match(
        strip('await locator.click({ force: true });'),
        /\bforce\s*:\s*true\b/,
    );
});

test('Docker QA executes owner CRUD, DB verifier, mobile gesture and desktop DnD independently', () => {
    const runner = read('scripts/qa/v18-docker/run.sh');
    const required = [
        'V18_DOCKER_OWNER_BROWSER_CRUD',
        'V18_DOCKER_OWNER_DB_VERIFY',
        'V18_DOCKER_MOBILE_SLOT_TAP',
        'V18_DOCKER_DESKTOP_DND_AND_PERMISSIONS',
        'V18_DOCKER_ACCEPTANCE_RESULTS',
        'V18_DOCKER_UAT=FAIL_INDEPENDENT_SCENARIOS',
    ];
    for (const token of required) {
        assert.ok(runner.includes(token), 'Missing QA result: ' + token);
    }
    assert.match(runner, /owner_status=\$\?/);
    assert.match(runner, /verify_status=\$\?/);
    assert.match(runner, /mobile_slot_status=\$\?/);
    assert.match(runner, /desktop_status=\$\?/);
});

test('Docker fetches pnpm packages before source files and installs offline', () => {
    const dockerfile = read('scripts/qa/v18-docker/Dockerfile');
    const lockCopy = dockerfile.indexOf(
        'COPY pnpm-lock.yaml pnpm-workspace.yaml /app/',
    );
    const fetch = dockerfile.indexOf('RUN pnpm fetch');
    const fullCopy = dockerfile.indexOf('COPY . /app');
    const install = dockerfile.indexOf('RUN pnpm install --offline --frozen-lockfile');
    assert.ok(
        lockCopy >= 0 && fetch > lockCopy &&
        fullCopy > fetch && install > fullCopy,
        'Lockfile pnpm cache must precede the source copy',
    );
    assert.match(dockerfile, /FROM node:22-bookworm/);
    assert.match(dockerfile, /playwright install --with-deps chromium/);
});

test('isolated V18 browser QA preserves the 5/min login throttle and all visual checks', () => {
    const owner = read('apps/panel/tests/visual/studio-v18-owner-real-stack.spec.ts');
    const desktop = read('apps/panel/tests/visual/studio-v18-calendar-drag-real-stack.spec.ts');
    const controller = read('backend/salonbw-backend/src/auth/auth.controller.ts');
    assert.match(controller, /@Throttle\(\{ default: \{ limit: 5, ttl: 60000 \} \}\)/);
    // Owner CRUD, client authorization probe, and mobile slot = three logins.
    const ownerLogins = (owner.match(/\bawait signIn\(/g) ?? []).length;
    // Desktop owner drag and client availability = two more. The visual
    // acceptance step REUSES the existing owner page/session, not a 6th login.
    const desktopLogins = (desktop.match(/await page\.goto\('\/auth\/login'\)/g) ?? []).length;
    assert.equal(ownerLogins, 3);
    assert.equal(desktopLogins, 2);
    assert.equal(ownerLogins + desktopLogins, 5);
    assert.equal((desktop.match(/^test\('/gm) ?? []).length, 2);
    assert.match(desktop, /await test\.step\('V18 desktop and 390px mobile branding'/);
    assert.match(desktop, /V18_BRAND_DRAWER_DESKTOP_MOBILE=PASS/);
    for (const artifact of [
        'v18-brand-desktop-calendar.png',
        'v18-brand-desktop-drawer.png',
        'v18-brand-mobile-calendar.png',
        'v18-brand-mobile-drawer.png',
    ]) {
        assert.ok(desktop.includes(artifact), 'Missing visual evidence: ' + artifact);
    }
});

test('Passenger Node tests run with node:test but are not collected by Jest', () => {
    const panelDir = resolve(root, 'apps/panel');
    const testPath = resolve(panelDir, 'scripts/staged-listen-host.test.cjs');
    const jestConfig = resolve(panelDir, 'jest.config.js');
    // Execute the actual exported Jest config, rather than pattern-matching
    // source strings. Fail if Jest would collect the standalone Node suite.
    const ignored = spawnSync(process.execPath, [
        '-e',
        [
            'const config = require(process.argv[1]);',
            'const testPath = process.argv[2];',
            'const root = process.argv[3];',
            "const ignored = config.testPathIgnorePatterns.some(p => new RegExp(p.replace('<rootDir>', root)).test(testPath));",
            'if (!ignored) process.exit(1);',
        ].join('\n'),
        jestConfig,
        testPath,
        panelDir,
    ], { encoding: 'utf8', timeout: 10000 });
    assert.equal(ignored.status, 0, 'Jest must ignore Node test runner suite: ' + ignored.stderr);
    const standalone = spawnSync(process.execPath, ['--test', testPath], {
        encoding: 'utf8',
        timeout: 10000,
    });
    assert.equal(standalone.status, 0, 'Standalone Node test failed: ' + standalone.stderr);
    assert.match(standalone.stdout, /# pass 6\b/);
});

test('shell runner and Mac wrapper pass Bash syntax and never delete other worktrees', () => {
    for (const path of [
        'scripts/qa/v18-docker/run.sh',
        'scripts/qa/v18-docker/run-from-mac.sh',
    ]) {
        const result = spawnSync('bash', ['-n', resolve(root, path)], {
            encoding: 'utf8',
        });
        assert.equal(result.status, 0, path + ': ' + result.stderr);
    }
    const wrapper = read('scripts/qa/v18-docker/run-from-mac.sh');
    assert.match(wrapper, /worktree add --detach/);
    assert.match(wrapper, /worktree remove/);
    assert.doesNotMatch(wrapper, /worktree remove --force/);
    assert.match(wrapper, /--exit-code-from qa/);
    assert.match(wrapper, /docker context inspect/);
    assert.match(wrapper, /docker_endpoint == unix:\/\//);
    // Host source-contract tests work with Node 20+; app build remains Node 22.
    assert.match(wrapper, /node_major >= 20/);
    assert.doesNotMatch(wrapper, /node_major == 22/);
    assert.match(read('scripts/qa/v18-docker/Dockerfile'), /FROM node:22-bookworm/);
    assert.match(wrapper, /qa-owner-browser-pg-safety\.test\.mjs/);
    assert.match(wrapper, /v18-docker-safety\.test\.mjs/);
    assert.doesNotMatch(wrapper, /bash "\$worktree\/scripts\/ci\/resolve-local-node\.sh"/);
    // Cheap Node tests must fail before the expensive image build begins.
    const preflight = wrapper.indexOf('V18_LOCAL_DOCKER_FAST_PREFLIGHT=START');
    const imageBuild = wrapper.indexOf(' --build --abort-on-container-exit');
    assert.ok(preflight > 0 && imageBuild > preflight);
});
