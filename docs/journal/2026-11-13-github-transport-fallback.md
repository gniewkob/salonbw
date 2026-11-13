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


## Security documentation fix validated; V18 integration PR #1703 prepared (2026-11-13)

Owner confirmed `node --test scripts/ci/redacted-legacy-docs.test.mjs`
**2/2 PASS** and `gitleaks dir --redact=100 --no-banner .`
**PASS, 0 findings** for the exact Draft security PR #1702 HEAD
`001ac6ebb24df988a2b3d820ffe3303ff5b4ef41`.

The historical embedded credentials and obsolete CircleCI badge token
were removed from current-tree documentation in Draft PR #1702,
not from Git history. Confirm actual secret lifetime privately and
rotate/revoke any still-active credentials before deployment.

Created Draft integration PR #1703
(https://github.com/gniewkob/salonbw/pull/1703) from the then-current
PR #1699 V18 SHA `121e842092d8e2b38fd9a8d66f2189d072835a65`.
Copied the exact three reviewed file blobs from PR #1702 (README,
VERSUM progress, regression test), leaving V18 app code unchanged.
The integration HEAD is
`2cf7c9b2a2d2ac43d48eac3837afb2fd3fa67c1a`.
PR #1703 has not yet been tested at its exact HEAD on Mac.

GitHub repo ruleset `SalonBW master - required CI` (ID
`26163306`) is active. It requires PR review and eight exact status
checks: Ops Workflow Regression, Ops Fixture Schema Regression,
Ops Workflow Docs Consistency, Security Audit, Frontend admin/public/
dashboard, and Backend API. Because Actions is currently account-
billing-blocked, source correction and offline tests do NOT authorize
a merge into protected `master`; no bypass was attempted.

Release remains BLOCKED pending PR review, valid source SHA,
required independent controls and approved activation. No MyDevil
runtime code or PROD data was changed.


## V18 security integration #1703 merged into feature (2026-11-13)

Operator validated the exact PR #1703 pre-merge head
`2cf7c9b2a2d2ac43d48eac3837afb2fd3fa67c1a`:
- `redacted-legacy-docs.test.mjs`: 2/2 PASS
- Gitleaks directory: 0 findings
- Gitleaks git commit-range: 62 commits, 0 findings

GitHub PR #1699 and #1703 had unchanged, expected base/head SHAs;
#1703 was marked ready for review and squash merged **into the V18
feature branch** (NOT master), yielding
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.
The merged changes are exactly the previously checked credential
redactions plus regression test; application code and styling
are untouched. GitHub confirmed PR #1703 closed/merged and the new
PR #1699 HEAD matches the squash SHA.

The earlier fallback source candidate `9a8c06de...` is superseded.
The new exact SHA has not yet passed full local release quality gate,
MyDevil source preflight, frontend build, or runtime acceptance.
Run `auto --plan` / `auto --prepare` with the new SHA, then develop
approved DEV-only staged runtime activation and recovery.

Separate master-targeted security PR #1702 remains Draft; protected
master has mandatory GitHub statuses unavailable under the current
Actions billing lock, which must not be bypassed. Historical real
secrets (if still active) must be rotated/revoked privately.
No application, database, MyDevil runtime, or production release was
modified by the integration.


## Mac exact-SHA quality gate and MyDevil source preflight PASS (2026-11-13)

The owner supplied the complete terminal log for release candidate
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`, after #1703 security
integrated into #1699:

- Automatic fallback selected `mydevil`, 10/10 channel tests PASS.
- Local toolchain Node 22 / pnpm 10.14 PASS. Git-range Gitleaks
  (60 commits) and full current-tree Gitleaks: 0 findings.
- Frozen workspace install succeeded. Warning: pnpm ignored optional/
  native package build scripts; FreeBSD native runtime not yet verified.
- Backend typecheck PASS; Jest 71 suites, 650 passing tests, 3 skipped.
- Panel typecheck PASS; Jest 130 suites, 655 passing tests.
- Next.js panel build PASS, static generation completed and release data
  emitted by `generate-next-data`.
- `LOCAL_RELEASE_GATE=PASS` for full release SHA; commit branch pin matched;
  `SOURCE_CHECK=PASS`, `SOURCE_SYNC=PASS`,
  `MANUAL_DEV_PREFLIGHT=PASS target=panel`.
- Source on MyDevil:
  `$HOME/.salonbw-manual/sources/77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.
