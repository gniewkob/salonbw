# Selective Deployment & Recovery — SalonBW Development

**Status:** proposed on PR #1685 (not merged or deployed). The existing `master` production release policy remains unchanged.

## Goal

Treat the three development runtimes as separately deployable targets, rather than an
all-or-nothing operational transaction:

| Target | DEV hostname | MyDevil app root |
| --- | --- | --- |
| API | `dev-api.salon-bw.pl` | `apps/nodejs/api_salonbw_dev` |
| Panel | `dev-panel.salon-bw.pl` | `apps/nodejs/panelbw_dev` |
| Landing | `dev.salon-bw.pl` | `apps/nodejs/salonbw` |

A successful component stays live if a later *independent* component fails. The failed component is repaired by a reviewed, source-locked redeployment or a separately authorized provider restore. The new DEV workflow creates **no** per-deployment runtime snapshot and performs **no** automatic snapshot rollback. Never roll back a healthy component solely to make every runtime SHA identical.

## Workflow

`scripts/deploy-environment.sh development all <immutable-sha> --execute`
dispatches **three separate GitHub runs** in this dependency order:

1. API, verify health, config and migrations; if it fails, stop: don't deploy frontends.
2. Panel, verify release and smoke; if it fails, stop with API preserved.
3. Landing, verify release and smoke; if it fails, API and panel stay deployed.

`development frontends` runs panel and landing separately, never touches API.
`development panel`, `development landing`, and `development api` run just
one target. `deployment-config.mjs` rejects multi-target development workflows,
including manual `staging all`, `staging frontends` and staging push events
with multiple changed apps; do not bypass the guard through direct GitHub dispatch.
Production `all` and `frontends` retain their previous semantics.

**Normal DEV execution:** set `DEPLOY_WORKFLOW_REF` to the reviewed
workflow revision and deploy an immutable application SHA with successful
exact-SHA CI. Workflow SHA and application SHA **must match**; there is no
implicit historical release mode.

