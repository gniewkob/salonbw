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

## Node.js 26 proposal / Mac Node 26 blocker — 2026-11-13

Operator ran the corrected channel selector: 10/10 Node tests, shell router
tests and offline DEV preflight PASS; route selected mydevil for V18 SHA.
The subsequent --prepare **stopped before a host write** with:
LOCAL_RELEASE_GATE=BLOCKED Node.js 22 is required.
Operator Mac uses Node 26.13.0, while the present MyDevil applications
and deploy workflows are pinned to Node 22.

MyDevil's official announcement dated 2026-09-24 confirms Node 26/npm26
on hosting; Node 26 entered LTS 2026-10-28. This justifies evaluating a
DEV-first migration, not changing current PROD without application/native
dependency compatibility evidence.

Changes on fallback branch:
- New scripts/ci/resolve-local-node.sh: uses existing Node 22 or 26
  from the user's active PATH, Homebrew installation or nvm without
  changing system-wide symlinks / login-shell defaults.
- New scripts/ci/resolve-local-node.test.sh: offline requested-major,
  override mismatch and unsupported-major negatives.
- Updated local-release-gate.sh: defaults to Node 22, transparently
  selects an installed Node 22 from the Mac; explicit Node 26 can perform
  local compatibility tests only and emits NOT_APPROVED for PROD.
- deploy-channel.sh: refuses SALONBW_RELEASE_NODE_MAJOR=26 manual prepare,
  pending verified DEV Passenger runtime migration.
- Runbook and PROJECT_STATE document a read-only MyDevil Node 22/26
  inventory and per-domain DEV→PROD rollout/rollback gates.

Validation: GitHub commits created. New scripts and Node 26 tests
**NOT YET EXECUTED** on Mac or MyDevil. No production runtime, site,
database or deployment setting changed.


## MyDevil Node runtime inventory — operator evidence (2026-11-13)

User ran a **read-only** SSH inventory on `vetternkraft@s0.mydevil.net`:

- `node22 -v`: `v22.23.4`
- `node26 -v`: `v26.12.1`
- `node -v` (default shell): `v22.23.4`
- `npm22 -v`: `11.14.1`
- `npm26 -v`: `11.14.1`
- Both npm version commands displayed `npm error config prefix cannot be changed from project config: /usr/home/vetternkraft/.npmrc` but returned version output and did not interrupt the inventory.
- `devil www list` confirms all SalonBW production and DEV hosts are configured as `nodejs` domains, alongside unrelated sites on the **same shared account**.

**Important limitations:** shell `node -v` is not evidence of which interpreter Passenger uses for an individual domain. Npm's `prefix` diagnostic is not proof that installs work correctly. Do not globally switch `~/bin/node` or `~/bin/npm` because other projects share the account.