- Running DEV panel remains on `beee6b40e1112765cb07d481bae8f66e72cef543`.
- `POSTGRES_E2E=UNVERIFIED`, `HOSTED_DEV_UAT=UNVERIFIED`,
  `DEPLOYMENT=NOT_STARTED`. No runtime mutation or restart.

Source review of master `.github/workflows/deploy.yml` found that
the existing panel workflow uploads and extracts the frontend bundle
*into the live app directory*, installs npm production dependencies
there and subsequently restarts Passenger. This existing flow is not
an isolated prepare+activate transaction. Implementing fallback via
the same in-place sequence without additional guards is unsafe.

Added `scripts/mydevil/manual-dev-runtime-inventory.sh` for
read-only DEV app-root/Passenger symlink/entrypoint/build/size/private-
config-presence assessment, plus an offline fixture test under
`scripts/ci/manual-dev-runtime-inventory.test.sh`. Both were committed
but have **not yet been run** by the owner. They do NOT enable
`mydevil --execute`.

Next: validate offline inventory tests, run it over SSH for panel,
review persistent-data inventory, plan isolated staging, safe activation,
failure recovery and UAT. Production remains unchanged.


## MyDevil DEV panel runtime inventory PASS (operator output, 2026-11-13)

After fixing the Bash parse error, the operator executed
`scripts/ci/manual-dev-runtime-inventory.test.sh` and a read-only
SSH inventory against the exact source SHA
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`:

- `DEV_RUNTIME_INVENTORY_OFFLINE_CHECK=PASS`
- `DEV_RUNTIME_INVENTORY=PASS target=panel`
- Live app root: `/home/vetternkraft/apps/nodejs/panelbw_dev`
- Domain: `dev-panel.salon-bw.pl` (symlink verified to app root)
- Passenger entrypoint: `app.cjs`
- Live app size: 445143 KiB (~435 MiB)
- Current live release SHA: `beee6b40e1112765cb07d481bae8f66e72cef543`
- Current BUILD_ID: `GYCcIVh7fFE3Nllz0OY8X`
- Private runtime config exists; node_modules exists
- App root is a regular directory, **not** a symlink
- `RUNTIME_MUTATIONS=NONE`

**Non-negotiable remaining blockers:** `PERSISTENT_DATA_MAP=UNVERIFIED`,
`RELEASE_ROLLBACK=NOT_IMPLEMENTED`. A SHA-specific source directory
and successful local build do not constitute a deploy. Replacing the
real app directory or mutating its in-use files without a live-data
audit and reviewed recovery mechanism remains NO-GO.

Next: add targeted read-only file/persistence topology diagnostics and
verify safe handling of unexpected entries, symlinks and release-state
files. Then design a separate DEV-only staging, pre-activation, switch,
post-activation verification and recovery gate. No PROD or DEV
runtime mutation is authorized at this point.


## Read-only DEV panel persistent-data audit implemented (not executed)

Implemented `scripts/mydevil/manual-dev-persistence-audit.mjs`
and `scripts/ci/manual-dev-persistence-audit.test.mjs`
on the fallback branch. The audit verifies the pinned source receipt,
checks that the domain symlink resolves to the expected real app root,
and reports **only fixed metadata labels** for common mutable paths
(`tmp`, `storage`, `uploads`, `public/media`, diagnostics,
legacy env files, etc.). It also compares live `public` entries with
the source `apps/panel/public` tree to count untracked files,
directories and symlinks, without printing their names or contents.
It follows no public-data symlinks and bounds the directory traversal.
All status output remains `PERSISTENT_DATA_MAP=REVIEW_REQUIRED` and
`RELEASE_ROLLBACK=NOT_IMPLEMENTED`: the audit does **not** make a
replacement safe by itself.

The regression tests cover synthetic upload/secret content not leaking
into output, read-only operation, rejection of a redirected domain,
rejection of a forged source SHA receipt, and rejection of a symlinked
live app root.

These new audit/tests have been committed but **not yet run** on Mac
or MyDevil. The earlier `DEV_RUNTIME_INVENTORY=PASS` remains valid.
No runtime activation, database modification or production write.


## Owner-authorized single predeploy panel archive created (2026-11-13)

Operator ran on MyDevil through `ssh devil 'bash -s'` with `umask 077`:
- `tar -czf` from `$HOME/apps/nodejs/panelbw_dev` into
  `/home/vetternkraft/.salonbw-manual/panelbw_dev-predeploy-20261113-192747.tar.gz`.
- `tar -tzf` returned success.
- `BACKUP=PASS`; archive mode `-rw-------` (`0600`), size ~90 MiB.
- Running DEV panel and production were not restarted or modified.

This is **one explicit owner-requested manual archive** of the existing
runtime (includes private configuration). It supersedes the earlier
default recommendation to avoid any additional backup; do not schedule
further archives or invoke redundant snapshot mechanisms.

**Important scope:** `RUNTIME_MUTATIONS=NONE` from operator output
means no *live app* mutation, not zero server writes—the archive was
created. Listing a gzip tar verifies readability/decompression, not an
atomic filesystem snapshot while writes are ongoing. Archive integrity
does not guarantee restore correctness. Never publish/transfer the archive
outside the private hosting account and do not perform an unapproved
restoration over the live app.

Next: read-only persistence inventory, then prepare new release in
a separate directory, without mutating `panelbw_dev`, and verify
reviewed app-level recovery and post-deploy smoke/UAT.


## Mac build succeeded; MyDevil stage blocked on TAR links (2026-11-13)

Operator provided output for the exact SHA
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`:

