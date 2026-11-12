import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// Invariant: a merge or branch push must never start a production deployment.
// This reads the real workflow installed at checkout, not a copied fixture.
const workflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const trigger = workflow.match(/^on:\n([\s\S]*?)^permissions:/m)?.[1] ?? '';

test('deploy workflow can only be started by explicit manual dispatch', () => {
    assert.match(trigger, /^  workflow_dispatch:/m);
    assert.doesNotMatch(trigger, /^  push:/m);
    assert.doesNotMatch(trigger, /^  schedule:/m);
    assert.doesNotMatch(trigger, /^  pull_request:/m);
});

test('operator selects an explicit staging or production target environment', () => {
    assert.match(trigger, /      environment:\n        description:[^\n]+\n        required: true\n        type: choice\n        options:\n          - staging\n          - production\n        default: staging/);
    assert.doesNotMatch(workflow, /inputs\.environment \|\| 'production'/);
});

test('deploy and probe jobs fail closed for non-dispatch events', () => {
    assert.match(workflow, /^    if: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.target != 'probe' \}\}/m);
    assert.match(workflow, /^    if: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.target == 'probe' \}\}/m);
});

test('deployment concurrency is keyed by environment, not source branch', () => {
    assert.match(workflow, /^  group: salonbw-deploy-\$\{\{ inputs\.environment \|\| 'invalid' \}\}/m);
    assert.match(workflow, /^    environment: \$\{\{ inputs\.environment \}\}/m);
    assert.match(workflow, /^      DEPLOY_ENV: \$\{\{ inputs\.environment \}\}/m);
});

test('historical deployments use security scripts pinned to the workflow SHA', () => {
    const load = workflow.indexOf('name: Load immutable workflow-owned deploy safeguards');
    const gate = workflow.indexOf('name: Wait for successful CI');
    const firstMutation = workflow.indexOf('name: Ensure remote directories exist (landing)');
    assert.ok(load > 0 && load < gate && gate < firstMutation);
    assert.match(workflow, /git show "\$GITHUB_SHA:\$script"/);
    for (const script of [
        'wait-for-ci-success.sh',
        'deployment-config.mjs',
        'write-api-env.mjs',
        'ensure-app-symlink.sh',
        'extract-frontend-bundle.sh',
    ]) {
        assert.match(workflow, new RegExp('approved/scripts/(?:ci|mydevil)/' + script.replaceAll('.', '\\.')));
    }
    assert.match(workflow, /git show "\$GITHUB_SHA:scripts\/ci\/check-mydevil-dev-quota\.cjs"/);
});

test('immutable SHA CI gate still runs before any remote upload', () => {
    const gate = workflow.indexOf('name: Wait for successful CI');
    const upload = workflow.indexOf('name: Setup SSH');
    assert.ok(gate > 0, 'missing exact-SHA CI gate');
    if (upload >= 0) assert.ok(gate < upload, 'CI gate must precede SSH setup');
    assert.match(workflow, /wait-for-ci-success\.sh/);
});

import { Script } from 'node:vm';

// Execute the actual pre-checkout github-script logic with isolated API mocks.
// These tests make the gate fail closed without touching environments or SSH.
const sourceStep = workflow.split('      - name: Resolve immutable source commit\n')[1]
    ?.split('\n      - name: Checkout\n')[0];
const inlineScript = sourceStep?.split('          script: |\n')[1]
    ?.split('\n')
    .map((line) => line.replace(/^ {12}/, ''))
    .join('\n');
assert.ok(inlineScript?.includes('compareCommits'), 'pre-checkout ancestry check required');
const sourceGate = new Script('(async () => {\n' + inlineScript + '\n})()');

const MASTER_SHA = 'a'.repeat(40);
const HISTORIC_SHA = 'b'.repeat(40);
const FOREIGN_SHA = 'c'.repeat(40);

function simulateSourceGate({
    environment = 'production',
    workflowRef = 'refs/heads/master',
    requestedRef = 'master',
    resolvedSha = MASTER_SHA,
    masterSha = MASTER_SHA,
    mergeBaseSha = HISTORIC_SHA,
    comparisonStatus = 'ahead',
    comparisonError = null,
    workflowSha = resolvedSha,
    historicalRecovery = false,
} = {}) {
    const calls = [];
    const outputs = [];
    const github = {
        rest: {
            repos: {
                async getCommit({ ref }) {
                    calls.push('commit:' + ref);
                    return { data: { sha: resolvedSha } };
                },
                async getBranch({ branch }) {
                    calls.push('branch:' + branch);
                    return { data: { commit: { sha: masterSha } } };
                },
                async compareCommits({ base, head }) {
                    calls.push('compare:' + base + ':' + head);
                    if (comparisonError) throw comparisonError;
                    return {
                        data: {
                            merge_base_commit: { sha: mergeBaseSha },
                            status: comparisonStatus,
                        },
                    };
                },
            },
        },
    };
    const promise = sourceGate.runInNewContext({
        context: { ref: workflowRef, sha: workflowSha, repo: { owner: 'gniewkob', repo: 'salonbw' } },
        process: { env: { DEPLOY_ENV: environment, REQUESTED_REF: requestedRef, DEV_HISTORICAL_RECOVERY: historicalRecovery ? 'true' : 'false' } },
        core: { setOutput: (key, value) => outputs.push([key, value]) },
        github,
    }, { timeout: 3000 });
    return { promise, calls, outputs };
}

