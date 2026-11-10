#!/usr/bin/env bash
# All fixtures are disposable; no host MyDevil credentials or databases needed.
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd -P)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
export DEPLOY_ALLOWED_ROOT="$tmp"
export DEPLOY_RECOVERY_ROOT="$tmp/.private/recovery"
api="$tmp/apps/nodejs/api_salonbw_dev"
front="$tmp/apps/nodejs/panelbw_dev"
prod="$tmp/apps/nodejs/api_salonbw"
mkdir -p "$api/dist" "$api/node_modules" "$front/.next/static" "$front/public" "$front/node_modules" "$front/src" "$front/scripts" "$front/packages" "$prod"
printf 'api-old\n' > "$api/dist/main.js"
printf '{"version":"api-old"}\n' > "$api/package.json"
printf 'secret-old\n' > "$api/.env"
printf 'old-module\n' > "$api/node_modules/index.js"
printf 'old-entry\n' > "$api/app.js"
printf '{"version":"front-old"}\n' > "$front/package.json"
printf 'old-entry\n' > "$front/app.js"
printf 'old-config\n' > "$front/next.config.mjs"
printf 'old-js\n' > "$front/.next/static/old.js"
printf 'old-build\n' > "$front/.next/BUILD_ID"
printf 'old-public\n' > "$front/public/index.html"
printf 'old-module\n' > "$front/node_modules/index.js"
printf 'private-old\n' > "$front/.env.runtime.json"
printf 'old-source\n' > "$front/src/middleware.ts"
printf 'old-script\n' > "$front/scripts/run.sh"
printf 'old-package\n' > "$front/packages/index.js"

snapshot="$repo/scripts/mydevil/staging-release-snapshot.sh"
extract="$repo/scripts/mydevil/extract-frontend-bundle.sh"
bash -n "$snapshot" "$extract"
bash "$snapshot" prepare "$api" "synthetic01" api
bash "$snapshot" prepare "$front" "synthetic01" frontend
[[ -f "$DEPLOY_RECOVERY_ROOT/api_salonbw_dev/synthetic01/READY" ]]
[[ -f "$DEPLOY_RECOVERY_ROOT/panelbw_dev/synthetic01/READY" ]]
# The same token must never silently replace the known-good generation.
if bash "$snapshot" prepare "$api" "synthetic01" api >/dev/null 2>&1; then
  echo 'FAIL: duplicate backup overwrote prior generation' >&2
  exit 1
fi
# A production app path must not be snapshotted, restored, or finalized.
if bash "$snapshot" prepare "$prod" "synthetic02" api >/dev/null 2>&1; then
  echo 'FAIL: production snapshot allowed' >&2
  exit 1
fi

# Fail-first incident: invalid new frontend archive contains different
# package.json, config and entrypoint but lacks .next/static.
incomplete="$tmp/incomplete"
mkdir -p "$incomplete/.next" "$incomplete/src" "$incomplete/scripts"
printf '{"version":"front-new"}\n' > "$incomplete/package.json"
printf 'new-entry\n' > "$incomplete/app.js"
printf 'new-config\n' > "$incomplete/next.config.mjs"
printf 'new-source\n' > "$incomplete/src/new.ts"
printf 'new-script\n' > "$incomplete/scripts/new.sh"
tar -czf "$front/deploy.tar.gz" -C "$incomplete" .
if bash "$extract" "$front" >/dev/null 2>&1; then
  echo 'FAIL: extractor accepted incomplete tar archive' >&2
  exit 1
fi
grep -qx '{"version":"front-old"}' "$front/package.json"
grep -qx 'old-entry' "$front/app.js"
grep -qx 'old-config' "$front/next.config.mjs"
grep -qx 'old-source' "$front/src/middleware.ts"
test ! -e "$front/src/new.ts"
test ! -e "$front/scripts/new.sh"
test -f "$front/.next/static/old.js"
test -f "$front/node_modules/index.js"

# A fully extracted frontend may still fail its subsequent npm install or
# Passenger warmup. Snapshot-based rollback must restore the entire runtime.
complete="$tmp/complete"
mkdir -p "$complete/.next/static" "$complete/public" "$complete/src" "$complete/packages"
printf '{"version":"front-new"}\n' > "$complete/package.json"
printf 'new-entry\n' > "$complete/app.js"
printf 'new-config\n' > "$complete/next.config.mjs"
printf 'new-build\n' > "$complete/.next/BUILD_ID"
printf 'new-js\n' > "$complete/.next/static/new.js"
printf 'new-public\n' > "$complete/public/index.html"
printf 'new-source\n' > "$complete/src/middleware.ts"
printf 'new-package\n' > "$complete/packages/index.js"
tar -czf "$front/deploy.tar.gz" -C "$complete" .
bash "$extract" "$front" >/dev/null
grep -qx '{"version":"front-new"}' "$front/package.json"
# Extract deliberately clears old node_modules; simulate npm recreating it.
mkdir -p "$front/node_modules"
printf 'new-module\n' > "$front/node_modules/index.js"
printf 'private-new\n' > "$front/.env.runtime.json"
printf 'generated-lockfile\n' > "$front/package-lock.json"
# Missing declared file must fail before removing the new, functioning app.
front_snapshot="$DEPLOY_RECOVERY_ROOT/panelbw_dev/synthetic01"
mv "$front_snapshot/files/.env.runtime.json" "$tmp/withheld-frontend-env"
if bash "$snapshot" rollback "$front" "synthetic01" frontend >/dev/null 2>&1; then
  echo 'FAIL: frontend snapshot accepted a missing file' >&2
  exit 1