- Manual package offline check: PASS.
- Mac Gitleaks full-current-tree and 60-commit checks: 0 findings.
- Frozen pnpm dependencies and Next 15.5.28 build: PASS.
- `PANEL_PACKAGE=PASS`; local artifact about 2720 KiB, private path
  `$HOME/.salonbw-manual/artifacts/panel-dev-<SHA>.tar.gz`.
- The operator transferred that artifact into MyDevil's private
  `$HOME/.salonbw-manual/incoming` directory.
- `MANUAL_DEV_PANEL_STAGE=BLOCKED reason=archive-contains-links`.
  The FreeBSD stage deliberately rejects symlink and hardlink TAR
  entries before extraction. Therefore **npm22 install, staged release
  publication, app activation and Passenger restart did not occur**.
- Existing 90 MiB one-time live-panel archive and live runtime remain
  unaffected. Mac/host incoming archive files are staging artifacts,
  not running applications.

Root-cause candidate discovered during source review: the Mac packager
previously copied `packages/api` wholesale **after**
`pnpm install`, potentially including pnpm-created
`packages/api/node_modules` symlinks pointing outside the release.
Now packaging only copies `packages/api/package.json` and `src`.
An additional fail-closed module
`scripts/ci/flatten-internal-bundle-links.mjs` expands **only
validated intra-bundle links** and breaks hardlinks; unsafe,
dangling, cyclic and external links are rejected. The Mac packager
also rejects its own TAR if it still contains links; the FreeBSD
stage's link rejection remains unchanged. Seven synthetic Node tests
were added for link handling; the offline package test invokes them.

Added `scripts/ci/retry-manual-dev-panel-stage.sh` to build a fresh
artifact into a unique Mac directory, upload to a unique temporary
MyDevil incoming filename, verify its SHA-256 on MyDevil, replace
only the rejected incoming artifact atomically and invoke the
**isolated** staging script. No app, backup or production path is
rewritten by this wrapper.

