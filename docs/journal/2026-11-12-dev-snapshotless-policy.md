# DEV staging without automatic deployment snapshots — PR #1685

- **Date:** 2026-11-12
- **Agent:** ChatGPT (GitHub connector, cloud branch)
- **Commits:** PR #1685 branch, sequential file updates; final exact SHA tracked in GitHub
- **PR:** https://github.com/gniewkob/salonbw/pull/1685
- **Environment:** source-only changes; **no server deployment, SSH mutation, or snapshot deletion**

## Finding

On 2026-11-12 the owner-approved DEV snapshotless workflow still promised
automatic component restore in `docs/DEV_DEPLOYMENT_POLICY.md` and described
snapshot-dependent source guards in `docs/DEPLOYMENT_MYDEVIL.md`. This is
incompatible with the proposed `.github/workflows/deploy.yml`.

The DEV disk preflight relied on `df -Pk`, which measures filesystem capacity
but not the MyDevil account's storage allocation. Prior read-only incident
measurements in [2026-11-09 snapshot journal](2026-11-09-staging-snapshot-prune.md)
reported `devil info limits` showing approximately 47.3G used / 50G quota.
With no automatic DEV runtime snapshots, quota exhaustion during an
in-place deploy could leave a broken component.

## Change

- Document manual, one-component exact-SHA redeployment and separately approved
  provider recovery, preserving healthy components, DEV data isolation and
  explicit DB compatibility checks.
- Correct `docs/PROJECT_STATE.md`, `docs/DEPLOYMENT_MYDEVIL.md`,
  `Agent.md` and `AGENTS.md` to avoid promising automatic DEV rollback.
- Originally tried authoritative MyDevil account quota through
  `devil info limits`; this remained unavailable with provider exit status 2.
  The original parser and synthetic fixtures remain for future revalidation.
- Added a provisional **FreeBSD-only DEV preflight**: `du -sk "$HOME"`,
  `df -Pk "$HOME"` and `check-freebsd-dev-storage-budget.cjs`. The
  owner-reported 50 decimal GB cap is reduced by an 8 GiB reserve for
  unobserved/provider-managed usage, with another 4 GiB of mandatory
  deployment headroom. Unknown, failed or incomplete reads block execution.
  This estimate does NOT certify the provider's total account allocation.
- Preserve production workflow and existing historical snapshots. #1673
  retains ownership of any authorized snapshot deletion.

## Validation

- Source review of original PR findings and current full workflow: completed.
- Synthetic fixtures added: healthy account, account exhaustion despite free
  filesystem, filesystem exhaustion despite healthy account, decimal commas,
  decimal/binary units and malformed/unrelated output.
- Synthetic parser fixtures **5/5 PASS** in the isolated read-only QA job
  [#43266922013](https://github.com/gniewkob/salonbw/actions/runs/43266922013).
- The hosted read-only job **FAILED safely**: SSH exec works and the `devil`
  binary is present, but `devil info limits` returns exit code **2**.
  Its output was classified locally as `PROVIDER_ERROR`; raw provider
  output/account metadata was not logged. This is **not** proof of exhausted
  quota and **not** a successful quota inventory.
- **PENDING:** exact-SHA full CI after this documentation update.
- Hosted FreeBSD diagnostic
  [#43273320457](https://github.com/gniewkob/salonbw/actions/runs/43273320457)
  confirmed `quota -v` exit 0, **no hard-limit rows**, and large shared
  filesystem free space. A follow-up read-only probe
  [#43273653726](https://github.com/gniewkob/salonbw/actions/runs/43273653726)
  measured `du -sk "$HOME"` = **31,521,497 KiB** with exit 0.
- Conservative FreeBSD preflight implementation is PROPOSED on this PR;
  not a statement of provider account-quota compliance.
- [FreeBSD QA #43274826816](https://github.com/gniewkob/salonbw/actions/runs/43274826816)
  **PASS:** synthetic quota + conservative budget tests 10/10, real FreeBSD
  `du -sk "$HOME"` exit 0 and **31,521,485 KiB**. No host/database writes.
  The native `quota -v` returns 0 rows and is not counted as a hard limit.
- **PENDING:** exact-SHA full CI after final doc updates, independent
  review of the nominal 50 GB plan and unobserved-usage reserve.
- Provider's contractual account quota remains **UNVERIFIED**; never
  represent the conservative estimate as an authoritative billing figure.
- **PENDING:** non-destructive recovery rehearsal and measured provider
  restore SLA/RTO.

## Rollout

No merge, no DEV/PROD deploy, no server mutation and no file/database restore.
Provider backup description is based on
https://pomoc.mydevil.net/Backup/; availability is documented, not a
guaranteed application-consistent restore or measured recovery-time SLA.

## Follow-up

1. Inspect exact-SHA CI and fix regressions without removing the quota gate.
2. Check the conservative FreeBSD budget at the current live HOME size;
   verify that the operator accepts its unobserved-usage assumptions.
   When the provider CLI recovers, restore an authoritative quota preflight.
3. Obtain independent review, verify docs and complete recovery approval
   before merging #1685. Keep deletion of historical snapshots separately
   authorized under #1673.