**Explicit historical DEV recovery (after #1685 is merged to master):**
the operator must review the affected component, its last known-good
**full 40-character master-ancestor SHA**, relevant migrations and
compatibility, and then explicitly authorize recovery. Set
`DEPLOY_WORKFLOW_REF=master` and
`DEV_HISTORICAL_REDEPLOY_APPROVED=true` when invoking
`scripts/deploy-environment.sh development <component> <old-sha> --execute`.
Both the launcher and the GitHub workflow independently reject an
unapproved mismatch, feature-branch workflow, non-ancestor SHA or changing
master. The workflow resolves the old application SHA, verifies its exact-SHA
CI and executes **security/deployment guards from its own current workflow
SHA**, not from old release scripts. Direct GitHub dispatch requires
`historical_dev_recovery=true` and the same controls. **This is a controlled
redeploy, not a DB rollback or guaranteed application restore.**

**Before #1685 merges:** do not use historical recovery mode; the current
master workflow may still include legacy snapshot handling. Unmerged DEV
feature-branch releases must keep matching SHA; for a failed historical
feature-branch release, stop and design a separately reviewed recovery
candidate instead of bypassing the guard. Production's existing rollback
policy remains independent.

## DEV recovery boundary — owner decision, 2026-11-11

- Once PR #1685 is merged, staging workflows no longer call
  `staging-release-snapshot.sh prepare/rollback/prune`. They keep the
  source-locked CI gate, separate API/panel/landing runs, host SSH, smoke
  verification and temporary extractor cleanup.
- **Failure before a remote mutation:** stop; there is no change to recover.
  **Failure after a mutation:** hold dependent deployments and inspect the
  affected component. Keep other healthy components running. Do not assume
  the failed component is automatically restored.
- **Application recovery:** select the last known-good, security-compatible
  immutable SHA, obtain its exact-SHA CI result and manually redeploy only
  the affected component under an approved workflow revision. Verify service
  health, live SHA, login, booking/consent boundaries and client gateway.
  Historical SHA and workflow-ref compatibility must be assessed explicitly;
  never bypass the workflow source guard.
- **Data/database recovery:** do **not** run database `down()`, restore a
  production database, or replay a file backup to DEV automatically. Obtain
  operator approval, identify the isolated DEV dataset and timestamp,
  coordinate database-backup availability with MyDevil, and rehearse on an
  isolated disposable copy before any live restore. Record resulting RPO/RTO.
- **Provider backup:** according to
  [MyDevil Backup documentation](https://pomoc.mydevil.net/Backup/), file
  backups are created daily, remote backups are retained for 14 days and
  database backup retrieval requires contacting the provider. This does
  **not** establish a guaranteed runtime rollback point, verified restore
  time, or an app-consistent PostgreSQL snapshot. The provider restore
  SLA/RTO remains **UNVERIFIED**.
- **Existing private DEV snapshots:** historical directories remain untouched
  by this PR. The separate #1673 deletion/inventory gate still applies.
  No automated pruning, `rm -rf`, or cross-project cleanup is authorized.
- **DEV disk preflight (verified 2026-11-12):** execute read-only
  `devil info limits` for the MyDevil account-wide disk allocation and
  `df -Pk "$HOME"` for shared FreeBSD filesystem availability before any
  remote deployment mutation. Both must report **at least 4 GiB available**.
  Unknown output, failed commands, insufficient capacity or invalid values
  **block deployment**; `du` and `df` are never substitutes for the account
  quota. The [official MyDevil announcement](https://www.mydevil.net/nowosci/page/9/)
  confirms that PostgreSQL database storage counts toward account usage.
- **Read-only validation:** the provider CLI was temporarily unavailable
  and the interim `du`/50 GB/8 GiB approach was tested, but has since
  been **removed from the proposed deploy workflow**. On 2026-11-12,
  [provider quota QA #43277750567](https://github.com/gniewkob/salonbw/actions/runs/43277750567)
  returned **PASS** (the parser and real provider report each met the 4 GiB
  guard alongside the filesystem check, without hosted writes). Run the
  preflight again immediately before any actual DEV release.
- **Merge/rollout gate:** exact-SHA CI, independent review, manual recovery
  rehearsal and approval remain required. A successful disk check does not
  verify provider restore SLA/RTO or authorize PROD deployment.
- **Production:** snapshot, rollback and backup procedures for production
  are **not** modified by this proposal.

## Separate deployment and UAT evidence

The orchestrator emits per-target **DEPLOY** states `PASS`, `BLOCKED` or
`NOT_RUN`. This is not proof of business functionality. UAT tracks independently:

- **PASS:** correct live SHA, health/Basic Auth and the relevant browser test(s) passed.
- **PARTIAL:** service healthy but some target-specific browser tests incomplete,
  ambiguous or interrupted by an automation problem.
- **BLOCKED:** service unusable, security/isolation failure, or a reproduced severe regression.

Log the observed SHA for each runtime, the exact CI run, target-specific
deployment run ID and browser evidence. Do not mark the entire release ready
for production unless **all three components and the cross-app scenarios PASS**.

## When to continue or stop

| Observation | DEV action |
| --- | --- |
| Landing fails; API + panel healthy | Keep API + panel, diagnose and manually redeploy **landing only**; authorize provider restore separately |
| Panel fails; API + landing healthy | Keep API + landing, diagnose and manually redeploy **panel only**; authorize provider restore separately |
| API fails, migration risk or incompatible contract | Stop dependent deployments; assess DB compatibility and manual API redeploy before proceeding |
| UAT script uses an unintended date but browser app remains healthy | **PARTIAL**, fix test and retry; do not roll back three runtimes |
| Real outbound, shared prod data/secrets, unknown destructive migration or insecure access | **BLOCKED**, stop and protect affected systems immediately |

For the appointment-drawer reopen UAT, after **every** open explicitly verify
`#appointment-start-time.value === '2026-11-04T09:00'` (Warsaw local),
synthetic employee/client/service identifiers and any pending
`POST /appointments` before sending. The expected UTC timestamp in November
is `2026-11-04T08:00:00.000Z`. If mismatched, **abort the POST before it
reaches the API**, collect sanitized evidence and correct the UAT automation.
A fresh conflict check must precede any `forceOverlap=true` submission.

## Safeguards retained

- DEV app roots, database account `p11522_salonbw_d`, signing keys and cookies
  remain isolated from production; outbound/scheduler/SMS remain disabled.
- Never use the legacy `.github/workflows/e2e.yml` without proving the
  target of generic `MYDEVIL_DB_*` secrets.
- Keep target-specific Passenger restarts and verify exact live runtime SHA
  and health after a manually authorized redeploy. Existing historical
  snapshots are inventory-only pending separate #1673 authorization.
- Do not auto-reverse PostgreSQL migrations or restore the database just
  because one frontend test failed. Any shared schema/contract change needs
  an explicit compatibility and rollback assessment.
- Production deployments, Booksy import/cleanup, DNS and real messages remain
  outside the scope of this policy. No merge or production deployment without
  separate owner acceptance.

## Evidence

Initial DEV attempt: [issue #1530](https://github.com/gniewkob/salonbw/issues/1530#issuecomment-6452374898).
Date mismatch investigation and safe replay:
[issue #1530](https://github.com/gniewkob/salonbw/issues/1530#issuecomment-6452491734).
The rollout is *not* deemed complete from these reports; this policy
defines how the next development/UAT iteration should proceed.