**The new fix and tests have been committed but NOT yet executed on
Mac or MyDevil.** Never claim staging or deployment PASS until
verified. Local UAT, PostgreSQL E2E, runtime activation and rollback
remain pending.


## Isolated MyDevil V18 staging PASS (operator output, 2026-11-13)

The operator reran `scripts/ci/retry-manual-dev-panel-stage.sh` at
V18 candidate SHA `77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.
Reported output proves:

- Link normalization fixture tests 7/7 PASS, packaging QA PASS.
- Gitleaks history (60 commits) and current tree: 0 findings.
- Frozen pnpm install on Mac, Next.js 15.5.28 production build: PASS.
- Mac TAR link normalization: 0 remaining symbolic/directory/hardlink
  entries; new artifact created with SHA-256
  `7b223842e3e2aa54e2f449b0c01b2cb82846d5b4f385fdc54019d5139f4cd849`.
- MyDevil incoming transfer preflight and remote SHA-256 verification:
  PASS; atomic replacement of the previously rejected *incoming* TAR.
- FreeBSD `npm22 install --omit=dev --ignore-scripts`: 278 packages
  installed in an isolated candidate directory.
- `MANUAL_DEV_PANEL_STAGE=PASS` and `DEV_PANEL_STAGING=PASS`.
- Candidate runtime:
  `/home/vetternkraft/.salonbw-manual/staged-panel/77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.
- The source/current DEV app remains `beee6b40e1112765cb07d481bae8f66e72cef543`.
- `PASSENGER_RESTART=NOT_STARTED`; `ACTIVATION=NOT_STARTED`;
  `LIVE_PANEL_DEPLOYMENT=NOT_STARTED`, no production changes.

**Next gate is a real runtime smoke, not another install.** Added
`scripts/mydevil/manual-dev-panel-stage-smoke.mjs`, which launches
the staged app in an isolated loopback-only Node22 child process;
it probes `/__release.json`, `/auth/login` and unauthenticated
`/studio-v18` redirect using DEV-only private gateway credentials.
The probe emits only status labels, does not print response bodies
or credentials, terminates its child and does NOT restart Passenger.
Four offline fixture tests validate its fail-closed behavior and
are now included in `manual-dev-panel-packaging.test.sh`.

**The new smoke code and tests are committed but have not yet run.**
Before any live switch, require the stage smoke PASS, a reviewed
two-rename activation/recovery sequence for the real non-symlink app
root, a separate emergency recovery path in case of SSH interruption,
and post-activation live-sha/browser verification. Retain the single
owner-created 90 MiB runtime archive; do not create another backup.


## Staged DEV runtime startup blocked after successful offline QA (operator, 2026-11-13)

The operator ran the reviewed offline activation test suite against
`ops/github-mydevil-source-fallback-20261113` HEAD
`d1062f796d844ea70c0eb3d254b911bd0fbbb596`:

- Link handling: **7/7 PASS**.
- Synthetic staged HTTP: **4/4 PASS**.
- Activation/restart/rollback simulated cases: **10/10 PASS**.
- `MANUAL_DEV_PANEL_PACKAGE_OFFLINE_CHECK=PASS`.
- Real MyDevil staged runtime smoke stopped with
  `DEV_PANEL_STAGE_SMOKE=BLOCKED reason=staged-runtime-exited`.
- The command ran under `set -e`: read-only `--plan` was **not reached**.
- **NO** Passenger restart, live DEV swap, PostgreSQL write, new backup
  or PROD change. The 90 MiB predeploy archive remains unchanged.

Root cause is not yet verified. The existing smoke script deliberately
discarded child process stderr/stdout, so the original run cannot
distinguish missing npm dependency, native load error, JS initialization
error, port failure, or an external resource limit.