test('production resolves master to an immutable commit without needing compare', async () => {
    const state = simulateSourceGate();
    await state.promise;
    assert.equal(state.outputs[0][1], MASTER_SHA);
    assert.deepEqual(state.calls, ['commit:master', 'branch:master']);
});

test('production allows an exact previous master ancestor for rollback', async () => {
    const state = simulateSourceGate({
        requestedRef: HISTORIC_SHA, resolvedSha: HISTORIC_SHA,
    });
    await state.promise;
    assert.equal(state.outputs[0][1], HISTORIC_SHA);
    assert.ok(state.calls.includes('compare:' + HISTORIC_SHA + ':' + MASTER_SHA));
});

test('production rejects unmerged branch commits even when specified as SHA', async () => {
    const state = simulateSourceGate({
        requestedRef: FOREIGN_SHA, resolvedSha: FOREIGN_SHA,
        mergeBaseSha: HISTORIC_SHA, comparisonStatus: 'diverged',
    });
    await assert.rejects(state.promise, /not an ancestor of master/);
    assert.equal(state.outputs.length, 0);
});

test('production rejects incorrect merge base even when compare claims ahead', async () => {
    const state = simulateSourceGate({
        requestedRef: FOREIGN_SHA, resolvedSha: FOREIGN_SHA,
        mergeBaseSha: HISTORIC_SHA, comparisonStatus: 'ahead',
    });
    await assert.rejects(state.promise, /not an ancestor of master/);
    assert.equal(state.outputs.length, 0);
});

test('production rejects a commit ahead of protected master', async () => {
    const state = simulateSourceGate({
        requestedRef: HISTORIC_SHA, resolvedSha: HISTORIC_SHA,
        comparisonStatus: 'behind', mergeBaseSha: HISTORIC_SHA,
    });
    await assert.rejects(state.promise, /not an ancestor of master/);
});

test('production rejects branch names and short SHAs before API access', async () => {
    for (const ref of ['feature/test', 'main', 'abc1234', 'v1.0.0', '']) {
        const state = simulateSourceGate({ requestedRef: ref });
        await assert.rejects(state.promise, /source ref is required|full commit SHA/);
        assert.deepEqual(state.calls, []);
    }
});

test('production rejects dispatch from any workflow branch other than master', async () => {
    const state = simulateSourceGate({ workflowRef: 'refs/heads/feature/test' });
    await assert.rejects(state.promise, /dispatched from master/);
    assert.deepEqual(state.calls, []);
});

test('invalid deployment environment fails closed before the API call', async () => {
    const state = simulateSourceGate({ environment: 'preview' });
    await assert.rejects(state.promise, /Unknown deployment environment/);
    assert.deepEqual(state.calls, []);
});

test('staging still allows explicitly selected feature branches', async () => {
    const state = simulateSourceGate({
        environment: 'staging', workflowRef: 'refs/heads/dev',
        requestedRef: 'codex/uat-branch', resolvedSha: FOREIGN_SHA,
    });
    await state.promise;
    assert.equal(state.outputs[0][1], FOREIGN_SHA);
    assert.deepEqual(state.calls, ['commit:codex/uat-branch']);
});

test('staging refuses mismatched workflow and release SHAs without recovery approval', async () => {
    const state = simulateSourceGate({
        environment: 'staging', workflowRef: 'refs/heads/master',
        requestedRef: HISTORIC_SHA, resolvedSha: HISTORIC_SHA,
        workflowSha: MASTER_SHA,
    });
    await assert.rejects(state.promise, /DEV workflow SHA must equal release SHA/);
    assert.equal(state.outputs.length, 0);
});

test('staging historical recovery accepts explicit approval and a verified master ancestor', async () => {
    const state = simulateSourceGate({
        environment: 'staging', requestedRef: HISTORIC_SHA,
        resolvedSha: HISTORIC_SHA, workflowSha: MASTER_SHA,
        historicalRecovery: true, mergeBaseSha: HISTORIC_SHA,
    });
    await state.promise;
    assert.deepEqual(state.calls, [
        'commit:' + HISTORIC_SHA,
        'branch:master',
        'compare:' + HISTORIC_SHA + ':' + MASTER_SHA,
    ]);
    assert.equal(state.outputs[0][1], HISTORIC_SHA);
});

