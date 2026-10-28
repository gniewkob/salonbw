# Reconcile integrated P0 release with current master and DEV auth gates

- **Date:** 2026-10-28 (Europe/Warsaw)
- **Agent:** ChatGPT / GitHub connector
- **Source:** stacked Draft PR #1543 (P0) + #1544 (selective DEV recovery)
- **PR:** separate Draft reconciliation candidate (see GitHub branch)

## Finding

Draft #1543 had 45 commits ahead but 4 behind master and GitHub reported
`mergeable_state=dirty`. Master added explicit synthetic DEV credential
repair/verify workflows, HTTP auth UAT, scripts and three CI lines.
The conflict was localized to `.github/workflows/ci.yml`: both sides inserted
adjacent steps in the same operations job. Unchanged PR #1543 was not safe
to merge into master.

## Change

Prepare a new candidate with tree based on **deployed DEV source**
`c4399429a7f9a7804161847f79d6d70a64a025d1` (#1544, includes #1543).
Preserve its selective DEV rollback/test workflows and append all 9 new
master-only paths using their exact master blob IDs. In `ci.yml`, preserve
the existing frontend rollback/snapshot verification and add master-only
synthetic credential checker tests in the same ops job. Retain the full
master history as a second merge parent. Do not remove any workflow or data.

## Validation

Read-only GitHub compare confirmed master diverged by exactly four commits,
nine added files and the adjacent CI test step. Previous exact-source CI:
#1543 [40569416539](https://github.com/gniewkob/salonbw/actions/runs/40569416539)
9/9 PASS, #1544 [40581862244](https://github.com/gniewkob/salonbw/actions/runs/40581862244)
9/9 PASS. New integrated HEAD **not yet CI-certified** at authoring time.
Hosted DEV auth evidence: repair [40775649027](https://github.com/gniewkob/salonbw/actions/runs/40775649027)
UPDATED, verify [40775895601](https://github.com/gniewkob/salonbw/actions/runs/40775895601)
MATCH, HTTP auth [40776209505](https://github.com/gniewkob/salonbw/actions/runs/40776209505)
PASS with one real login and no appointment writes.

## Rollout

No production merge, deploy, restart, migration, Booksy operation or data
changes from this merge preparation. The DEV credential change was performed
earlier by the exact approved staging-only workflow.

## Follow-up

Review and run full CI on the new exact SHA; inspect diff against master,
security and independence gates, then hosted synthetic booking UAT and
isolated restore/rollback. Only an accepted candidate can be merged/deployed
to production, API first then panel/landing as needed.