fi
grep -qx 'new-entry' "$front/app.js"
test -f "$front/.next/static/new.js"
mv "$tmp/withheld-frontend-env" "$front_snapshot/files/.env.runtime.json"
# Unknown manifest element must also fail without modifying runtime.
cp "$front_snapshot/present" "$tmp/valid-frontend-manifest"
printf 'unknown-entry\n' >> "$front_snapshot/present"
if bash "$snapshot" rollback "$front" "synthetic01" frontend >/dev/null 2>&1; then
  echo 'FAIL: frontend snapshot accepted an unknown manifest entry' >&2
  exit 1
fi
grep -qx 'new-entry' "$front/app.js"
cp "$tmp/valid-frontend-manifest" "$front_snapshot/present"
bash "$snapshot" rollback "$front" "synthetic01" frontend
grep -qx '{"version":"front-old"}' "$front/package.json"
grep -qx 'old-entry' "$front/app.js"
grep -qx 'old-js' "$front/.next/static/old.js"
grep -qx 'old-build' "$front/.next/BUILD_ID"
grep -qx 'old-module' "$front/node_modules/index.js"
grep -qx 'private-old' "$front/.env.runtime.json"
grep -qx 'old-public' "$front/public/index.html"
grep -qx 'old-source' "$front/src/middleware.ts"
grep -qx 'old-script' "$front/scripts/run.sh"
grep -qx 'old-package' "$front/packages/index.js"
test ! -e "$front/package-lock.json"
test ! -e "$front/.next/static/new.js"

# API rsync --delete, npm install and .env generation must also be reversible.
printf 'api-new\n' > "$api/dist/main.js"
printf '{"version":"api-new"}\n' > "$api/package.json"
printf 'secret-new\n' > "$api/.env"
printf 'new-module\n' > "$api/node_modules/index.js"
printf 'new-entry\n' > "$api/app.js"
printf 'generated-lockfile\n' > "$api/package-lock.json"
# Incomplete API snapshot must never remove the currently running dist.
api_snapshot="$DEPLOY_RECOVERY_ROOT/api_salonbw_dev/synthetic01"
mv "$api_snapshot/files/dist" "$tmp/withheld-api-dist"
if bash "$snapshot" rollback "$api" "synthetic01" api >/dev/null 2>&1; then
  echo 'FAIL: API snapshot accepted a missing directory' >&2
  exit 1
fi
grep -qx 'api-new' "$api/dist/main.js"
mv "$tmp/withheld-api-dist" "$api_snapshot/files/dist"
bash "$snapshot" rollback "$api" "synthetic01" api
grep -qx 'api-old' "$api/dist/main.js"
grep -qx '{"version":"api-old"}' "$api/package.json"
grep -qx 'secret-old' "$api/.env"
grep -qx 'old-module' "$api/node_modules/index.js"
grep -qx 'old-entry' "$api/app.js"
test ! -e "$api/package-lock.json"
# Rollback is repeatable because the private snapshot is retained.
bash "$snapshot" rollback "$api" "synthetic01" api >/dev/null
bash "$snapshot" finalize "$api" "synthetic01" api
test ! -e "$DEPLOY_RECOVERY_ROOT/api_salonbw_dev/synthetic01"
printf 'PASS: corrupt snapshot refusal before writes, runtime restore, API restore, production path guard\n'
# ---------------------------------------------------------------------------
# prune: bounded retention for DEV snapshots (issue #1673).
store="$DEPLOY_RECOVERY_ROOT/panelbw_dev"
for t in 97-1 99-1 100-1 101-1 102-1 103-1 104-1 105-1 106-1 107-1; do
  bash "$snapshot" prepare "$front" "$t" frontend >/dev/null
done
touch "$store/102-1/KEEP"                                # explicit pin
touch "$store/99-1/ROLLED_BACK"                          # recent rollback pin
printf '/elsewhere\n' > "$store/100-1/destination"       # identity mismatch
ln -s "$store/105-1" "$store/98-1"                       # symlinked entry
mkdir "$store/uat-manual" "$store/.pending-96-1-123"     # manual + pending
export DEPLOY_SNAPSHOT_PROTECT="101-1"

