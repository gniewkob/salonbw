/**
 * DEV snapshot retention planner (pure, no filesystem or delete capability).
 * Human-reviewed recovery evidence is required per snapshot. This never grants
 * deletion permission; it only proposes exact, reviewable token candidates.
 */
const TOKEN = /^[0-9]+-[1-9][0-9]*$/;
const HOUR_MS = 60 * 60 * 1000;

function invalid(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

export function planStagingRetention({
  report,
  evidence = {},
  now,
  keepLatest = 5,
  minAgeHours = 72,
  budgetBytes = 8 * 1024 ** 3,
} = {}) {
  if (!report || report.schema !== 1 ||
      !['panelbw_dev', 'api_salonbw_dev', 'salonbw'].includes(report.app) ||
      !Array.isArray(report.snapshots) ||
      !Number.isSafeInteger(report.total) || report.total !== report.snapshots.length) {
    throw invalid('INVALID_AUDIT_REPORT');
  }
  if (!Number.isInteger(keepLatest) || keepLatest < 2 || keepLatest > 100 ||
      !Number.isInteger(minAgeHours) || minAgeHours < 24 || minAgeHours > 8760 ||
      !Number.isSafeInteger(budgetBytes) || budgetBytes < 1) {
    throw invalid('INVALID_RETENTION_POLICY');
  }
  const nowMs = Date.parse(now);
  if (!now || !Number.isFinite(nowMs)) throw invalid('INVALID_TIME');
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    throw invalid('INVALID_EVIDENCE');
  }
  const scannedIds = new Set();
  const snapshots = report.snapshots.map(snapshot => {
    if (!snapshot || typeof snapshot !== 'object' ||
        typeof snapshot.id !== 'string' || !TOKEN.test(snapshot.id) ||
        scannedIds.has(snapshot.id)) throw invalid('INVALID_SNAPSHOT_ID');
    scannedIds.add(snapshot.id);
    const info = evidence[snapshot.id];
    const observedAt = info?.observedAt;
    const observedMs = typeof observedAt === 'string' ? Date.parse(observedAt) : NaN;
    const bytes = snapshot.estimatedAllocatedBytes;
    if (!Number.isSafeInteger(bytes) || bytes < 0) throw invalid('INVALID_ALLOCATION');
    return { id: snapshot.id, scanValid: snapshot.valid === true,
      observedMs, allocatedBytes: bytes, info };
  });
  if (Object.keys(evidence).some(id => !scannedIds.has(id))) {
    throw invalid('UNMATCHED_EVIDENCE_TOKEN');
  }

  // Newest N are retained independent of approval, age or backup state.
  // Unknown timestamps sort first so they cannot be accidentally aged out.
  snapshots.sort((a, b) => {
    if (!Number.isFinite(a.observedMs)) return Number.isFinite(b.observedMs) ? -1 : a.id.localeCompare(b.id);
    if (!Number.isFinite(b.observedMs)) return 1;
    return b.observedMs - a.observedMs || b.id.localeCompare(a.id);
  });

  const scanTrusted = report.mode === 'DEEP_READ_ONLY' &&
    report.valid === report.total &&
    Array.isArray(report.findings) && report.findings.length === 0 &&
    report.pendingCount === 0 && report.unexpectedEntryCount === 0;

  const entries = snapshots.map((item, index) => {
    const info = item.info || {};
    let decision;
    if (index < keepLatest) decision = 'KEEP_RECENT';
    else if (info.explicitPin === true || info.uatPin === true ||
             info.incidentPin === true || info.runConclusion === 'failure') {
      decision = 'KEEP_PINNED';
    } else if (!scanTrusted || !item.scanValid ||
               !Number.isFinite(item.observedMs) || item.observedMs > nowMs ||
               nowMs - item.observedMs < minAgeHours * HOUR_MS) {
      decision = 'KEEP_UNVERIFIED_OR_YOUNG';
    } else if (info.referencesReviewed !== true ||
               info.runConclusion !== 'success' ||
               info.isCurrentPredeploy === true ||
               info.offHostRestorePassed !== true ||
               info.snapshotRestorePassed !== true ||
               info.recoveryShaVerified !== true) {
      decision = 'KEEP_RECOVERY_EVIDENCE_MISSING';
    } else {
      decision = 'REVIEW_CANDIDATE_NOT_AUTHORIZED';
    }
    return { id: item.id, decision, allocatedBytes: item.allocatedBytes };
  });

  const totalBytes = entries.reduce((sum, item) => sum + item.allocatedBytes, 0);
  const candidates = entries.filter(x => x.decision === 'REVIEW_CANDIDATE_NOT_AUTHORIZED');
  const proposedSavingsBytes = candidates.reduce((sum, x) => sum + x.allocatedBytes, 0);
  return {
    schema: 1, app: report.app, mode: 'RETENTION_PLAN_READ_ONLY',
    parameters: { keepLatest, minAgeHours, budgetBytes },
    currentEstimatedBytes: totalBytes,
    candidateCount: candidates.length,
    candidateIds: candidates.map(x => x.id),
    nominalPotentialSavingsBytes: proposedSavingsBytes,
    remainingEstimatedBytesIfAllCandidatesLaterApproved: totalBytes - proposedSavingsBytes,
    budgetTargetWouldStillBeExceeded: totalBytes - proposedSavingsBytes > budgetBytes,
    // Always zero until a separate, guarded, owner-approved executor exists.
    eligibleForDeletion: 0, deletionCapability: false, autoPruneEnabled: false,
    evidenceCompleteForAutomaticDeletion: false, entries,
  };
}
