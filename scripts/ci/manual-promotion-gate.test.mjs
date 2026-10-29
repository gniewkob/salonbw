import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('immutable SHA CI gate still runs before any remote upload', () => {
    const gate = workflow.indexOf('name: Wait for successful CI');
    const upload = workflow.indexOf('name: Setup SSH');
    assert.ok(gate > 0, 'missing exact-SHA CI gate');
    if (upload >= 0) assert.ok(gate < upload, 'CI gate must precede SSH setup');
    assert.match(workflow, /wait-for-ci-success\.sh/);
});
