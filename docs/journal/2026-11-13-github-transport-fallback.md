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


## Two-channel routing implementation (2026-11-13)

Added `scripts/ci/deployment-channel.mjs` and read-only fixtures
`scripts/ci/deployment-channel.test.mjs`, `scripts/ci/deploy-channel.test.sh`.
The selector checks the latest CI runner and exact GitHub failure annotation.
It picks MyDevil only for a confirmed billing lock. Real executed test failures,
unknown runner errors and unavailable GitHub API cannot silently trigger
manual promotion. The existing Actions deployment path is unchanged.

Added one command `scripts/deploy-channel.sh` with `auto|actions|mydevil`:
- `--plan` only reports the chosen path.
- `--prepare` uses the existing Actions preview or runs exact-SHA local
  security/unit/typecheck/build gates before MyDevil source sync and DEV preflight.
- `--execute` invokes the existing Actions deploy when Actions is available;
  manual MyDevil activation intentionally returns NO_GO while the runtime
  promotion script and rollback/DB evidence are still unavailable.

Added `scripts/ci/local-release-gate.sh` to isolate a candidate SHA in a
disposable Mac worktree, run redacted Gitleaks scans over its Git delta/current
source tree, frozen pnpm install, backend/panel unit tests+typechecks and a build
for the selected target. PostgreSQL concurrency/E2E and hosted browser tests
are NOT included and remain explicit unverified gates.

**Validation:** source writes on PR #1701 successful. The new test files
have not been run on the operator Mac, and no runtime activation exists.
The existing preflight test fixture's Node-major mock was repaired in commit
`785386cd6d62d7b25f60fa288b05a7b7e3dac85f`; operator retest pending.

## Final CI SHA-scope correction (2026-11-13)

Owner reports `deployment-channel.test.mjs`: 8/8 PASS; both
`deploy-channel.test.sh` and `manual-dev-preflight.test.sh` PASS,
and `--plan` chose mydevil for the exact V18 SHA. Earlier test
iterations with broken node-major fixture and heredoc syntax are superseded.

Subsequent code review found a real P1: the original selector used the
repository-wide latest CI, which could be from another PR. The selector
now uses the official GitHub Actions workflow-run filter `head_sha`
for the requested full SHA, and rejects any returned run not matching
that SHA. Added Node regressions for unrelated run and missing SHA;
updated shell fixture, wrapper and runbook.

Validation on the final corrected SHA: PENDING Mac test rerun and remote
`--prepare`. Live deployment remains NOT_STARTED.
