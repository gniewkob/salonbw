# Staging snapshot retention audit — issue #1673

- **Date:** 2026-11-09
- **Agent:** ChatGPT / DevOps
- **Branch:** `codex/salonbw-1673-retention-audit-20261109`
- **PR:** [#1674](https://github.com/gniewkob/salonbw/pull/1674) (Draft, no merge/deploy)
- **Scope:** DEV private recovery snapshots; no production or host writes

## Finding

Read-only host measurements recorded in [#1673](https://github.com/gniewkob/salonbw/issues/1673) show 43 `panelbw_dev` snapshots occupying 17.91 GiB; 93.76% shared MyDevil disk use. All 43 have READY and valid basic structure, and all 43 workflow tokens map to GitHub Actions (42 success; one failed with reported automatic rollback). Full manifest integrity, live release SHA mapping, UAT pins, off-host restore and host-level deploy mutex are **not verified**.

`staging-release-snapshot.sh` captures pre-deploy runtime including dependencies and private environment. Workflow intentionally retains snapshots for UAT. No bounded retention mechanism exists. The existing `finalize` action is destructive and is outside this task.

## Change

- Add `scripts/mydevil/staging-retention-audit.mjs`: Node 22 dependency-free, host-read-only, strict DEV target allowlist, manifest identity/duplicates/missing/extras audit, optional deep symlink metadata walk, explicit protected/candidate IDs, sanitized summary. Tool **never deletes** and never reports candidates eligible to delete.
- Add synthetic fixture tests including corrupt data, symlink traversal, concurrent-in-progress marker, unknown apps, owner pins, CLI stdin and absence of private disclosure.
- Run the tests via existing CI ops regression job.
- Add `docs/STAGING_SNAPSHOT_RETENTION.md` outlining evidence-gated proposed policy and future blocking conditions. Existing rollback shell and deploy workflow semantics remain unchanged.

## Validation

- Local Node 22 tests **20/20 PASS**, incl. 2 CLI stdin/metadata confidentiality integration tests.
- Locally verified Git blob SHA equals GitHub blob SHA for both source and test.
- GitHub CI exact SHA: **pending PR creation/result**.
- Host full audit: **BLOCKED** (no authorized live SSH execution facility in this session).
- Off-host restore proof: **BLOCKED**.
- No `finalize`, cleanup, deploy, merge or process restart.

## Rollout

None. A Draft PR is a code review artifact, not authorization to execute on the MyDevil server.

## Follow-up

Run the read-only 43/43 manifest scan on-host, check real active pre-deploy SHA and all UAT pins, verify independent/off-host recovery and isolated restore, design deploy/rollback-retention shared host lock, then request PO review of exact deletion candidates. No delete implementation in this PR.

## Owner decision — 2026-11-09

The Product Owner explicitly accepted the following three gates: (1) DEV snapshot retention of at least **five verified usable recovery points per app** and **72 hours**; (2) proof of an independently accessible off-host backup and successful isolated restore before removal; (3) a later cleanup may proceed only through review of **an exact token allowlist** with per-ID explicit authorization. This approves governance parameters and readiness work, **not deletion of any currently unlisted snapshot**.

**No new host evidence:** 43/43 exhaustive manifest checks, host deployment lock, verified off-host restore and per-token approval remain outstanding. All 43 snapshots are still retained by policy. No deployment, PR merge or cleanup was performed.
