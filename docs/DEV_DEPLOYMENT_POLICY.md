# Selective Deployment & Recovery — SalonBW Development

**Status:** proposed and implemented on a separate Draft PR; production release policy is unchanged.

## Goal

Treat the three development runtimes as separately deployable targets, rather than an
all-or-nothing operational transaction:

| Target | DEV hostname | MyDevil app root |
| --- | --- | --- |
| API | `dev-api.salon-bw.pl` | `apps/nodejs/api_salonbw_dev` |
| Panel | `dev-panel.salon-bw.pl` | `apps/nodejs/panelbw_dev` |
| Landing | `dev.salon-bw.pl` | `apps/nodejs/salonbw` |

A successful component stays live if a later *independent* component fails. The
failed component is repaired or rolled back to its own private snapshot. Never
roll back a healthy component solely to make every runtime SHA identical.

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

**Required premerge:** explicitly set `DEPLOY_WORKFLOW_REF` to the branch with
the selective workflow changes, and use the exact SHA whose CI passed.
Do not dispatch the old `master` workflow to validate a new unmerged branch.

Each component-specific GitHub workflow calls the existing private snapshot
and selective rollback helper. The staging workflow's recovery restores only
the enabled target; no other app directory is modified. Retained snapshots
can be restored per component after a browser/UAT failure.

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
| Landing fails; API + panel healthy | Keep API + panel, repair/restore **landing only** |
| Panel fails; API + landing healthy | Keep API + landing, repair/restore **panel only** |
| API fails, migration risk or incompatible contract | Stop dependent tests/deploys; assess API rollback and required frontend compatibility |
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
- Keep private snapshots and per-target Passenger restarts; verify each restored
  runtime SHA and health after rollback.
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