Added `scripts/mydevil/manual-dev-panel-startup-diagnose.mjs`
to resolve a fixed list of runtime packages and launch the same staged
`app.cjs` on 127.0.0.1 with output buffered **in memory** and mapped
to fixed, non-sensitive diagnostics. It does not print child logs,
stack traces, runtime config, paths or secrets. A new four-test
`manual-dev-panel-startup-diagnose.test.mjs` suite checks categories,
sanitization and a synthetic child failure. Wired into
`scripts/ci/manual-dev-panel-packaging.test.sh`.

**New diagnostics/tests are committed but not yet run.**
Obtain results before any runtime-repair or activation. The
`--plan` may be run separately and read-only to find independent
activation blockers, but `--execute` remains strictly NO-GO until
real staged HTTP smoke is PASS.


## Expanded real-host staged Next diagnostics after 4/4 local tests (2026-11-13)

Owner supplied:

- `manual-dev-panel-startup-diagnose.test.mjs`: 4/4 PASS.
- Live MyDevil staged runtime: all 10 named module imports
  **resolve** (not necessarily initialize) successfully.
- Staged child process exited with code 1, no HTTP response:
  `STAGED_PROCESS_EXIT_CLASS=UNCLASSIFIED_EXIT`.
- Read-only activation `--plan` PASS: old SHA
  `beee6b40e1112765cb07d481bae8f66e72cef543`; staged SHA
  `77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`.
- No Passenger restart, activation, rollback, database mutation or PROD write.

This **does not** prove dependencies are functional: resolve checks only
verify that module entrypoints can be located. The actual Next startup
error remains unknown. Prior Next.js workflow specially creates a
`.next/server/font-manifest.json` fallback when missing, and the
manually prepared bundle did not perform that step. This is a
candidate hypothesis **not an established root cause**.

Enhanced `manual-dev-panel-startup-diagnose.mjs` to report fixed-label
existence results for Next config/build/route/SSR/font manifests, and
classify missing runtime files, Next build identity, SWC platform,
module format and permission errors. New classifier tests were added.
The new diagnostic has **not yet run**. Any missing manifest is
an investigative signal rather than automatic justification for
modifying the existing staged runtime.

Do not attempt `--execute` until the real-stage `app.cjs` boot and
HTTP V18 smoke are PASS. Single owner-created 90 MiB predeploy archive
remains intact; no redundant backups.


## Real MyDevil V18 startup: permission denied + missing font manifest (2026-11-13)

