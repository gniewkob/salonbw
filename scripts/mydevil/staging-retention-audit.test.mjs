import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { audit } from './staging-retention-audit.mjs';

const ID = '42619480638-1';

async function fixture(t) {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'salonbw-retention-fixture-'));
  t.after(async () => { await fs.rm(home, { force: true, recursive: true }); });
  const base = path.join(home, '.deployment-private', 'staging-rollback', 'panelbw_dev');
  const snapshot = path.join(base, ID);
  const files = path.join(snapshot, 'files');
  await fs.mkdir(files, { recursive: true });
  await fs.writeFile(path.join(snapshot, 'READY'), '');
  await fs.writeFile(path.join(snapshot, 'kind'), 'frontend\n');
  await fs.writeFile(path.join(snapshot, 'destination'), path.join(home, 'apps', 'nodejs', 'panelbw_dev') + '\n');
  await fs.writeFile(path.join(snapshot, 'present'), '.next\npackage.json\n');
  await fs.mkdir(path.join(files, '.next'));
  await fs.writeFile(path.join(files, '.next', 'BUILD_ID'), 'synthetic');
  await fs.writeFile(path.join(files, 'package.json'), '{}');
  return { home, base, snapshot, files };
}

const run = (home, opts = {}) => audit({ home, ...opts });

test('complete manifest, no candidate by default, no deletion capability', async t => {
  const x = await fixture(t);
  const result = await run(x.home, { deep: true });
  assert.equal(result.total, 1);
  assert.equal(result.valid, 1);
  assert.equal(result.eligibleForDeletion, 0);
  assert.equal(result.deletionCapability, false);
  assert.equal(result.snapshots[0].decision, 'UNCLASSIFIED_KEEP');
  assert.equal(result.snapshots[0].manifestEntries, 2);
});

test('explicit candidate remains blocked before restore and owner approval', async t => {
  const { home } = await fixture(t);
  const report = await run(home, { candidateIds: [ID], deep: true });
  assert.equal(report.candidateCount, 1);
  assert.equal(report.eligibleForDeletion, 0);
  assert.equal(report.snapshots[0].decision, 'BLOCKED_PENDING_RESTORE_AND_APPROVAL');
});

test('protected id beats candidate id', async t => {
  const { home } = await fixture(t);
  const report = await run(home, { protectedIds: [ID], candidateIds: [ID] });
  assert.equal(report.snapshots[0].decision, 'PROTECT');
  assert.equal(report.nominalCandidateBytes, null);
});

test('duplicate entries fail validation', async t => {
  const x = await fixture(t);
  await fs.appendFile(path.join(x.snapshot, 'present'), '.next\n');
  const r = await run(x.home);
  assert.deepEqual(r.snapshots[0].findings, ['DUPLICATE_MANIFEST_ENTRY']);
});

test('unknown manifest entry cannot escape whitelist', async t => {
  const x = await fixture(t);
  await fs.appendFile(path.join(x.snapshot, 'present'), '../../somewhere\n');
  const r = await run(x.home);
  assert.ok(r.snapshots[0].findings.includes('UNEXPECTED_MANIFEST_ENTRY'));
});

test('missing declared payload is detected', async t => {
  const x = await fixture(t);
  await fs.unlink(path.join(x.files, 'package.json'));
  const r = await run(x.home);
  assert.ok(r.snapshots[0].findings.includes('MISSING_DECLARED_ELEMENT'));
});

test('undeclared payload is detected even when name is allowed', async t => {
  const x = await fixture(t);
  await fs.writeFile(path.join(x.files, 'app.js'), 'test');
  const r = await run(x.home);
  assert.ok(r.snapshots[0].findings.includes('UNDECLARED_ELEMENT'));
});

test('symlink escaping files root is rejected in deep mode', async t => {
  const x = await fixture(t);
  await fs.symlink(os.tmpdir(), path.join(x.files, '.next', 'outside'));
  const r = await run(x.home, { deep: true });
  assert.ok(r.snapshots[0].findings.includes('UNSAFE_SYMLINK'));
});

test('relative symlink contained within files is reported but not traversed', async t => {
  const x = await fixture(t);
  await fs.symlink('BUILD_ID', path.join(x.files, '.next', 'alias'));
  const r = await run(x.home, { deep: true });
  assert.equal(r.valid, 1);
  assert.equal(r.snapshots[0].symlinkCount, 1);
});

test('dangling symlink is detected', async t => {
  const x = await fixture(t);
  await fs.symlink('not-present', path.join(x.files, '.next', 'alias'));
  const r = await run(x.home, { deep: true });
  assert.ok(r.snapshots[0].findings.includes('DANGLING_SYMLINK'));
});

