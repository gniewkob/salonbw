import test from 'node:test';
import assert from 'node:assert/strict';
import { planStagingRetention } from './staging-retention-policy.mjs';

const NOW = '2026-11-09T17:00:00.000Z';
const DAY = 86400000;

function fixture(count = 8, overrides = {}) {
  const snapshots = Array.from({ length: count }, (_, i) => ({
    id: `${42000000000 + i}-1`,
    valid: true,
    estimatedAllocatedBytes: 400_000_000,
  }));
  const evidence = Object.fromEntries(snapshots.map((snap, i) => [
    snap.id,
    {
      observedAt: new Date(Date.parse(NOW) - i * DAY).toISOString(),
      referencesReviewed: true,
      runConclusion: 'success',
      offHostRestorePassed: true,
      snapshotRestorePassed: true,
      recoveryShaVerified: true,
    },
  ]));
  const report = {
    schema: 1,
    app: 'panelbw_dev',
    mode: 'DEEP_READ_ONLY',
    total: snapshots.length,
    valid: snapshots.length,
    pendingCount: 0,
    unexpectedEntryCount: 0,
    findings: [],
    snapshots,
    ...overrides,
  };
  return { report, evidence, now: NOW };
}

test('proposes only older verified snapshots beyond five protected newest', () => {
  const { report, evidence, now } = fixture();
  const result = planStagingRetention({ report, evidence, now });
  assert.deepEqual(result.candidateIds, [report.snapshots[5].id, report.snapshots[6].id, report.snapshots[7].id]);
  assert.equal(result.candidateCount, 3);
  assert.equal(result.nominalPotentialSavingsBytes, 1_200_000_000);
  assert.equal(result.eligibleForDeletion, 0);
  assert.equal(result.deletionCapability, false);
  assert.equal(result.autoPruneEnabled, false);
});

test('retention counts and spending budget never override protected pins', () => {
  const x = fixture();
  const oldest = x.report.snapshots[7].id;
  x.evidence[oldest].uatPin = true;
  const result = planStagingRetention({ ...x, budgetBytes: 1 });
  assert.equal(result.entries.find(s => s.id === oldest).decision, 'KEEP_PINNED');
  assert.equal(result.budgetTargetWouldStillBeExceeded, true);
  assert.equal(result.eligibleForDeletion, 0);
});

test('keeps a failed-run rollback point regardless of age', () => {
  const x = fixture();
  x.evidence[x.report.snapshots[6].id].runConclusion = 'failure';
  assert.equal(planStagingRetention(x).entries.find(e => e.id === x.report.snapshots[6].id).decision, 'KEEP_PINNED');
});

test('keeps old snapshots without explicitly reviewed references', () => {
  const x = fixture();
  delete x.evidence[x.report.snapshots[6].id].referencesReviewed;
  assert.equal(planStagingRetention(x).entries.find(e => e.id === x.report.snapshots[6].id).decision, 'KEEP_RECOVERY_EVIDENCE_MISSING');
});

test('keeps old snapshots without verified off-host restore', () => {
  const x = fixture();
  x.evidence[x.report.snapshots[6].id].offHostRestorePassed = false;
  assert.equal(planStagingRetention(x).entries.find(e => e.id === x.report.snapshots[6].id).decision, 'KEEP_RECOVERY_EVIDENCE_MISSING');
});

test('keeps old snapshots without verified isolated snapshot restore', () => {
  const x = fixture();
  x.evidence[x.report.snapshots[6].id].snapshotRestorePassed = false;
  assert.equal(planStagingRetention(x).entries.find(e => e.id === x.report.snapshots[6].id).decision, 'KEEP_RECOVERY_EVIDENCE_MISSING');
});

test('keeps explicitly active predeploy point even when all other evidence passes', () => {
  const x = fixture();
  x.evidence[x.report.snapshots[6].id].isCurrentPredeploy = true;
  assert.equal(planStagingRetention(x).entries.find(e => e.id === x.report.snapshots[6].id).decision, 'KEEP_RECOVERY_EVIDENCE_MISSING');
});

test('fails closed when manifest scanner was not deep or found anomalies', () => {
  const x = fixture();
  assert.equal(planStagingRetention({ ...x, report: { ...x.report, mode: 'MANIFEST_READ_ONLY' } }).candidateCount, 0);
  assert.equal(planStagingRetention({ ...x, report: { ...x.report, findings: ['PENDING_DEPLOYMENT_ENTRIES'] } }).candidateCount, 0);
  assert.equal(planStagingRetention({ ...x, report: { ...x.report, pendingCount: 1 } }).candidateCount, 0);
});

test('keeps unknown times rather than inferring age from token', () => {
  const x = fixture();
  delete x.evidence[x.report.snapshots[7].id].observedAt;
  const result = planStagingRetention(x);
  assert.equal(result.candidateIds.includes(x.report.snapshots[7].id), false);
});

test('respects minimum age even with verified evidence', () => {
  const x = fixture();
  const result = planStagingRetention({ ...x, minAgeHours: 24 * 10 });
  assert.equal(result.candidateCount, 0);
});

test('rejects untrusted token and duplicate snapshot evidence', () => {
  const x = fixture();
  x.report.snapshots[6].id = '../etc';
  assert.throws(() => planStagingRetention(x), { code: 'INVALID_SNAPSHOT_ID' });
  const y = fixture();
  y.report.snapshots[6].id = y.report.snapshots[5].id;
  assert.throws(() => planStagingRetention(y), { code: 'INVALID_SNAPSHOT_ID' });
});

test('rejects evidence entries not tied to audited immutable IDs', () => {
  const x = fixture();
  x.evidence['999-1'] = { referencesReviewed: true };
  assert.throws(() => planStagingRetention(x), { code: 'UNMATCHED_EVIDENCE_TOKEN' });
});

test('rejects unsafe policy and unknown app', () => {
  const x = fixture();
  assert.throws(() => planStagingRetention({ ...x, keepLatest: 1 }), { code: 'INVALID_RETENTION_POLICY' });
  assert.throws(() => planStagingRetention({ ...x, report: { ...x.report, app: 'production' } }), { code: 'INVALID_AUDIT_REPORT' });
});

test('does not overstate approved deletion even when all old backups pass', () => {
  const x = fixture(40);
  const result = planStagingRetention(x);
  assert.equal(result.eligibleForDeletion, 0);
  assert.equal(result.autoPruneEnabled, false);
  assert.ok(result.candidateCount > 0);
});
