#!/usr/bin/env bash
# Source-locked, read-only MyDevil DEV preflight. Never changes a live runtime.
set -euo pipefail

usage() {
  echo "Usage: bash manual-dev-preflight.sh <40-char-sha> <api|panel|landing>" >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
release_sha="$1"
target="$2"
[[ "$release_sha" =~ ^[a-f0-9]{40}$ ]] || usage

case "$target" in
  api)
    domain="dev-api.salon-bw.pl"
    app="api_salonbw_dev"
    required_private=".env"
    ;;
  panel)
    domain="dev-panel.salon-bw.pl"
    app="panelbw_dev"
    required_private=".env.runtime.json"
    ;;
  landing)
    domain="dev.salon-bw.pl"
    app="salonbw"
    required_private=".env.runtime.json"
    ;;
  *)
    usage
    ;;
esac

root="$HOME/.salonbw-manual"
source_dir="$root/sources/$release_sha"
mirror="$root/git-source"
app_dir="$HOME/apps/nodejs/$app"
domain_link="$HOME/domains/$domain/public_nodejs"

fail() {
  echo "MANUAL_DEV_PREFLIGHT=BLOCKED target=$target reason=$1" >&2
  exit 1
}
[[ ! -L "$root" && ! -L "$source_dir" && ! -L "$app_dir" ]] ||
  fail "unexpected-symlink"
[[ -d "$source_dir" && -d "$mirror/.git" ]] ||
  fail "source-not-synchronized"
[[ -f "$source_dir/.salonbw-source-sha" ]] ||
  fail "source-receipt-missing"
[[ "$(cat "$source_dir/.salonbw-source-sha")" == "$release_sha" ]] ||
  fail "source-receipt-mismatch"

command -v git >/dev/null || fail "git-unavailable"
command -v node22 >/dev/null || fail "node22-unavailable"
command -v npm22 >/dev/null || fail "npm22-unavailable"
command -v devil >/dev/null || fail "mydevil-cli-unavailable"

actual_sha="$(git -C "$mirror" rev-parse --verify "$release_sha^{commit}")" ||
  fail "sha-not-found-in-mirror"
[[ "$actual_sha" == "$release_sha" ]] ||
  fail "source-sha-mismatch"

# The release must carry the exact approved quota guard from master.
guard="scripts/ci/check-mydevil-dev-quota.cjs"
master_guard="$(git -C "$mirror" rev-parse --verify "refs/remotes/origin/master:$guard")" ||
  fail "master-quota-guard-unavailable"
release_guard="$(git -C "$mirror" rev-parse --verify "$release_sha:$guard")" ||
  fail "release-quota-guard-unavailable"
[[ "$master_guard" == "$release_guard" ]] ||
  fail "quota-guard-differs-from-master"
[[ -f "$source_dir/$guard" ]] ||
  fail "quota-guard-missing-in-source"

provider_output="$(devil info limits)" || fail "account-quota-unavailable"
filesystem_free_kib="$(df -Pk "$HOME" | awk 'NR == 2 {print $4}')" ||
  fail "filesystem-capacity-unavailable"
[[ "$filesystem_free_kib" =~ ^[0-9]+$ ]] ||
  fail "invalid-filesystem-capacity"
printf '%s\n' "$provider_output" |
  MYDEVIL_FILESYSTEM_FREE_KIB="$filesystem_free_kib" \
  node22 "$source_dir/$guard" >/dev/null ||
  fail "account-or-filesystem-quota-below-4gib"

# A running DEV domain must resolve to the exact fixed DEV application root.
# Do not create, replace, follow to another account, or repair any links.
[[ -d "$app_dir" && -L "$domain_link" && -d "$domain_link" ]] ||
  fail "dev-app-or-domain-link-missing"
canonical_app="$(cd -P "$app_dir" && pwd -P)"
canonical_link="$(cd -P "$domain_link" && pwd -P)"
[[ "$canonical_link" == "$canonical_app" ]] ||
  fail "domain-points-outside-verified-dev-app"
[[ -f "$app_dir/$required_private" && ! -L "$app_dir/$required_private" ]] ||
  fail "private-runtime-config-missing"

case "$target" in
  panel|landing)
    # Check isolation without printing or exporting gateway credentials.
    node22 - "$app_dir/$required_private" <<'NODE' ||
      fail "frontend-runtime-isolation-mismatch"
const fs = require('node:fs');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (
  cfg.APP_ENV !== 'development' ||
  cfg.NEXT_PUBLIC_DEPLOYMENT_ENV !== 'development' ||
  cfg.NEXT_PUBLIC_AUTH_COOKIE_PREFIX !== 'dev_' ||
  cfg.API_PROXY_URL !== 'https://dev-api.salon-bw.pl' ||
  !cfg.DEV_ACCESS_USER ||
  !cfg.DEV_ACCESS_PASSWORD
) process.exit(1);
NODE
    ;;
  api)
    # Never print .env contents; check only expected staging isolation keys.
    node22 - "$app_dir/$required_private" <<'NODE' ||
      fail "api-runtime-isolation-mismatch"
const fs = require('node:fs');
const raw = fs.readFileSync(process.argv[2], 'utf8');
const env = new Map();
for (const line of raw.split(/\r?\n/)) {
  if (!line.trim() || /^\s*#/.test(line)) continue;
  const i = line.indexOf('=');
  if (i < 1) continue;
  const key = line.slice(0, i).trim();
  const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  env.set(key, value);
}
const db = env.get('DB_NAME') || env.get('PGDATABASE') ||
           env.get('POSTGRES_DB');
const app = env.get('APP_ENV');
if (app !== 'development' || db !== 'p11522_salonbw_d') process.exit(1);
NODE
    ;;
esac

node_major="$(node22 -p 'process.versions.node.split(".")[0]')" ||
  fail "node-version-unavailable"
[[ "$node_major" == 22 ]] || fail "node-major-not-22"

pnpm_status="UNAVAILABLE"
if command -v pnpm >/dev/null 2>&1; then
  pnpm_version="$(pnpm --version 2>/dev/null || true)"
  if [[ "$pnpm_version" == 10.14.0 ]]; then
    pnpm_status="READY"
  else
    pnpm_status="WRONG_VERSION"
  fi
elif command -v corepack >/dev/null 2>&1; then
  pnpm_status="COREPACK_ONLY"
fi

current_release="UNKNOWN"
if [[ -f "$app_dir/public/__release.json" && "$target" != api ]]; then
  current_release="$(node22 - "$app_dir/public/__release.json" <<'NODE'
const fs = require('node:fs');
try {
  const {sha} = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  console.log(/^[a-f0-9]{40}$/.test(sha || '') ? sha : 'UNKNOWN');
} catch { console.log('UNKNOWN'); }
NODE
)"
fi

printf 'MANUAL_DEV_PREFLIGHT=PASS target=%s sha=%s\n' "$target" "$release_sha"
printf 'DEV_DOMAIN=%s\n' "$domain"
printf 'DEV_APP_DIR=%s\n' "$app_dir"
printf 'SOURCE_DIR=%s\n' "$source_dir"
printf 'NODE_MAJOR=%s\n' "$node_major"
printf 'PNPM_STATUS=%s\n' "$pnpm_status"
printf 'CURRENT_RELEASE_SHA=%s\n' "$current_release"
printf 'RUNTIME_MUTATIONS=NONE\n'
