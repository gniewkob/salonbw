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