# DEV snapshotless deployment recovery and quota controls — PR #1685

- **Date:** 2026-11-12
- **Agent:** ChatGPT, GitHub cloud branch
- **PR:** https://github.com/gniewkob/salonbw/pull/1685
- **Scope:** staging/DEV deployment source and runbooks; production and historical snapshots unchanged
- **Change status:** PR open; no merge, deploy, database writes or snapshot deletion

## Finding

The former DEV workflow created full persistent rollback snapshots per deployment,
which exhausted the shared MyDevil account. The snapshotless PR #1685 removed
automatic create/rollback/prune but kept outdated runbooks promising a snapshot.
Its initial disk check relied on FreeBSD `df`, which reflects the shared
filesystem and can miss the hosting account's contractual allocation.

According to [MyDevil's own announcement](https://www.mydevil.net/nowosci/page/9/),
provider-managed PostgreSQL database size also counts toward account usage.

## Change

- Keep component-specific DEV release execution, exact-SHA CI and staged smoke.
- Do not create/prune/restore persistent DEV deployment snapshots. Preserve
  existing snapshots and issue #1673's separate authorization gate.
- Retain production snapshot/rollback behavior and manual PROD promotion rules.
- Update `docs/DEV_DEPLOYMENT_POLICY.md`, `docs/DEPLOYMENT_MYDEVIL.md`,
  `docs/PROJECT_STATE.md`, `AGENTS.md` and `Agent.md` to document
  manual exact-SHA redeploy or separately approved provider recovery.
- In `.github/workflows/deploy.yml`, before the first remote mutation,
  require a read-only `devil info limits` provider quota read **and**
  `df -Pk "$HOME"` filesystem capacity. `check-mydevil-dev-quota.cjs`
  fails closed for unavailable/malformed output, unknown values or fewer
  than **4 GiB available** in either measurement.
- The temporary native FreeBSD `quota -v` / `du` / assumed 50 GB
  (8 GiB unseen reserve) approximation has been **removed from the release
  workflow and tests**, because it cannot certify the MyDevil account quota.
- Dedicated read-only QA remains in
  `.github/workflows/dev-account-quota-readonly-qa.yml`; no production
  credentials or persistent host modifications are used.

## Validation and evidence

1. Initial `devil info limits` probe returned exit 2 (read-only QA
   [#43266922013](https://github.com/gniewkob/salonbw/actions/runs/43266922013)).
   It did not confirm either enough or insufficient account capacity.
2. Native FreeBSD `quota -v` returned success but no enforceable
   per-account hard limit. `df` showed large **shared** filesystem
   space. `du -sk "$HOME"` measured ~31.5 million KiB in
   [#43273653726](https://github.com/gniewkob/salonbw/actions/runs/43273653726).
   These results are historical diagnosis only, not account quota evidence.
3. MyDevil CLI subsequently recovered. Hosted read-only
   [quota QA #43277750567](https://github.com/gniewkob/salonbw/actions/runs/43277750567)
   **PASS**: the actual provider output parsed successfully; both provider
   account quota and filesystem available space met the 4 GiB gate.
   The QA job made **no application, database or snapshot modifications**.
4. The old FreeBSD proxy and test files have been deleted from this PR.
   **PENDING:** full exact-SHA CI on the final branch head, independent
   review of the new quota preflight and acceptance of the DEV recovery
   policy.

## Recovery limitation

MyDevil's routine provider backups are not a tested application-consistent
PostgreSQL snapshot or a measured recovery time objective. After a failed
snapshotless DEV deploy, inspect the affected target and use an approved,
compatible exact-SHA redeploy; request provider recovery separately if
required. Never reverse DB migrations automatically and never roll back
healthy API/panel/landing components just to align SHAs.

## Rollout

No host writes, snapshot deletions, deployments, or database changes performed
in this PR update. The provider backup recovery drill remains unverified.

## Follow-up

1. Complete exact-SHA GitHub CI and independent review.
2. Close P2 only with evidence from the current code and live provider QA.
3. Obtain owner acceptance of manual DEV recovery before merging #1685.
4. Restore a conservative fail-closed policy if provider quota reads fail
   again; never fall back to `df` alone or an assumed 50 GB plan.
