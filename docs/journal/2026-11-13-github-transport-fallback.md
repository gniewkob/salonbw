# GitHub Actions billing-lock fallback: Git source transport

- Date: 2026-11-13
- Scope: independent source-only transport for SalonBW, no runtime mutation
- Branch: ops/github-mydevil-source-fallback-20261113
- Rollout status: NOT DEPLOYED; no SSH runtime activation

## Finding

GitHub job annotation for SalonBW CI #43417583215 says:
"The job was not started because your account is locked due to a billing issue."
CI jobs have runner_id=0 and zero executed steps. The standard
scripts/deploy-environment.sh dispatches GitHub Actions, so it cannot function
while the account is locked. GitHub repository Git operations remain available.

## Change

Added scripts/mydevil/git-source-sync.sh to fetch an exact SHA from a public
GitHub branch into the private MyDevil source workspace rather than live app
directories. Uses a pinned branch head, origin allowlist, read-only --check,
private checkout, master-owned account quota parser, 4 GiB account/filesystem
floor, and manifest receipt. No application code, config, database, domain
symlinks or production release are touched.

Added scripts/ci/git-source-sync.test.sh (offline command-mock checks) and
docs/GITHUB_ACTIONS_OUTAGE_FALLBACK.md (manual runbook and release boundary).

## Validation

- GitHub file creation: PASS (branch-only commits).
- Bash syntax and offline test execution: NOT RUN in the agent environment;
  owner must execute:
  bash -n scripts/mydevil/git-source-sync.sh
  bash scripts/ci/git-source-sync.test.sh
- MyDevil read-only --check: NOT RUN.
- MyDevil --sync: NOT RUN.
- Frontend and backend runtime build, database compatibility, activation,
  Passenger restart, rollback and browser UAT: NOT RUN.

## Rollout

None. Production and DEV services unchanged by this change.
No false equivalence between this source transport and a completed deployment.

## Follow-up

1. Complete offline syntax/mock tests and read-only MyDevil source check.
2. Inspect real DEV runtime paths, persistent data, dependencies and quota.
3. Implement separate reviewed, reversible DEV activation for API/panel/landing.
4. Verify live SHA/health, controlled failure rollback and acceptance before
   enabling production manual promotion.


## Confirmed operator evidence (2026-11-13 15:09 CET)

Operator completed the fallback worktree and source checks on Mac mini:
- `GIT_SOURCE_SYNC_OFFLINE_CHECK=PASS`
- `SOURCE_CHECK=PASS` for SHA `9a8c06de0bc57b4ad76fe551882a1b2c476b34ec`
- `SOURCE_SYNC=PASS` on MyDevil, source under
  `/home/vetternkraft/.salonbw-manual/sources/9a8c06de0bc57b4ad76fe551882a1b2c476b34ec`
- `DEPLOYMENT=NOT_STARTED`; no DEV/PROD app or DB changed.

Phase 2 adds `scripts/mydevil/manual-dev-preflight.sh` and
`scripts/ci/manual-dev-preflight.test.sh` on PR #1701, with read-only
verification of exactly pinned source/approved quota guard, canonical DEV
runtime paths and symlinks, private DEV configuration, Node 22, and
pnpm availability. Rejects production targets and fails closed on bad
MyDevil quota. Test fixtures cover malformed SHAs, missing private env,
wrong cookie namespace, tampered quota policy, and unexpected domain
directories. **Phase 2 tests and live preflight are NOT YET EXECUTED.**

Do not confuse a successful source sync with build/restart/activation.
