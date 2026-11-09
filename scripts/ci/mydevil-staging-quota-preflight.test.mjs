import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateQuota } from './mydevil-staging-quota-preflight.mjs';

const LOW = `Wykorzystanie zasobów

     Powierzchnia: [=====================================] 94.61% (47.3G/50.0G)
          Procesy: [====================] 22.86% (16/70)
       Pamięć RAM: [===========] 31.09% (955.0M/3.0G)
`;
const HIGH = 'Powierzchnia: [========] 65.00% (32.5G/50.0G)\n';

test('blocks owner-observed 94.61% MyDevil account quota', () => {
  const r = evaluateQuota(LOW);
  assert.equal(r.accountUsagePercent, 94.61);
  assert.ok(r.conservativeFreeGiB < 5);
  assert.equal(r.allowed, false);
});

test('accepts ample free account quota with safety reserve', () => {
  const r = evaluateQuota(HIGH);
  assert.equal(r.allowed, true);
  assert.ok(r.conservativeFreeGiB > 10);
});

test('allows ANSI-coloured output but not ambiguous space entries', () => {
  assert.equal(evaluateQuota(`\x1b[32m${HIGH}\x1b[0m`).allowed, true);
  assert.throws(() => evaluateQuota(HIGH + HIGH), /QUOTA_LINE_MISSING_OR_AMBIGUOUS/);
});

test('rejects raw df output without account quota', () => {
  assert.throws(() => evaluateQuota('zroot/root/usr/home 123 50 73 76%'), /QUOTA_LINE_MISSING_OR_AMBIGUOUS/);
});

test('rejects missing numerical details or unexpected unit', () => {
  assert.throws(() => evaluateQuota('Powierzchnia: 94.61%'), /QUOTA_FORMAT_UNRECOGNIZED/);
  assert.throws(() => evaluateQuota('Powierzchnia: [] 90% (47.3Q/50.0G)'), /QUOTA_FORMAT_UNRECOGNIZED/);
});

test('rejects percentage inconsistent with displayed usage', () => {
  assert.throws(() => evaluateQuota('Powierzchnia: [] 20.00% (47.3G/50.0G)'), /QUOTA_VALUES_INCONSISTENT/);
});

test('rejects full, over-capacity, negative and zero-capacity samples', () => {
  assert.equal(evaluateQuota('Powierzchnia: [] 100% (50.0G/50.0G)').allowed, false);
  assert.throws(() => evaluateQuota('Powierzchnia: [] 100% (51.0G/50.0G)'), /QUOTA_VALUES_INVALID/);
  assert.throws(() => evaluateQuota('Powierzchnia: [] 0% (0G/0G)'), /QUOTA_VALUES_INVALID/);
  assert.throws(() => evaluateQuota('Powierzchnia: [] 20% (-1G/50G)'), /QUOTA_FORMAT_UNRECOGNIZED/);
});

test('refuses weakened thresholds, invalid output and oversized input', () => {
  assert.throws(() => evaluateQuota(HIGH, { minimumFreeGiB: 1 }), /QUOTA_THRESHOLD_INVALID/);
  assert.throws(() => evaluateQuota(''), /QUOTA_OUTPUT_INVALID/);
  assert.throws(() => evaluateQuota('x'.repeat(100000)), /QUOTA_OUTPUT_INVALID/);
});

test('CLI rejects quota under threshold without leaking raw capacity output', () => {
  const cmd = fileURLToPath(new URL('./mydevil-staging-quota-preflight.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [cmd], { input: LOW, encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /ACCOUNT_QUOTA_INSUFFICIENT/);
  assert.doesNotMatch(r.stdout + r.stderr, /Procesy|Pamięć RAM|47\.3G\/50\.0G/);
});

test('CLI exits zero for a healthy quota', () => {
  const cmd = fileURLToPath(new URL('./mydevil-staging-quota-preflight.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [cmd], { input: HIGH, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /STAGING_QUOTA_PREFLIGHT=PASS/);
});
