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

**Required before execution:** explicitly set `DEPLOY_WORKFLOW_REF` to the
approved workflow revision and use the exact immutable release SHA whose CI
passed. The launcher verifies that the development workflow ref resolves to
**the same release commit SHA**. An older workflow must not silently restore
previous snapshot behavior. Production retains its independently verified
workflow-SHA and release-SHA semantics.

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
- **Temporary FreeBSD capacity gate (DEV only, under review):**
  the provider's `devil info limits` is unavailable (exit 2); the native
  `quota -v` returns zero configured hard-limit rows. In this PR the
  proposed release guard therefore uses read-only `du -sk "$HOME"` plus
  `df -Pk "$HOME"`, rejecting unknown results and requiring a conservative
  budget based on the previously reported **50 decimal GB** plan:
  **8 GiB reserved for potentially unobserved usage**, plus **4 GiB
  required deployment headroom**. `df` reports only shared filesystem
  space; `du` may omit provider-managed PostgreSQL and other billing
  items. The calculation is an **estimate**, not an authoritative quota
  read, and MUST be revisited if account terms change.
- **Read-only evidence:** GitHub Actions
  [#43273653726](https://github.com/gniewkob/salonbw/actions/runs/43273653726)
  captured full `HOME` size at **31,521,497 KiB** (exit 0), while
  `quota -v` exposed no hard limit and `df` showed large shared
  filesystem capacity. This is not a real-provider-quota verification.
  No deployed application or database was modified in the probe.
- **Merge/rollout gate:** review the 50 GB assumption and 8 GiB
  unobserved-usage reserve with the owner, verify exact-SHA CI and test
  a non-mutating preflight. If accounting becomes inconclusive, fail
  closed; do not silently revert to `df` alone. Provider RTO and actual
  account quota remain unverified.
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
