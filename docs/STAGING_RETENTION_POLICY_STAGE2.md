# DEV staging snapshot retention — stage 2 planning engine

**Status: DRAFT / source and isolated policy tests only. No deletion capability.**
This branch is based on draft PR [#1674](https://github.com/gniewkob/salonbw/pull/1674);
it does not modify the live snapshot helper, environment files, staging deployment,
cron schedules, production, other projects or the MyDevil host.

## Why a retention planner is necessary

A successful staging deployment creates a complete pre-deploy snapshot of
`.next`, `node_modules` and other runtime files but leaves it indefinitely.
Issue [#1673](https://github.com/gniewkob/salonbw/issues/1673) has
43 panel snapshots (~17.91 GiB). `finalize` currently has no shared
host-level lock or explicit pin register. Running it for old IDs based only
on age could remove an active UAT or rollback reference.

The proposed operational budget for panel snapshots is **8 GiB**,
with **at least five recent points** and a minimum **72-hour protection
window**. These are **our draft policy targets**, not a MyDevil requirement.
The time window alone does not cap total storage with frequent deployments.
If protected snapshots exceed the budget, raise `budgetTargetWouldStillBeExceeded`;
NEVER delete a protected item merely to reach the target.

## Pure planning module

`scripts/mydevil/staging-retention-policy.mjs` exports
`planStagingRetention({ report, evidence, now, keepLatest, minAgeHours, budgetBytes })`.

- Accepts a sanitized **deep** audit report from `staging-retention-audit.mjs`.
- Requires per-token evidence for immutable deployment/run identity, age,
  review of active UAT/incident references, an independently restored off-host
  backup, a successful isolated snapshot restore and a verified release SHA.
- Preserves the latest N; incident and manually pinned copies; failed-run
  snapshots; unknown age, unverified, or too-young snapshots.
- Proposes **exact immutable token IDs only**, as
  `REVIEW_CANDIDATE_NOT_AUTHORIZED`. Output savings are *nominal* allocations,
  not a promise of `df` or provider quota reclamation.
- **Hard-coded safety outcome:** `eligibleForDeletion: 0`,
  `deletionCapability: false`, `autoPruneEnabled: false`.
- Never accesses the filesystem, runs a shell command, removes files or
  changes permissions. Synthetic tests run via
  `node --test scripts/mydevil/staging-retention-policy.test.mjs`.

This planner is intentionally not yet wired to the MyDevil host. Its per-token
timestamp and recovery evidence must be independently collected and verified.

## Required before any actual rotation

1. Obtain fresh MyDevil account quota using `devil info limits`, and disk/inode
   filesystem data as separate observations. The previous `df -Pk` suggestion
   measures host filesystem space, NOT necessarily the package quota. Do not
   deploy with only `df` and do not assume a parser contract before inspecting
   the real output. MyDevil database storage contributes to package occupancy.
2. Complete 43/43 deep manifest audit, record a verified live panel release SHA,
   reconcile old snapshot capture tokens to the *previous* runtime.
3. Confirm off-host backup **coverage and isolated restore** of necessary
   runtime components including private configuration with strict secret handling.
   An off-host backup of source alone is not a restorable runtime.
4. Establish one host-level lock for **prepare, restore, finalize and cleanup**.
   Existing workflow concurrency is only GitHub Actions-level serialization;
   it does not coordinate independent host maintenance and manual SSH access.
5. Establish owner-approved explicit `protectedPins`, snapshot candidates and
   a signed/immutable evidence record. A future **separate** deletion executor
   must validate under the lock and reject mismatches between the current
   inventory and the approved receipt, or unknown/symlink entries.
6. Prove behavior on synthetic and isolated restore fixtures. A rollout must
   permit exact-ID bounded cleanup only, with dry-run default and separate
   authorization for a real cleanup session. No wildcard deletion.

## Interim rules

- [ ] Do not merge the cleanup logic with the independent read-only auditor
      until both PRs pass exact-SHA CI.
- [ ] Do not invoke the current `staging-release-snapshot.sh finalize`.
- [ ] Do not activate cleanup, scheduled cron, auto-pruning or panel deployment
      at the current uncertain quota margin.
- [ ] Next operational data: current package quota, deep audit summary,
      live release linkage, verified rollback pins and off-host restore proof.

**No snapshots were deleted by this work.**


## Fresh owner quota observation and staging admission guard (2026-11-09)

MyDevil account CLI `devil info limits` reported **94.61% (47.3G/50.0G)**.
The staging snapshot subtrees consumed **24,106,301 KiB (~22.99 GiB)**,
of which `panelbw_dev` used **19,222,547 KiB (~18.33 GiB)**.
Since the earlier snapshot measurement, panel snapshots grew by **444,556 KiB
(~434 MiB)**. A new entry count must still be verified from host inventory.
Underlying ZFS inode availability is **not** the relevant 50G account quota.

This branch adds `scripts/ci/mydevil-staging-quota-preflight.mjs` and its
negative/real-format tests, and adds a **staging-only** guard to
`.github/workflows/deploy.yml` before any remote app-directory mutation
or snapshot preparation. The guard:
- Collects `devil info limits` via existing authenticated SSH, strips ANSI
  controls, validates a single Polish `Powierzchnia` usage line and
  cross-checks percent against used/limit with rounding tolerance.
- Conservatively estimates free account quota using the displayed figures.
  It fails closed if malformed, ambiguous, inconsistent, SSH fails, or less
  than **5 GiB** remains by a conservative lower-bound. The 5 GiB admission
  threshold is an **internal default**, not a MyDevil regulation or proof
  that every future deployment fits. More granular per-target peak storage
  estimation is still desirable.
- Uses the trusted workflow-commit script via `git show "$GITHUB_SHA:..."`,
  not the historical SHA chosen for the deployed app; avoids weakening the
  guard when deploying older commits. Does not log raw CLI output or mutate
  the remote system.
- Is enforced by the ops workflow static guard and its own isolated tests.

**This guard is not active on MyDevil until the relevant PR is reviewed,
merged and the trusted `master` workflow carries the code.** Existing
`master` staging workflows still lack this protection. Do not dispatch a
panel deploy simply because the source branch contains the new guard.

The Product Owner already approved *five usable rollback points per DEV app*,
*72-hour minimum*, *off-host restore*, and *exact approved token lists* in
issue #1673 / PR #1674. The 8 GiB panel target remains only a proposed
monitoring budget, not an approved deletion trigger.

No current snapshot has been approved for deletion. Corrective deletion
requires a separate guarded execution path and exact-token authorization.