test('staging historical recovery rejects feature workflow refs and wrong ancestry', async () => {
    let state = simulateSourceGate({
        environment: 'staging', workflowRef: 'refs/heads/feature/legacy',
        requestedRef: HISTORIC_SHA, resolvedSha: HISTORIC_SHA,
        workflowSha: MASTER_SHA, historicalRecovery: true,
    });
    await assert.rejects(state.promise, /requires master workflow/);
    state = simulateSourceGate({
        environment: 'staging', requestedRef: HISTORIC_SHA,
        resolvedSha: HISTORIC_SHA, workflowSha: MASTER_SHA,
        historicalRecovery: true, mergeBaseSha: FOREIGN_SHA,
    });
    await assert.rejects(state.promise, /not an ancestor/);
});

test('staging historical recovery fails closed if master moves or the API errors', async () => {
    let state = simulateSourceGate({
        environment: 'staging', requestedRef: HISTORIC_SHA,
        resolvedSha: HISTORIC_SHA, workflowSha: MASTER_SHA,
        masterSha: FOREIGN_SHA, historicalRecovery: true,
    });
    await assert.rejects(state.promise, /Master advanced/);
    state = simulateSourceGate({
        environment: 'staging', requestedRef: HISTORIC_SHA,
        resolvedSha: HISTORIC_SHA, workflowSha: MASTER_SHA,
        historicalRecovery: true, comparisonError: new Error('GitHub compare unavailable'),
    });
    await assert.rejects(state.promise, /GitHub compare unavailable/);
});

test('staging historical recovery does not allow redundant flag on identical SHA', async () => {
    const state = simulateSourceGate({
        environment: 'staging', requestedRef: MASTER_SHA,
        resolvedSha: MASTER_SHA, workflowSha: MASTER_SHA,
        historicalRecovery: true,
    });
    await assert.rejects(state.promise, /requires an older release SHA/);
});

test('production refuses historical DEV recovery flag', async () => {
    const state = simulateSourceGate({ historicalRecovery: true });
    await assert.rejects(state.promise, /forbidden in production/);
});

test('production GitHub comparison failures fail closed', async () => {
    const state = simulateSourceGate({
        requestedRef: HISTORIC_SHA, resolvedSha: HISTORIC_SHA,
        comparisonError: new Error('GitHub API unavailable'),
    });
    await assert.rejects(state.promise, /GitHub API unavailable/);
    assert.equal(state.outputs.length, 0);
});

/**
 * Execute the exact inline Node program from the production deploy workflow.
 * A historical approved rollback with Jimp must not require Sharp, but a
 * manifest declaring Sharp must fail closed if its native runtime is absent.
 * These tests never reach a real server or database.
 */
function executeSharpRuntimeGate(dependencies, optionalDependencies = {}) {
    const section = workflow.split('      - name: Verify Sharp image runtime before backend restart (api)')[1]
        ?.split('      - name: Verify native password hashing module (api)')[0];
    assert.ok(section, 'Sharp runtime gate must precede bcrypt gate');
    const step = section.match(/node22 <<'NODE'\n([\s\S]*?)\n          NODE/);
    assert.ok(step?.[1], 'Expected an executable Sharp runtime guard in deploy.yml');
    const root = mkdtempSync(join(tmpdir(), 'salonbw-sharp-gate-'));
    try {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ dependencies, optionalDependencies }),
            { mode: 0o600 },
        );
        return spawnSync(process.execPath, ['-e', step[1]], {
            cwd: root,
            encoding: 'utf8',
            timeout: 5000,
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('historical Jimp-only release skips Sharp native probe without blocking rollback', () => {
    const result = executeSharpRuntimeGate({ jimp: '^1.6.1' });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SHARP_DEPLOY_RUNTIME=SKIPPED_LEGACY_JIMP/);
    assert.doesNotMatch(result.stdout + result.stderr, /SHARP_DEPLOY_RUNTIME=PASS/);
});

test('Sharp-declared release must fail closed on an incompatible or missing native runtime', () => {
    const result = executeSharpRuntimeGate({ sharp: '0.35.5' });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHARP_DEPLOY_RUNTIME=FAIL/);
    assert.doesNotMatch(result.stdout, /SKIPPED_LEGACY_JIMP/);
});

test('Sharp remains mandatory even if legacy Jimp is also listed', () => {
    const result = executeSharpRuntimeGate({ jimp: '^1.6.1', sharp: '0.35.5' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHARP_DEPLOY_RUNTIME=FAIL/);
});

test('missing both supported image processors fails closed', () => {
    const result = executeSharpRuntimeGate({});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SHARP_DEPLOY_RUNTIME=FAIL/);
    assert.doesNotMatch(result.stdout, /SKIPPED_LEGACY_JIMP/);
});
