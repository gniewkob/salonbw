# GitHub as source transport when Actions is blocked

Status: 2026-11-13, **phase 1 (safe source synchronization)**. This document
does not authorize deployment to a live environment or bypass security gates.

## Decision

When GitHub Actions cannot start because the GitHub account is billing-locked,
continue using GitHub for commits, branches, pull requests, reviews and Git fetch.
The Mac mini becomes the independent test/build machine and MyDevil fetches
specific code by immutable SHA. No GitHub Actions runner is needed for transfer.

Do NOT run git pull in a live Passenger application directory. The existing
.github/workflows/deploy.yml and scripts/deploy-environment.sh require Actions,
so neither is an emergency deployment method.

Source synchronization must be separated from runtime activation:

1. Mac: run local tests and typecheck, review changes, commit and push.
2. GitHub: retain exact SHA and review/approval trail.
3. MyDevil: fetch that exact SHA into an isolated checkout; check provider quota.
4. Independent build and stage of the selected application, on compatible Node
   22 and FreeBSD runtime. No macOS node_modules transfer.
5. A separately approved component-specific activation, Passenger restart,
   smoke test, live SHA check and failure recovery.

**Only steps 1-3 are provided by this first change.** Neither DEV nor PROD can
be claimed deployed until steps 4-5 are implemented and verified separately.

## Manual commands from the Mac mini

Use a reviewed version of the sync script from the fallback branch:

~~~bash
cd ~/Repos/salonbw
git fetch origin

# Existing local changes (including V18BookingDrawer.module.css) stay intact.
# A detached worktree avoids switching or stashing your current branch.
WORKTREE="$HOME/Repos/salonbw-fallback-$(date +%Y%m%d-%H%M%S)"
git worktree add --detach "$WORKTREE" origin/ops/github-mydevil-source-fallback-20261113
cd "$WORKTREE"

bash -n scripts/mydevil/git-source-sync.sh
bash scripts/ci/git-source-sync.test.sh

# Choose the exact reviewed and locally tested application commit.
BRANCH=fix/v18-calendar-reschedule-overlap-brand-20261112
SHA="$(git rev-parse "origin/$BRANCH^{commit}")"
HOST=vetternkraft@s0.mydevil.net

ssh -o BatchMode=yes "$HOST" bash -s -- "$BRANCH" "$SHA" --check \
  < scripts/mydevil/git-source-sync.sh
ssh -o BatchMode=yes "$HOST" bash -s -- "$BRANCH" "$SHA" --sync \
  < scripts/mydevil/git-source-sync.sh
~~~

Confirm that SHA is the exact **reviewed and tested commit**, not just the
latest remote branch revision. The script refuses if the branch moves between
approval and fetch. Source is prepared under:

    ~/.salonbw-manual/sources/<full-40-character-SHA>

