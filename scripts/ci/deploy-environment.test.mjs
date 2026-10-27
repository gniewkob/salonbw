import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('preview is read-only and invalid environments fail closed', () => {
    const result = spawnSync('bash',
        ['scripts/deploy-environment.sh', 'development', 'all', 'HEAD'],
        { encoding: 'utf8', env: { ...process.env, GITHUB_OUTPUT: '/dev/null' } });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /Preview only/);
    assert.match(result.stdout, /dev-api\.salon-bw\.pl/);
    assert.equal(spawnSync('bash',
        ['scripts/deploy-environment.sh', 'unknown', 'all', 'HEAD']).status, 2);
});

function simulateDeployment({ environment = 'development', target = 'all', failTarget = '', workflowSha = '' }) {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'salonbw-selective-deploy-'));
    try {
        const log = path.join(directory, 'calls');
        const current = path.join(directory, 'current-target');
        const executable = path.join(directory, 'gh');
        // The fake GitHub client never has credentials or network access.
        writeFileSync(executable, [
            '#!/usr/bin/env bash',
            'printf "%s\\n" "$*" >> "$DISPATCH_LOG"',
            'case "$1 $2" in',
            '  "api "*) printf "%s\\n" "${WORKFLOW_SHA:-$EXPECTED_SHA}";;',
            '  "workflow run")',
            '    for arg in "$@"; do case "$arg" in target=*) printf "%s\\n" "$arg" | cut -d= -f2 > "$CURRENT_TARGET";; esac; done',
            '    exit 0;;',
            '  "run list")',
            '    printf \'[{"databaseId":123,"createdAt":"9999-01-01T00:00:00Z","headSha":"%s","displayTitle":"Deploy %s %s %s"}]\\n\' "$EXPECTED_SHA" "$STAGE" "$(cat "$CURRENT_TARGET")" "$EXPECTED_SHA";;',
            '  "run watch")',
            '    [ "$(cat "$CURRENT_TARGET")" != "$FAIL_TARGET" ];;',
            '  *) exit 2;;',
            'esac',
            '',
        ].join('\n'), { mode: 0o700 });
        const sha = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
        const result = spawnSync('bash',
            ['scripts/deploy-environment.sh', environment, target, 'HEAD', '--execute'],
            {
                encoding: 'utf8',
                env: {
                    ...process.env,
                    PATH: directory + ':' + process.env.PATH,
                    DISPATCH_LOG: log,
                    CURRENT_TARGET: current,
                    EXPECTED_SHA: sha,
                    STAGE: environment === 'development' ? 'staging' : 'production',
                    FAIL_TARGET: failTarget,
                    WORKFLOW_SHA: workflowSha,
                    DEPLOY_WORKFLOW_REF: 'codex/dev-selective-recovery-20261027',
                },
            });
        const calls = readFileSync(log, 'utf8');
        const targets = calls.split('\n').filter(v => v.startsWith('workflow run '))
            .map(v => v.match(/target=([a-z]+)/)?.[1]);
        return { result, targets, calls };
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}

test('staging all sequences API, panel and landing as isolated deploy runs', () => {
    const { result, targets } = simulateDeployment({});
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(targets, ['api', 'panel', 'landing']);
    assert.match(result.stdout, /api: PASS/);
    assert.match(result.stdout, /panel: PASS/);
    assert.match(result.stdout, /landing: PASS/);
});

test('failed API blocks dependent frontends before dispatch', () => {
    const { result, targets } = simulateDeployment({ failTarget: 'api' });
    assert.equal(result.status, 1);
    assert.deepEqual(targets, ['api']);
    assert.match(result.stdout, /api: BLOCKED/);
    assert.match(result.stdout, /panel: NOT_RUN/);
    assert.match(result.stdout, /landing: NOT_RUN/);
});

test('failed panel leaves already successful API untouched and does not dispatch landing', () => {
    const { result, targets } = simulateDeployment({ failTarget: 'panel' });
    assert.equal(result.status, 1);
    assert.deepEqual(targets, ['api', 'panel']);
    assert.match(result.stdout, /api: PASS/);
    assert.match(result.stdout, /panel: BLOCKED/);
    assert.match(result.stdout, /landing: NOT_RUN/);
});

test('failed landing does not roll back successful API and panel', () => {
    const { result, targets } = simulateDeployment({ failTarget: 'landing' });
    assert.equal(result.status, 1);
    assert.deepEqual(targets, ['api', 'panel', 'landing']);
    assert.match(result.stdout, /api: PASS/);
    assert.match(result.stdout, /panel: PASS/);
    assert.match(result.stdout, /landing: BLOCKED/);
});

test('frontends targeting keeps the API unchanged and separates panel from landing', () => {
    const { result, targets, calls } = simulateDeployment({ target: 'frontends', failTarget: 'landing' });
    assert.equal(result.status, 1);
    assert.deepEqual(targets, ['panel', 'landing']);
    assert.doesNotMatch(calls, /target=api/);
    assert.match(result.stdout, /panel: PASS/);
    assert.match(result.stdout, /landing: BLOCKED/);
});

test('production all retains the previous API + combined frontends dispatch', () => {
    const { result, targets } = simulateDeployment({ environment: 'production' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(targets, ['api', 'frontends']);
});

test('development execution refuses implicit master workflow ref', () => {
    const result = spawnSync('bash',
        ['scripts/deploy-environment.sh', 'development', 'all', 'HEAD', '--execute'],
        {
            encoding: 'utf8',
            env: { ...process.env, DEPLOY_WORKFLOW_REF: '' },
        });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /DEPLOY_WORKFLOW_REF/);
});

test('staging refuses a workflow ref whose commit differs from the requested release', () => {
    const { result, targets, calls } = simulateDeployment({
        environment: 'development',
        workflowSha: '0123456789abcdef0123456789abcdef01234567',
    });
    assert.equal(result.status, 2);
    assert.deepEqual(targets, []);
    assert.match(result.stderr, /EXACT release commit SHA/);
    assert.match(calls, /api repos\/gniewkob\/salonbw\/commits\//);
    assert.doesNotMatch(calls, /workflow run/);
});

test('staging fails closed on invalid workflow revision evidence', () => {
    const { result, targets } = simulateDeployment({
        environment: 'development', target: 'panel', workflowSha: 'not-a-sha',
    });
    assert.equal(result.status, 2);
    assert.deepEqual(targets, []);
});

test('production deployment does not require development-only workflow checks', () => {
    const { result, targets, calls } = simulateDeployment({
        environment: 'production',
        workflowSha: 'not-a-sha',
    });
    assert.equal(result.status, 0);
    assert.deepEqual(targets, ['api', 'frontends']);
    assert.doesNotMatch(calls, /api repos\/gniewkob\/salonbw\/commits\//);
});
