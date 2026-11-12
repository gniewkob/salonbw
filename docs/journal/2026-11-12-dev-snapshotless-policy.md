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
- In DEV only, check both filesystem free KiB and MyDevil account allocation
  from `devil info limits`, failing closed before remote mutations if either is
  below 4 GiB or the account report cannot be safely parsed.
- Add a dedicated parser and synthetic offline tests. The quota report is never
  logged in full; the accepted numeric summary is recorded.
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
- **BLOCKED:** provider CLI quota reading. Confirm error cause with MyDevil
  support or an independently verified, approved account-quota read method.
  Do not bypass the guard or infer account quota from `df`.
- **PENDING:** non-destructive recovery rehearsal and measured provider
  restore SLA/RTO.

## Rollout

No merge, no DEV/PROD deploy, no server mutation and no file/database restore.
Provider backup description is based on
https://pomoc.mydevil.net/Backup/; availability is documented, not a
guaranteed application-consistent restore or measured recovery-time SLA.

## Follow-up

1. Inspect exact-SHA CI and fix regressions without removing the quota gate.
2. Confirm the real MyDevil quota report is parsed correctly in a read-only
   check and record sanitized account-free-space proof.
3. Obtain independent review, verify docs and complete recovery approval
   before merging #1685. Keep deletion of historical snapshots separately
   authorized under #1673.