out="$(bash "$snapshot" prune "$front" 106-1 frontend)"
for line in 'KEEP 107-1 (newer than current run)' 'KEEP 106-1 (newest 3)' 'KEEP 105-1 (newest 3)' \
  'KEEP 104-1 (newest 3)' 'KEEP 102-1 (KEEP marker)' 'KEEP 101-1 (DEPLOY_SNAPSHOT_PROTECT)' \
  'KEEP 99-1 (used by rollback in last 7 days)' 'KEEP uat-manual (not a run token)' \
  'KEEP synthetic01 (not a run token)' 'SKIP 100-1 (identity markers invalid; left for manual review)' \
  'SKIP 98-1 (identity markers invalid; left for manual review)'; do
  grep -qxF "$line" <<< "$out" || { echo "FAIL: prune output missing: $line" >&2; echo "$out" >&2; exit 1; }
done
grep -q '^WOULD-DELETE 103-1 ' <<< "$out" && grep -q '^WOULD-DELETE 97-1 ' <<< "$out" || { echo 'FAIL: expected candidates' >&2; exit 1; }
grep -q 'candidates=2 skipped=2' <<< "$out" || { echo 'FAIL: prune summary' >&2; exit 1; }
grep -q 'NOTICE 1 .pending' <<< "$out" || { echo 'FAIL: pending not reported' >&2; exit 1; }
# Dry-run must not delete anything.
test -d "$store/103-1" && test -d "$store/97-1" && test ! -e "$DEPLOY_RECOVERY_ROOT/prune.log"

bash "$snapshot" prune "$front" 106-1 frontend --execute >/dev/null
test ! -e "$store/103-1" && test ! -e "$store/97-1"
for t in 99-1 100-1 101-1 102-1 104-1 105-1 106-1 107-1 uat-manual synthetic01 .pending-96-1-123; do
  test -e "$store/$t" || { echo "FAIL: prune removed protected $t" >&2; exit 1; }
done
test -L "$store/98-1" && test -d "$store/105-1/files"
[[ "$(wc -l < "$DEPLOY_RECOVERY_ROOT/prune.log")" -eq 2 ]]
# Other apps are never touched by a panel prune.
test -d "$DEPLOY_RECOVERY_ROOT/api_salonbw_dev"
unset DEPLOY_SNAPSHOT_PROTECT

# Guard rails.
if DEPLOY_SNAPSHOT_KEEP=1 bash "$snapshot" prune "$front" 106-1 frontend >/dev/null 2>&1; then
  echo 'FAIL: keep below 2 accepted' >&2; exit 1
fi
if bash "$snapshot" prune "$front" 555-1 frontend >/dev/null 2>&1; then
  echo 'FAIL: prune without a valid current snapshot' >&2; exit 1
fi
if bash "$snapshot" prune "$front" synthetic01 frontend >/dev/null 2>&1; then
  echo 'FAIL: prune accepted a non-run current token' >&2; exit 1
fi
if bash "$snapshot" prune "$prod" 106-1 api >/dev/null 2>&1; then
  echo 'FAIL: production prune allowed' >&2; exit 1
fi
if bash "$snapshot" finalize "$front" 106-1 frontend --execute >/dev/null 2>&1; then
  echo 'FAIL: unexpected flag accepted' >&2; exit 1
fi
if DEPLOY_SNAPSHOT_PROTECT='*' bash "$snapshot" prune "$front" 106-1 frontend >/dev/null 2>&1; then
  echo 'FAIL: glob accepted in protect list' >&2; exit 1
fi

# Shared lock: a live holder blocks, a dead holder is reclaimed.
sleep 30 & holder=$!
mkdir "$DEPLOY_RECOVERY_ROOT/.lock"; printf '%s\n' "$holder" > "$DEPLOY_RECOVERY_ROOT/.lock/pid"
if DEPLOY_SNAPSHOT_LOCK_WAIT=0 bash "$snapshot" prune "$front" 106-1 frontend >/dev/null 2>&1; then
  echo 'FAIL: prune ignored a live lock' >&2; exit 1
fi
if DEPLOY_SNAPSHOT_LOCK_WAIT=0 bash "$snapshot" prepare "$front" 108-1 frontend >/dev/null 2>&1; then
  echo 'FAIL: prepare ignored a live lock' >&2; exit 1
fi
kill "$holder"; wait "$holder" 2>/dev/null || true
DEPLOY_SNAPSHOT_LOCK_WAIT=0 bash "$snapshot" prune "$front" 106-1 frontend >/dev/null
test ! -e "$DEPLOY_RECOVERY_ROOT/.lock"
echo 'staging snapshot prune: PASS'
