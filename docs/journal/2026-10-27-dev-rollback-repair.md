# Development rollback gate repair (2026-10-27)

- **Scope:** PR #1543 Draft, development-only release candidate; no merge/deploy.
- **Trigger:** Work/operator report [#1530](https://github.com/gniewkob/salonbw/issues/1530#issuecomment-6451295107) reproduced a partial rollback when an invalid frontend archive updated `package.json` but the extractor restored only app.js/.next/public.
- **Isolation:** production remains untouched; automatic MyDevil file backup was already confirmed by the owner and is not re-audited.

## Fix implementation

1. `extract-frontend-bundle.sh` now includes both Node entrypoints, `node_modules`, `.next`, `public`, `package.json`, `next.config.mjs`, `packages`, `src`, `scripts` in its extraction-failure restoration set. It removes newly created paths from incomplete archives as well as restoring the old paths. Earlier data/static retention remains intact.
2. `staging-release-snapshot.sh` supports explicit `prepare`, `rollback`, and `finalize` for **only** the three existing development application roots. Paths/tokens are validated, backups are owner-private and incomplete snapshots cannot be consumed. The snapshot captures old API `dist`, runtime modules, entrypoint, package and `.env`; both frontend roots additionally capture Next build, static assets, local bundled packages, manifest and private runtime config. No secret values are printed and no production path is accepted.
3. `deploy.yml` snapshots all enabled development targets before first mutation (including prepare_only), restores on any later failed job step and attempts a Passenger restart, but does not automatically delete successful snapshots: they remain for hosted UAT rollback. Staging deployments are serialized across workflow source branches. The production pipeline does not execute the new snapshot/rollback steps.
4. CI executes `scripts/test-mydevil-release-rollback.sh`: synthetic invalid tar extraction and state restoration, complete frontend extract followed by simulated install failure and rollback, API rsync/install/env corruption and rollback, duplicate backup refusal and rejection of a production app path. Uses only local temporary folders.

## Remaining gates and limitations

- CI of the **new exact HEAD** must pass with this test; this document is not evidence of runtime deployment or a hosted restore.
- Before dev rollout, operator must confirm private host snapshot size/available quota, test restoring full API and both frontend roots from an isolated scratch release, and test Passenger restarts + old SHA headers. On failure of a staging workflow, its own snapshot is restored and retained. The `all` path in `scripts/deploy-environment.sh` dispatches API and frontends in **separate** workflow runs; on a later frontend failure, the earlier API run is not automatically rolled back by the frontend workflow. Operator must explicitly restore API using its earlier snapshot token and revalidate SHA before declaring rollback complete.
- Until this Draft branch is merged, set `DEPLOY_WORKFLOW_REF=codex/dev-release-integrated-p0-20261027` for any approved development workflow dispatch; using the old `master` workflow does **not** contain this repair.
- This procedure restores application files and config only. Automatic schema reversal is not included; dev migration plan must be independently approved and current DB backed up, with destructive/unknown migrations treated as blockers. Existing isolated synthetic PostgreSQL restore passed in Work, but hosted recovery/RPO/RTO remains unproven.
- Legacy `e2e.yml` uses generic MyDevil DB secrets; do not dispatch without verified staging target.
- No real Booksy, customer, production, messages or finances may be touched. Keep PR #1543 Draft and production NO-GO until final owner acceptance.