test('pending directory blocks approval even if snapshots are valid', async t => {
  const x = await fixture(t);
  await fs.mkdir(path.join(x.base, '.pending-run-123'));
  const r = await run(x.home);
  assert.equal(r.pendingCount, 1);
  assert.ok(r.findings.includes('PENDING_DEPLOYMENT_ENTRIES'));
  assert.equal(r.eligibleForDeletion, 0);
});

test('symlink application recovery directory fails closed', async t => {
  const x = await fixture(t);
  const other = path.join(x.home, 'other');
  await fs.rename(x.base, other);
  await fs.symlink(other, x.base);
  await assert.rejects(run(x.home), { code: 'UNSAFE_DIRECTORY_CHAIN' });
});

test('unknown or production app fails closed', async t => {
  const { home } = await fixture(t);
  await assert.rejects(run(home, { app: 'panelbw' }), { code: 'UNKNOWN_DEV_APPLICATION' });
  await assert.rejects(run(home, { app: 'salonbw_prod' }), { code: 'UNKNOWN_DEV_APPLICATION' });
});

test('unknown candidate, invalid token and duplicate explicit ids fail closed', async t => {
  const { home } = await fixture(t);
  await assert.rejects(run(home, { candidateIds: ['1-1'] }), { code: 'UNKNOWN_INPUT_TOKEN' });
  await assert.rejects(run(home, { candidateIds: ['../../etc'] }), { code: 'INVALID_TOKEN' });
  await assert.rejects(run(home, { protectedIds: [ID, ID] }), { code: 'DUPLICATE_INPUT_TOKEN' });
});

test('missing ready and wrong runtime identity rejected', async t => {
  const x = await fixture(t);
  await fs.unlink(path.join(x.snapshot, 'READY'));
  assert.ok((await run(x.home)).snapshots[0].findings.includes('READY_INVALID'));
  await fs.writeFile(path.join(x.snapshot, 'READY'), '');
  await fs.writeFile(path.join(x.snapshot, 'kind'), 'api\n');
  assert.ok((await run(x.home)).snapshots[0].findings.includes('IDENTITY_MISMATCH'));
});

test('unexpected directories cannot be silently approved', async t => {
  const x = await fixture(t);
  await fs.mkdir(path.join(x.base, 'weird%name'));
  const r = await run(x.home);
  assert.equal(r.unexpectedEntryCount, 1);
  assert.ok(r.findings.includes('UNEXPECTED_RECOVERY_ENTRIES'));
});

test('scan budget fails closed on oversized tree', async t => {
  const x = await fixture(t);
  const r = await run(x.home, { deep: true, maxItems: 1 });
  assert.ok(r.snapshots[0].findings.includes('METADATA_SCAN_LIMIT'));
});

test('audit never alters any synthetic snapshot content', async t => {
  const x = await fixture(t);
  const namesBefore = (await fs.readdir(x.snapshot)).sort();
  const contentBefore = await fs.readFile(path.join(x.snapshot, 'present'), 'utf8');
  await run(x.home, { deep: true, candidateIds: [ID] });
  assert.deepEqual((await fs.readdir(x.snapshot)).sort(), namesBefore);
  assert.equal(await fs.readFile(path.join(x.snapshot, 'present'), 'utf8'), contentBefore);
});


test('CLI via SSH-style Node stdin returns only sanitized metadata', async t => {
  const x = await fixture(t);
  const source = await fs.readFile(new URL('./staging-retention-audit.mjs', import.meta.url), 'utf8');
  const processResult = spawnSync(process.execPath, ['--input-type=module', '-', '--', '--home', x.home, '--app', 'panelbw_dev', '--protect', ID],
    { input: source, encoding: 'utf8' });
  assert.equal(processResult.status, 0, processResult.stderr);
  const report = JSON.parse(processResult.stdout);
  assert.equal(report.total, 1);
  assert.equal(report.snapshots[0].decision, 'PROTECT');
  assert.ok(!processResult.stdout.includes(x.home));
  assert.ok(!processResult.stdout.includes('BUILD_ID'));
  assert.ok(!processResult.stdout.includes('package.json'));
});

test('CLI rejects unexpected argument and emits no host path or manifest', async t => {
  const x = await fixture(t);
  const source = await fs.readFile(new URL('./staging-retention-audit.mjs', import.meta.url), 'utf8');
  const processResult = spawnSync(process.execPath, ['--input-type=module', '-', '--', '--home', x.home, '--app', 'panelbw', '--deep'],
    { input: source, encoding: 'utf8' });
  assert.equal(processResult.status, 2);
  assert.match(processResult.stderr, /RETENTION_AUDIT_BLOCKED: UNKNOWN_DEV_APPLICATION/);
  assert.ok(!processResult.stderr.includes(x.home));
  assert.equal(processResult.stdout, '');
});
