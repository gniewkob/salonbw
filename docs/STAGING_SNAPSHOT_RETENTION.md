# DEV staging snapshot retention — proposal (issue #1673)

**State 2026-11-09:** READ-ONLY INVENTORY / NO DELETE AUTHORIZED.
This proposal does not change `staging-release-snapshot.sh`, `deploy.yml`, rollback, production, the database or host settings.

## Evidence and limitations

- GitHub issue #1673 documents 43 panel DEV snapshots, 43/43 READY + present + BASIC_STRUCTURE_OK, 43/43 matched GitHub runs (42 success, 1 failure), ~17.91 GiB panel staging allocation, 93.76% shared disk use.
- Snapshot token **belongs to the workflow that captured the previous runtime**; it is not the SHA deployed by that workflow.
- Marker correctness does NOT establish file integrity, the exact runtime SHA, live rollback references, re-deploy reproducibility, independent storage or a successful restore.
- GitHub `concurrency` serializes deploy workflows within its group; it is NOT a cross-tool host-level lock. A future deletion implementation MUST use a lock also respected by the deployment and manual rollback paths.
- Existing `finalize` is a destructive single-snapshot operation. This proposal neither invokes nor alters it.

## First-pass immutable protected pins

- `42619480638-1`: latest documented successful panel deploy's **pre-deploy** snapshot. Preserve pending live SHA and manual UAT confirmation.
- `42089478848-1`: failed deployment, automatic restore reportedly succeeded. Preserve for incident analysis.
- All other 41: KEEP until live release SHA, historical UAT dependencies, manual pins and external copies are reconciled. These two explicit tokens are NOT claimed to be a complete allowlist.
- Protect **all** UAT acceptance baselines, pending incident snapshots and the most recent verified *recoverable* point for each app. No age/status-only deletion.

## Proposed future policy (NOT activated)

1. Permanent protected set: manually named immutable tokens in owner-approved version-controlled metadata; current active release references and their pre-change recovery points; all incident/UAT pins; every snapshot not yet classified.
2. After verified recovery points and off-host backup: maintain at least last **five** confirmed *usable* points per DEV app, including one preceding the currently deployed release, plus a minimum 72-hour post-deployment/UAT window. Preserve older pins regardless of count/age. Five and 72 hours are **policy proposals**, not technical guarantees.
3. No candidate unless all 43 manifests pass, the live runtime SHA/previous SHA relation is proven, owner/UAT references checked, independent restore in an isolated environment passed and a shared deploy/rollback/delete lock is effective.
4. Candidate selection must be an owner-reviewed **exact token allowlist**, not age-based search or wildcard. Every unlisted token is retained. Preserve rollback compatibility across API-panel contracts.
5. A separate PO authorization would be needed for a future **dedicated guarded deletion implementation** and again for any individual deletion run. This branch contains no deletion code or scheduled prune.

## Read-only auditor

`scripts/mydevil/staging-retention-audit.mjs` works with Node.js 22 (Bash deploy remains untouched).
Default is manifest-level validation; `--deep` additionally recursively lstat-scans payload metadata, checks relative/dangling/escaping symlinks, and estimates occupied disk blocks without reading application file contents.

Safe use **from an already authorized Mac host** (pipes script to Node stdin without writing files on MyDevil):

```bash
ssh -i ~/.ssh/mydevil -o IdentitiesOnly=yes vetternkraft@s0.mydevil.net \
  'node22 --input-type=module - -- --app panelbw_dev --protect 42619480638-1 --protect 42089478848-1' \
  < scripts/mydevil/staging-retention-audit.mjs > panel-snapshot-audit-sanitized.json
```

Only after reviewing host load and deployment state, repeat using `--deep`. Use `--candidate EXACT_ID` only for **non-binding potential savings assessment**. A candidate is ALWAYS `BLOCKED_PENDING_RESTORE_AND_APPROVAL`; `eligibleForDeletion` stays 0. Output includes only IDs, counts, finding codes and approximate allocated bytes; it never prints `.env` values, destination contents, file lists or symlink targets.

The audit is read-only and **does not acquire a host deployment lock**: it reports `hostConcurrencyGate: NOT_VERIFIED`. Concurrent modification can invalidate its results. It reports `offHostRestoreGate: NOT_VERIFIED`. Do not interpret its output as deletion approval.

## Recovery evidence to collect

1. Read live panel release metadata and CI SHA without modifying runtime; map each snapshot to **pre-deploy** SHA via non-secret metadata when available.
2. Confirm all active UAT/incident and manual retain requests; compare with full 43-token inventory. Protect unclassified tokens.
3. Identify a backup independent of the current shared MyDevil filesystem. Verify accessibility, integrity and recovery of code/build plus private environment via an isolated test, with no real customer records emitted.
4. Run a non-destructive restore drill outside the live app tree with disposable data. Record immutable token, verification scope, SHA and smoke result.
5. Specify a host-level mutual exclusion protocol shared by deploy, rollback and any proposed future cleanup. Reconcile pending/deploy-in-progress state under lock.
6. Only then present the PO exact candidates, per-ID estimated `du` savings and recovery points. A later approval must bind to the inventory hash and exact token list.

## Capacity model — not deletion eligibility

If all 43 panel snapshots are similar in size, 17.91 GiB / 43 ≈ 0.4165 GiB each. **Hypothetical** savings: keep 5 of 43 ≈ 15.83 GiB; keep 8 ≈ 14.58 GiB; keep 10 ≈ 13.75 GiB. Real `du` allocation, protected/UAT points, hardlinks, copy-on-write and any new snapshot growth will change these figures. **Currently approved savings: 0 GiB.**

## Risk / acceptance

- **P0 risk:** 93.76% of shared MyDevil capacity consumed; all hosted apps can be affected.
- **P0 control:** no deletes, production changes, host writes, cache purges or auto-prune.
- **P1:** no restore validation or external backup proof; no deploy-wide host mutex.
- **P1:** no linkage between immutable snapshot token and true snapshot release SHA; incomplete list of UAT pins.
- **P2:** metadata allocation estimates from `stat.blocks` are only approximate.

PO must approve the final protected set, retention counts/window, backup acceptance criteria, host lock design and individual token allowlist. Review CI and negative tests before any future cleanup PR.