**Security update:** upstream Node.js released `v26.13.1` on 2026-11-11 as a security release (https://nodejs.org/uk/blog/release/v26.13.1), newer than MyDevil's observed `v26.12.1`. Treat a production migration to the observed `v26.12.1` as **NO-GO** pending a patched provider build and compatibility evidence.

**Next gates:** inspect per-domain Passenger runtime configuration without writing it; diagnose npm prefix warning without exposing `.npmrc` credentials; run isolated local Node26 compatibility gates and host-native dependency tests. Neither DEV nor PROD app code, site configuration, database or runtime version was changed by this inventory.


## npm prefix diagnostic follow-up — operator evidence (2026-11-13)

Read-only SSH check run from `/tmp` on MyDevil returned clean
`npm22 --version = 11.14.1` and `npm26 --version = 11.14.1`, without
the earlier `config prefix cannot be changed from project config` message.
A content-suppressing presence check reported
`USER_NPM_PREFIX=CONFIGURED` in `~/.npmrc`. The previous diagnostic
therefore depends on the working-directory/configuration context.
Do **not** delete or rewrite `~/.npmrc`: the account hosts multiple
independent applications and this read-only output has not established
that the `prefix` value is invalid for package installation.
A real isolated dependency install is still an outstanding gate.

Current DEV fallback next steps:
1. Confirm the Mac can actually resolve Node 22 (offline mocked resolver
   PASS alone does not prove a Node 22 executable is installed).
2. Run read-only `manual-dev-preflight.sh` for panel and API against the
   already synchronized immutable SHA.
3. Run the exact-SHA local security/tests/build gate, then design and
   independently review an isolated runtime activation and recovery.
No app/service restart, database changes, nor PROD upgrade occurred.


## Hosted DEV read-only preflight: operator PASS (2026-11-13)

The operator ran `scripts/mydevil/manual-dev-preflight.sh` for immutable
application SHA `9a8c06de0bc57b4ad76fe551882a1b2c476b34ec` against
actual MyDevil DEV panel and API. Both returned
`MANUAL_DEV_PREFLIGHT=PASS` with `RUNTIME_MUTATIONS=NONE`.

| Target | Current running release reported | NODE_MAJOR | PNPM_STATUS | NPM_STATUS |
|---|---|---|---|---|
| panel | `beee6b40e1112765cb07d481bae8f66e72cef543` | 22 | COREPACK_ONLY | NPM22_READY |
| api | UNKNOWN (API release not queried by preflight) | 22 | COREPACK_ONLY | NPM22_READY |

The isolated source directory was already synchronized and unchanged:
`/home/vetternkraft/.salonbw-manual/sources/9a8c06de0bc57b4ad76fe551882a1b2c476b34ec`.
The operator also verified the Mac's installed Node 22 is `v22.23.4`
and the local Node selector returned `LOCAL_NODE22=READY`.

**Interpretation:** host paths, identity, runtime isolation, quotas and tooling
have passed read-only probes. The source has not been built for deployment,
activated, restarted, smoke-tested or compared against live API release
headers. The panel's different current SHA is expected before a new release.

**Next:** execute the local exact-SHA quality gate (`auto --prepare`),
record the result, then independently review a staged DEV-only release and
a failure-safe activation/recovery procedure. GitHub Actions fallback
`mydevil --execute` remains NO-GO; production unchanged.


## Local exact-SHA quality gate stopped on Gitleaks (operator evidence)

The operator ran `bash scripts/deploy-channel.sh development panel
fix/v18-calendar-reschedule-overlap-brand-20261112
9a8c06de0bc57b4ad76fe551882a1b2c476b34ec auto --prepare`.

Confirmed before the blocker:
- `GIT_SOURCE_SYNC_OFFLINE_CHECK=PASS` and
  `MANUAL_DEV_PREFLIGHT_OFFLINE_CHECK=PASS`.
- Automatic channel selector: 10/10 PASS, `DEPLOY_CHANNEL=mydevil`.
- Node resolver: `LOCAL_NODE_RESOLVER_OFFLINE_CHECK=PASS`;
  `LOCAL_TOOLCHAIN=node22 pnpm10.14.0`.
- Exact-SHA temporary worktree successfully initialized.
- `gitleaks git` scanned 56 commits and found **no** leaks.
- `gitleaks dir` scanned about 15.54MB of current worktree and reported
  **two** untriaged findings; the gate stopped before dependency install,
  build, host sync or application activation.

The repository has a `.gitleaks.toml` listing commit-level historical
allowlists. Such allowlists do not automatically make the two findings
safe, nor exempt them from the worktree scan. No claim is made about
whether the values are active secrets or synthetic examples.

Implemented a restricted diagnostic:
`scripts/ci/gitleaks-safe-report.mjs` + unit tests and integrated this
into the failing local release gate. Output permits **only** path, line
range and RuleID. A private temporary Gitleaks JSON report is removed
during cleanup; secrets, matches and source lines are never printed in
the diagnostic output. The gate remains fail-closed.

**Next gate:** Mac runs new parser tests and repeated exact-SHA local
gate; operator shares only sanitized finding metadata. Review the
underlying two findings privately; revoke/rotate real secrets or
document narrowly scoped exceptions for verified fixtures. No new
deployment authorization until unresolved findings are addressed.


## Findings triage — source P1 created without modifying active V18 branch (2026-11-13)

Sanitized Gitleaks results were provided by the operator: **5/5 safety
reporter tests PASS**, 56-commit scan PASS, but current-tree scan found
two matches in `backend/salonbw-backend/README.md:5` and
`docs/VERSUM_CLONE_PROGRESS.md:217`. Structural source inspection
confirmed an obsolete CircleCI badge `token` query parameter and a
hard-coded `VERSUM_LOGIN_PASSWORD` value. Adjacent hard-coded
`PANEL_LOGIN_EMAIL`, `PANEL_LOGIN_PASSWORD` and
`VERSUM_LOGIN_EMAIL` were present (do not publish their values).

Both files' Git blob SHAs are identical on master and the originally
tested V18 commit `9a8c06de...`. Therefore the findings are **not
introduced by the tested feature-branch change**. They remain a
current-tree release blocker until remediated.

Opened Draft [security PR #1702](https://github.com/gniewkob/salonbw/pull/1702)
from current master. It removes the CircleCI badge and replaces all four
literal credentials with fail-closed environment-variable references;
also adds a Node regression test. Source edits were re-read for structural
confirmation, but **Mac tests and Gitleaks have not yet been run on
#1702**. Real account credentials may have appeared in Git history;
the owner must privately determine whether they are live and rotate/revoke
any active values. Do not force-rewrite shared history without a separately
authorized coordination plan.

PR #1699's HEAD moved independently (was `121e8420...` when inspected),
so no changes were pushed onto that active branch. Comments were added to
both #1699 and #1701 explaining the dependency. The originally
synchronized SHA `9a8c06de...` is still blocked; source-fix PR #1702
must be integrated and a **new exact SHA** assessed before deployment.

**Deployment=NOT_STARTED**, no MyDevil runtime change.