Owner's latest output for V18 SHA
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`:

- Expanded diagnostic unit tests: 5/5 PASS.
- Runtime dependencies: all 10 resolvable; this is not proof of loading.
- Next `.next/server/font-manifest.json`: **MISSING**. The regular
  Actions deployment workflow explicitly generates an empty `[]`
  fallback when absent. That fallback was omitted from the manual
  V18 packager and is a compatibility gap, but **not proven** as the
  reason for this exit.
- Other 10 named config, build and manifest paths: FOUND.
- Staged process exits with code 1 before HTTP:
  `STAGED_PROCESS_EXIT_CLASS=RUNTIME_PERMISSION_DENIED`.
  The blocked *operation/target* have not yet been identified.
- Passive `--plan` previously passed. No Passenger restart,
  live DEV deployment, DB modification or PROD change.

Another source-code discrepancy: `apps/panel/app.cjs` computes
a `HOSTNAME` value, but the HTTP server calls
`.listen(currentPort, callback)` **without** the hostname. Node's
default can attempt a wildcard-address bind, even though the isolated
test launches with `HOSTNAME=127.0.0.1`. Whether FreeBSD/MyDevil
rejects wildcard listen remains unverified.

Expanded the read-only, sanitized staged startup diagnostic:
- Probe binding to `127.0.0.1` and `0.0.0.0` with immediately
  closed empty listeners; output only `PASS`, `PERMISSION_DENIED`
  or `UNAVAILABLE`.
- Classify the failing process's denied syscall
  (`LISTEN`, `BIND`, `OPEN`, `MKDIR`, etc.) and the target class
  (`WILDCARD_ADDRESS`, `NEXT_BUILD`, etc.) using fixed labels only.
- Mark `STAGED_ENTRYPOINT_LISTEN=HOST_OMITTED` when the app source
  has the implicit-host pattern.
- Unit coverage asserts classification and that no raw error/secret
  content is emitted.

**This new diagnostic is committed but not yet executed.** Do not
modify the approved SHA artifact, write missing manifests blindly,
or switch live paths until the syscall and target hypothesis is
checked. The one-time owner tar archive stays untouched.


## Regression correction: synthetic missing module is not an OS permission denial

Operator reran the expanded diagnostic at fallback branch HEAD
`09cde778c31b5ab3639307cff729cfe8fb9efc0c` and reported
5/6 passing local checks. The failing fixture intentionally makes
a synthetic Node process emit `Cannot find module 'styled-jsx'`;
the diagnostic correctly reports `STAGED_DENIED_OPERATION=NOT_DETECTED`
and `STAGED_DENIED_TARGET=NOT_DETECTED`. The test incorrectly asserted
`STAGED_DENIED_OPERATION=UNKNOWN`.

Fixed the incorrect test expectation and added a target assertion in
commit `7ae76636c07bec3e55854b1454f5085c8ce6e639`.
Only a test file was changed. **The corrected suite has NOT yet been
run**, and the shell's `set -e` prevented the latest remote diagnostics
from running. No new MyDevil startup information or change to
DEV/PROD app state is available. The previous real-host staged process
still exits code 1 with `RUNTIME_PERMISSION_DENIED`, and
`font-manifest.json` is missing. Activating remains NO-GO.


## Resolved diagnostic cause; source-level staging bind change awaiting host validation

The owner ran the expanded diagnostics after the local fixture correction:
- Synthetic local diagnostic tests **6/6 PASS**.
- On MyDevil: 10 runtime modules resolved; required Next build files
  present except `.next/server/font-manifest.json`.
- Throwaway TCP binds to both `127.0.0.1` and `0.0.0.0`: PASS.
- The unmodified `app.cjs` invoked `.listen(currentPort)` without
  its computed hostname. Staged child exits code 1 with
  `STAGED_DENIED_OPERATION=LISTEN`, target `WILDCARD_ADDRESS`,
  and zero HTTP availability. No Passenger restart or live mutation.

Node.js v22 docs: omitted `host` defaults to the IPv6 unspecified
address when available, or IPv4 unspecified otherwise. The
staged-runner's `HOSTNAME=127.0.0.1` does **not** change the behavior
of `.listen(port)`. Source:
https://nodejs.org/download/release/v22.23.3/docs/api/net.html

Applied a **source-level** change to draft PR #1699:
- `apps/panel/scripts/staged-listen-host.cjs` exports a guarded
  listen dispatcher that accepts only
  `SALONBW_STAGE_LOOPBACK_HOST=127.0.0.1`, and only when both APP_ENV
  and NEXT_PUBLIC_DEPLOYMENT_ENV are `development`.
- `apps/panel/app.cjs` uses the dispatcher. In regular DEV and
  production Passenger start, it invokes the original
  `server.listen(port, callback)` unchanged.
- Six source fixture tests cover default Passenger behavior, safe
  loopback mode, invalid hosts and production denial.

Manual ops PR #1701 changes:
- Real staged smoke and safe diagnosis both explicitly opt in to
  the loopback flag, which is **never saved in private runtime JSON**.
- The packager now restores the `font-manifest.json` fallback
  already used by the existing GitHub Actions workflow, and runs
  syntax + six source helper regression checks before building.
- The remote stage rejects missing font compatibility or loopback
  helper files.

**IMPORTANT:** The new source HEAD is a different immutable SHA
than `77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`; the
existing staged runtime and archive remain untouched. This
changes the exact-SHA release candidate. New SHA must pass
complete source sync, Gitleaks, Node tests, reproducible Mac build,
FreeBSD npm staging, real HTTP staging smoke, API compatibility
and independent review before live activation. GitHub Actions/PG
and hosted browser tests remain blocked or pending. Do NOT
activate yet.
