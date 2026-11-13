#!/usr/bin/env bash
# Read-only DEV runtime inventory before designing a reversible manual release.
# No install, copy, restart, backup, chmod, or symlink edits.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash manual-dev-runtime-inventory.sh <40-char-sha> <panel|landing|api>' >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
sha="$1"
target="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage

case "$target" in
  panel)
    app="panelbw_dev"
    domain="dev-panel.salon-bw.pl"
    private=".env.runtime.json"
    source_app="apps/panel"
    ;;
  landing)
    app="salonbw"
    domain="dev.salon-bw.pl"
    private=".env.runtime.json"
    source_app="apps/landing"
    ;;
  api)
    app="api_salonbw_dev"
    domain="dev-api.salon-bw.pl"
    private=".env"
    source_app="backend/salonbw-backend"
    ;;
  *) usage ;;
esac

fail() {
  printf 'DEV_RUNTIME_INVENTORY=BLOCKED target=%s reason=%s\n' "$target" "$1" >&2
  exit 1
}
app_dir="$HOME/apps/nodejs/$app"
domain_link="$HOME/domains/$domain/public_nodejs"
source_dir="$HOME/.salonbw-manual/sources/$sha"

[[ -d "$app_dir" && ! -L "$app_dir" ]] ||
  fail "live-app-dir-missing-or-symlink"
[[ -L "$domain_link" && -d "$domain_link" ]] ||
  fail "expected-domain-symlink-missing"
[[ -d "$source_dir" && ! -L "$source_dir" ]] ||
  fail "verified-source-missing"
[[ -f "$source_dir/.salonbw-source-sha" &&
   "$(cat "$source_dir/.salonbw-source-sha")" == "$sha" ]] ||
  fail "source-receipt-mismatch"
[[ -f "$source_dir/$source_app/package.json" ]] ||
  fail "source-package-missing"
[[ -f "$app_dir/$private" && ! -L "$app_dir/$private" ]] ||
  fail "private-config-missing-or-symlinked"
[[ -f "$app_dir/package.json" && -d "$app_dir/node_modules" ]] ||
  fail "runtime-package-or-dependencies-missing"
# Keep both operands in one Bash conditional: a bare newline after '==' is
# not a valid continuation and prevents the script from being parsed.
[[ "$(cd -P "$app_dir" && pwd -P)" == "$(cd -P "$domain_link" && pwd -P)" ]] ||
  fail "domain-does-not-target-expected-app"

entrypoint="NONE"
for candidate in app.cjs app.js; do
  if [[ -f "$app_dir/$candidate" && ! -L "$app_dir/$candidate" ]]; then
    entrypoint="$candidate"
    break
  fi
done
if [[ "$target" != api && "$entrypoint" == NONE ]]; then
  fail "frontend-entrypoint-missing"
fi

if [[ "$target" != api ]]; then
  [[ -d "$app_dir/.next" && -f "$app_dir/.next/BUILD_ID" ]] ||
    fail "current-next-build-missing"
  [[ -d "$app_dir/public" ]] || fail "current-public-dir-missing"
fi

build_id="UNKNOWN"
if [[ "$target" != api ]]; then
  # Never echo arbitrary artifact content.
  candidate="$(cat "$app_dir/.next/BUILD_ID")"
  if [[ "$candidate" =~ ^[A-Za-z0-9_-]{5,100}$ ]]; then
    build_id="$candidate"
  fi
fi
release="UNKNOWN"
if [[ "$target" != api && -f "$app_dir/public/__release.json" ]]; then
  # Match only an exact SHA field, not arbitrary release metadata.
  receipt="$(grep -Eo '"sha"[[:space:]]*:[[:space:]]*"[a-f0-9]{40}"' \
    "$app_dir/public/__release.json" | head -n 1 || true)"
  release="$(printf '%s\n' "$receipt" | awk -F '"' '{print $(NF-1)}')"
  if [[ ! "$release" =~ ^[a-f0-9]{40}$ ]]; then
    release="UNKNOWN"
  fi
fi

size_kib="$(du -sk "$app_dir" | awk 'NR == 1 {print $1}')" ||
  fail "runtime-size-unavailable"
[[ "$size_kib" =~ ^[0-9]+$ ]] || fail "runtime-size-invalid"

printf 'DEV_RUNTIME_INVENTORY=PASS target=%s\n' "$target"
printf 'TARGET_SHA=%s\n' "$sha"
printf 'LIVE_APP=%s\n' "$app_dir"
printf 'LIVE_DOMAIN=%s\n' "$domain"
printf 'PASSENGER_ENTRYPOINT=%s\n' "$entrypoint"
printf 'LIVE_APP_SIZE_KIB=%s\n' "$size_kib"
printf 'CURRENT_RELEASE_SHA=%s\n' "$release"
printf 'CURRENT_NEXT_BUILD_ID=%s\n' "$build_id"
printf 'PRIVATE_CONFIG=EXISTS (content hidden)\n'
printf 'RUNTIME_NODE_MODULES=EXISTS\n'
printf 'LIVE_APP_SYMLINK=FORBIDDEN (app directory is real)\n'
printf 'DOMAIN_APP_LINK=VERIFIED\n'
printf 'PERSISTENT_DATA_MAP=UNVERIFIED\n'
printf 'RELEASE_ROLLBACK=NOT_IMPLEMENTED\n'
printf 'RUNTIME_MUTATIONS=NONE\n'
