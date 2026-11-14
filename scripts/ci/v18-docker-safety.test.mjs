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
});
