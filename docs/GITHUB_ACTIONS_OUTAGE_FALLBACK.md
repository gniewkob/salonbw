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

A single launcher now decides the channel. It inspects the **latest CI** run,
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
The current fallback path is **prepare-only**, not a replacement for
Gitleaks, application tests, actual FreeBSD runtime dependency installation,
database migration approval, Passenger restart or live smoke tests.

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