It never writes into any apps/nodejs application root or domains/* path.
It uses a private Git mirror under ~/.salonbw-manual/git-source. An existing
source receipt is checked before reuse, and an unexpected symlink or origin
is rejected.

The public GitHub clone transport uses HTTPS without embedding credentials.
If this repository becomes private, use a separate reviewed read-only deploy
key instead of embedding a PAT in a command, script or git config.

## Quota, isolation and approval

The MyDevil source synchronization validates both devil info limits and
df -Pk HOME using the quota guard from current origin/master. Neither may
have less than 4 GiB available; unreadable reports fail closed. The DEV
provider quota policy originated in #1685. Never use df alone as a substitute
for the account allocation.

Never synchronize or activate a production release automatically because a
development commit was pushed. Production requires a reviewed master SHA,
separate explicit authorization, migration/backup compatibility, complete
local CI-equivalent evidence, rollback and production smoke verification.

For staging, preserve independent DEV database, auth gateway, dev_ cookies,
noindex and disabled outbound delivery. Avoid snapshot accumulation and
do not touch historical MyDevil snapshots or provider backups.

## Example local checks (run before review)

~~~bash
pnpm install --frozen-lockfile
pnpm --filter salonbw-backend test --runInBand
pnpm --filter salonbw-backend typecheck
pnpm --filter @salonbw/panel test --runInBand
pnpm --filter @salonbw/panel typecheck
pnpm --filter @salonbw/panel build
~~~

Local checks do not change GitHub required-check status. Record the SHA, date,
toolchain versions, test output, reviewer and exact decision in the PR. Avoid
publishing secrets or client data in logs.

## Production readiness of the fallback

The source sync script is deliberately insufficient for runtime deployment.
Before adding activation, inspect real MyDevil app roots, Passenger symlinks,
persistent files, free disk and FreeBSD dependency installation. Use staged
package extraction and local smoke/rollback proof for one DEV component first.
Review API migration state before API deploy; never auto-run destructive
migrations. Preserve the temporary booking/login restrictions on production.

Once the GitHub billing lock is removed, normal Actions can resume unchanged.

## Verification

- Local static syntax: bash -n scripts/mydevil/git-source-sync.sh
- Read-only remote check: --check (remote branch SHA, no host writes)
- Source transfer: --sync (separate checkout after provider quota preflight)
- No live application, runtime secret, database or domain changes in phase 1
- Manual DEV activation and real UAT are **not completed** by this document

## Phase 2: read-only DEV runtime preflight

Following successful SOURCE_SYNC=PASS, use the **existing isolated
fallback worktree**, not the Mac's dirty main SalonBW checkout:

~~~bash
WORKTREE="$HOME/Repos/salonbw-fallback-20261113-150958"
git -C "$WORKTREE" fetch origin
git -C "$WORKTREE" switch --detach origin/ops/github-mydevil-source-fallback-20261113
cd "$WORKTREE"

bash -n scripts/mydevil/manual-dev-preflight.sh
bash scripts/ci/manual-dev-preflight.test.sh

SHA="9a8c06de0bc57b4ad76fe551882a1b2c476b34ec"
HOST="vetternkraft@s0.mydevil.net"

ssh -o BatchMode=yes "$HOST" bash -s -- "$SHA" panel \
  < scripts/mydevil/manual-dev-preflight.sh
ssh -o BatchMode=yes "$HOST" bash -s -- "$SHA" api \
  < scripts/mydevil/manual-dev-preflight.sh
~~~

Read-only preflight verifies the source receipt and Git mirror object,
the currently approved master quota policy, provider and filesystem
4-GiB reserve, actual DEV Passenger app roots and canonical symlinks,
existing private runtime isolation, Node 22, and pnpm availability.
It does not print credentials or modify apps, databases, symlinks or
deployment artifacts. No production target is accepted.

The PNPM_STATUS result reports build tool readiness without trying to
install software in the account. A PASS from preflight is **not** build,
activation, migration, runtime smoke or business acceptance evidence.
When a check fails, fix the underlying DEV configuration under a
reviewed change before any activation.


## Unified routing (Actions or MyDevil)

A single launcher now decides the channel. It inspects the latest CI run
**for the exact requested release SHA** (GitHub Actions `head_sha` filter),
its job runner allocation, and exact GitHub check-run annotations. An Actions
failure caused by a real executed test is **not** classified as an account
billing lock. Unknown status/API failure blocks automatic selection.

For the currently reviewed V18 candidate:

~~~bash
WORKTREE="$HOME/Repos/salonbw-fallback-20261113-150958"
git -C "$WORKTREE" fetch origin
git -C "$WORKTREE" switch --detach origin/ops/github-mydevil-source-fallback-20261113
cd "$WORKTREE"

SHA=9a8c06de0bc57b4ad76fe551882a1b2c476b34ec
BRANCH=fix/v18-calendar-reschedule-overlap-brand-20261112

# No files or running services are modified.
bash scripts/deploy-channel.sh development panel "$BRANCH" "$SHA" auto --plan

# Executes the Actions dispatch preview OR prepares source through
# GitHub Git + SSH and runs the read-only MyDevil DEV preflight.
bash scripts/deploy-channel.sh development panel "$BRANCH" "$SHA" auto --prepare
~~~

For an operator-confirmed Actions billing outage, the channel can also be
chosen explicitly with mydevil instead of auto. This still cannot execute
a live application activation; manual activation is **NO-GO** until an
independently reviewed release script, smoke test and recovery policy exist.

The launcher executes the existing GitHub Actions
scripts/deploy-environment.sh **unchanged** when Actions is available.
The fallback `--prepare` first runs `local-release-gate.sh` in a disposable
worktree at the **exact release SHA**, including Gitleaks (current tree and new
commit range), pnpm frozen install, backend/panel unit tests and typechecks,
and a build of the selected target, before any MyDevil source transfer. It
still does **not** cover PostgreSQL concurrency/E2E, hosted browser acceptance,
FreeBSD runtime dependency installation, database migration approval, Passenger
restart, or live smoke tests. It is not equivalent to the complete hosted CI.

When the exact account billing-lock annotation disappears and an actual
GitHub runner can execute jobs again, the launcher automatically prefers
Actions. There is no persistent toggle or background polling, so each
invocation re-evaluates current evidence. Manual explicit mode is reserved
for diagnosed incidents; unknown failure must not be treated as billing lock.

Offline channel regression checks:

~~~bash
node --test scripts/ci/deployment-channel.test.mjs
bash scripts/ci/deploy-channel.test.sh
~~~

## Remaining release work

To make the fallback a **complete** deployment channel, extend this PR or
a follow-up with a reviewed local exact-SHA quality gate and a FreeBSD
component-specific staging/activation script. Preserve deployed runtime
secrets and data, keep current DEV provider quota checks, and only mark a
release PASS after health and current SHA have both been observed.
Development and production remain independently approved. Do not add a
cron that automatically publishes every feature-branch push or bypass a
required GitHub branch-protection check to merge a PR with failing CI.


## Local release prerequisites

The fallback quality gate needs **Node.js 22**, **pnpm 10.14.0**, and the
Gitleaks CLI on Mac mini (Homebrew: brew install gitleaks). The gate runs in
a temporary detached Git worktree for the candidate commit and removes that
worktree after testing; the operator's dirty SalonBW CSS worktree is not reset
or stashed. Gitleaks uses redacted output, scans the candidate tree, and checks
commits since the merge base with origin/master. It fails closed if a tool,
test, typecheck, build, or secret scan fails.

These tests are deliberately narrower than the full hosted CI. The backend
PostgreSQL race tests and browser UAT are still independent release gates,
and no GitHub required status check is spoofed or marked green.

A free Mac-based workflow has no GitHub-hosted Actions minutes. It does
consume local CPU/disk. Re-running an unchanged target SHA can be optimized
later with a reviewed local evidence cache, but any future cache must verify
the SHA, toolchain and policy revision before reuse.

Do not add a MyDevil MCP dependency just to execute the same SSH commands.
A future monitoring-only connector could use an allowlisted, read-only
interface; direct SSH remains the canonical deployment transport.


## Node.js 26 LTS migration (DEV first; production NOT changed)

Node.js 26 became LTS on October 28, 2026 and is supported by MyDevil
through node26/npm26. References:
- https://nodejs.org/en/about/previous-releases
- https://www.mydevil.net/nowosci/node-js-v26/
- https://pomoc.mydevil.net/Node.js/

The current deployment workflows still hard-code Node 22. Installing or
choosing Node 26 on Mac mini does NOT switch Passenger on MyDevil. In
particular, do not execute the MyDevil example for adding a NEW Node.js
site against an existing live production domain. Do not globally rewrite
the account's ~/bin/node or ~/bin/npm symlinks; all three DEV and three PROD
applications may share that account and could be affected simultaneously.

Current fallback policy:
- Default LOCAL_RELEASE_GATE uses Node 22, even when the Mac's default is
  Node 26. The resolver finds an existing Homebrew/node@22 or nvm Node 22
  without changing the operator's login shell.
- SALONBW_RELEASE_NODE_MAJOR=26 enables LOCAL COMPATIBILITY EVALUATION
  only. It does not give deployment authorization. Manual MyDevil
  --prepare refuses that override while DEV runtime remains Node 22.
- Do not change the existing CI NODE_VERSION=22 or production runtime until
  Node 26 has passed staged DEV application, native dependency and browser
  acceptance.

Read-only MyDevil host inventory (no runtime modifications):

~~~bash
ssh -o BatchMode=yes vetternkraft@s0.mydevil.net '
  set -eu
  echo "=== Available Node runtimes ==="
  command -v node22
  command -v node26
  node22 -v
  node26 -v
  npm22 -v
  npm26 -v

  echo "=== Current default Node and links (read-only) ==="
  command -v node || true
  node -v || true
  ls -ld "$HOME/bin/node" "$HOME/bin/npm" 2>/dev/null || true

  echo "=== Domain configuration inventory (read-only) ==="
  devil www list
'
~~~

Run an independent Mac compatibility evaluation with Node 26, without
touching the host or changing its default Node version:

~~~bash
WORKTREE="$HOME/Repos/salonbw-fallback-20261113-150958"
cd "$WORKTREE"
SHA="9a8c06de0bc57b4ad76fe551882a1b2c476b34ec"
SALONBW_RELEASE_NODE_MAJOR=26 \
  bash scripts/ci/local-release-gate.sh "$SHA" panel
~~~

DEV migration gates, in order:
1. Validate host-provided Node26/npm26, disk quota, and the exact current
   Passenger executable for each DEV domain. Verify there is a supported
   per-domain method to change it and a reversible prior configuration.
2. Validate builds under Node26 and perform clean FreeBSD installations
   of compatible runtime dependencies, including native sharp and bcrypt.
   Never deploy macOS node_modules to FreeBSD.
3. Stage and activate one isolated DEV application at a time (API, panel,
   landing) with a verified live SHA, the right DEV database/cookies/gateway,
   HTTP and browser regression tests, and recovery of the prior executable.
   Assess migrations and database backups separately.
4. Only after all DEV acceptance gates pass, review the production rollout:
   current production version, manual owner authorization, backup/recovery
   evidence, app-specific restart control, bookings/login blackout
   preservation, and controlled rollback for each production domain.

There is no approved one-command production Node26 upgrade today; do not
claim that compatibility testing or source transfer is equivalent to a
successful runtime migration. The GitHub Actions billing issue is orthogonal
and will not be fixed by changing Node majors.


## Secret-scan findings during fallback (fail closed)

If `local-release-gate.sh` reports `leaks found` from the
current-tree Gitleaks scan, the deployment MUST stop even when the commit
delta scan is clean. The gate now emits only the file path, line number
and Gitleaks RuleID, using a private temporary JSON report which is
deleted on exit. It intentionally omits `Secret`, `Match`, `Line`,
`Fingerprint` and other potentially sensitive fields.

Do not paste raw JSON reports, tokens, passwords or source excerpts into
PRs or chats. To reproduce the redacted diagnostic, fetch the latest
fallback branch and run:

~~~bash
bash -n scripts/ci/local-release-gate.sh
node --test scripts/ci/gitleaks-safe-report.test.mjs
bash scripts/ci/local-release-gate.sh   9a8c06de0bc57b4ad76fe551882a1b2c476b34ec panel
~~~

The final command runs only as far as the first failed gate. For the
current incident, commit-delta Gitleaks passed, while the source-tree
scan detected two findings, so no dependency install or MyDevil
activation was attempted. Treat both as **untriaged** until inspected.

Triage each finding privately: determine whether it is an active secret,
a historical example, or a synthetic test fixture. If real, revoke/rotate
it and remediate exposed history as appropriate; if false-positive,
document the precise evidence and propose a narrowly scoped, reviewed
exception. Do not weaken the global Gitleaks configuration or suppress
entire rules merely to unblock deployment. Commit-only allowlists do not
necessarily waive current-directory scan findings.


## Exact-SHA V18 candidate prepared — runtime activation remains NO-GO

Operator-provided Mac test and MyDevil log for V18 SHA
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb`:

- Fallback router: MYDEVIL selected; 10/10 unit tests.
- Gitleaks: 60 commits and current source tree scanned, 0 findings.
- pnpm frozen install at 10.14.0: successful on Mac Node 22.
- Backend: typecheck PASS, 71 suites / 650 tests PASS (3 skipped).
- Panel: typecheck PASS, 130 suites / 655 tests PASS.
- Next 15 production panel build: PASS, build metadata generated.
- Git source sync: PASS, exact immutable SHA stored in a private
  source directory; MyDevil DEV panel preflight: PASS.
- Running DEV panel remains on `beee6b40e1112765cb07d481bae8f66e72cef543`.
- Output explicitly states `DEPLOYMENT=NOT_STARTED`,
  `POSTGRES_E2E=UNVERIFIED`,
  `HOSTED_DEV_UAT=UNVERIFIED`.

The pnpm installer reports that build scripts for several optional/native
packages were ignored. Passing Mac unit tests and Next compile is **not
evidence** that native dependencies installed correctly on FreeBSD.
The existing GitHub workflow installs npm dependencies **inside the
live frontend app directory**, extracts the bundle there, and restarts
Passenger afterwards. Copying that sequence into fallback would expose
an incomplete runtime if the connection or install fails halfway.
Additionally, the DEV snapshotless decision on PR #1685 excludes
unreviewed automatic snapshot creation/rollback.

### Next read-only host inventory

The new script `scripts/mydevil/manual-dev-runtime-inventory.sh`
checks the actual DEV app directory, domain-to-app link, source receipt,
current Next BUILD_ID, application entrypoint, node_modules and private
config presence. It never reads/logs private values, modifies runtime,
changes a symlink, restarts Passenger, or creates backups.

~~~bash
WORKTREE="$HOME/Repos/salonbw-fallback-20261113-150958"
SHA=77a16d5e97f3c9d001d9e7c61f5b995ffee807bb
git -C "$WORKTREE" fetch origin
git -C "$WORKTREE" switch --detach \
  origin/ops/github-mydevil-source-fallback-20261113
cd "$WORKTREE"
bash scripts/ci/manual-dev-runtime-inventory.test.sh
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
  vetternkraft@s0.mydevil.net bash -s -- "$SHA" panel \
  < scripts/mydevil/manual-dev-runtime-inventory.sh
~~~

This new fixture test and real-host inventory have **not yet been run**.
A PASS only authorizes design of the next release stage, not deployment.

### Required before a manual DEV activation implementation

1. Verify the live root has no untracked persistent state that would
   be lost by replacing the app directory; keep the domain link stable.
2. Design immutable staging and a reversible, lock-guarded activation
   that preserves private runtime config and does not overwrite live
   app files during dependency installation.
3. Enforce current MyDevil provider AND filesystem quota checks before
   any host mutation; do not clean old snapshots to make room.
4. Build and package the panel in an isolated local directory, then
   install any needed native runtime dependencies on **FreeBSD**,
   without copying Mac native node_modules.
5. Rehearse failure cases (interrupted transfer, incomplete install,
   restart failure, SHA mismatch and smoke failure). Document recovery
   without assuming database rollback or creating implicit snapshots.
6. Review the approved release and independently verify live HTTP SHA,
   Basic Auth, API isolation and browser UAT before any `PASS`.
7. Keep production booking/login restrictions and all PROD runtime
   resources untouched.

**No direct MyDevil `--execute` is authorized by this phase.**


## Owner decision — provider-managed backups only (2026-11-13)

**Accepted:** MyDevil's native backup service is the only backup
mechanism for DEV/PROD persistent data. Do **not** create application
database dumps, duplicate application-directory snapshots, scheduled
backup jobs or a backup-on-every-deploy step.

Do **not** confuse an unchanged previous *immutable code release*
with a data backup: retaining an existing release directory for
a quick application-version rollback is allowed, provided it does not
duplicate persistent data, create snapshots or silently alter the
provider-managed retention policy.

For manual DEV rollout:

- Preserve existing persistent data and private runtime configuration
  in place. A read-only persistence inventory remains necessary to
  make sure replacement does not delete or overwrite either.
- Build and validate a new immutable code release separately, then
  activate only that release after reviewed checks.
- Reversion may switch back to an already existing compatible code
  release; no automatic DB downgrade or provider restore.
- When recovery requires actual data restoration, use the MyDevil
  provider's documented restore process as an **operator-authorized
  incident action**. Availability, consistency, age of recovery points
  and restore time must not be assumed from the mere existence of a
  backup service.
- Never delete existing snapshots, code releases or live data merely
  to free disk space without a separate retention approval.
- Production is excluded from the current fallback deployment scope.

**No code/data backups or restarts were initiated by documenting this
decision.** The manual DEV activation path remains unimplemented.


## Manual V18 panel packaging and isolated staging — implementation candidate

The operator's read-only persistence audit for release
`77a16d5e97f3c9d001d9e7c61f5b995ffee807bb` passed:
five fixture tests, no unexpected files in `public` or app root,
no public symlinks, and no typical upload/storage directories. Live
`tmp` and `.diagnostics` contain operational state and
are **not removed**. The live app is still on `beee6b40...`.

The owner created **one** private pre-deploy archive on the MyDevil host,
`panelbw_dev-predeploy-20261113-192747.tar.gz` (~90 MiB,
mode 0600), with `tar -tzf` PASS. No recurring backups or
database dumps are authorized.

The following scripts have been committed on PR #1701, but have NOT
yet been executed on Mac or MyDevil:

- `scripts/ci/package-manual-dev-panel.sh`: selects Node22
  and pnpm10.14.0 on Mac, checks exact branch SHA and Gitleaks, builds
  V18 in a disposable worktree, rewrites only the local
  `@salonbw/api` workspace dependency to the bundled
  file path, and produces a SHA256-pinned compressed bundle without
  runtime secrets or macOS native dependencies.
- `scripts/mydevil/manual-dev-panel-stage.sh`: validates the
  trusted source receipt, provider/filesystem quota, archive SHA256,
  release metadata, private DEV isolation, and installs npm22
  production runtime modules **only in a private staged directory**.
  It cannot restart Passenger or write to the live app.
- `scripts/ci/manual-dev-panel-packaging.test.sh`: syntax,
  argument and critical safety-boundary tests for both scripts.

**Neither script supports activation.** Never treat success at the
isolated staging gate as a live release. In particular, the new
release cannot be considered accepted until the existing fixed
`panelbw_dev` directory is swapped under a separately
reviewed, fail-safe activation procedure, and HTTP SHA plus DEV
Basic Auth, API isolation and browser UAT are proven.

Proposed sequence after offline QA:

1. Produce a Mac build artifact pinned to the unchanged V18 HEAD.
2. Transfer the artifact into private MyDevil `.salonbw-manual/incoming`
   over strict-host-key SSH; keep it out of web and Git paths.
3. Verify checksum, unpack and install dependencies to
   `.salonbw-manual/staged-panel/<SHA>` outside the live app.
4. Inspect staged bundle and DEV runtime compatibility, including
   FreeBSD-native packages.
5. Only after review, implement an activation that retains the
   original runtime and private config, has explicit failure recovery,
   uses the already approved owner archive as final-resort
   restoration, and does not alter PostgreSQL.

**Production is excluded. The staging script must not run as root or
point to a production domain.**
