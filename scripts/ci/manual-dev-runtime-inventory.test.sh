#!/usr/bin/env bash
# Safe fixture tests for the read-only MyDevil runtime inventory.
set -euo pipefail
script="$(cd "$(dirname "$0")/.." && pwd -P)/mydevil/manual-dev-runtime-inventory.sh"
bash -n "$script"
original_home="$HOME"
root="$(mktemp -d)"
trap 'rm -rf -- "$root"' EXIT
export HOME="$root/home"
sha="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
mkdir -p "$HOME/.salonbw-manual/sources/$sha/apps/panel"
printf '%s\n' "$sha" > "$HOME/.salonbw-manual/sources/$sha/.salonbw-source-sha"
printf '{}\n' > "$HOME/.salonbw-manual/sources/$sha/apps/panel/package.json"
app="$HOME/apps/nodejs/panelbw_dev"
mkdir -p "$app"/{.next,public,node_modules}
printf '{}\n' > "$app/package.json"
printf '{}\n' > "$app/.env.runtime.json"
printf '/* synthetic Passenger fixture */\n' > "$app/app.cjs"
printf 'ExampleBuild12345\n' > "$app/.next/BUILD_ID"
printf '{"sha":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}\n' > \
  "$app/public/__release.json"
mkdir -p "$HOME/domains/dev-panel.salon-bw.pl"
ln -s "$app" "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
before="$(find "$HOME" -type f -print | LC_ALL=C sort)"
out="$(bash "$script" "$sha" panel)"
printf '%s\n' "$out" | grep -Fxq 'DEV_RUNTIME_INVENTORY=PASS target=panel'
printf '%s\n' "$out" | grep -Fxq 'PASSENGER_ENTRYPOINT=app.cjs'
printf '%s\n' "$out" | grep -Fxq 'CURRENT_RELEASE_SHA=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
printf '%s\n' "$out" | grep -Fxq 'CURRENT_NEXT_BUILD_ID=ExampleBuild12345'
printf '%s\n' "$out" | grep -Fxq 'RUNTIME_MUTATIONS=NONE'
after="$(find "$HOME" -type f -print | LC_ALL=C sort)"
[[ "$before" == "$after" ]] || {
  echo 'Inventory changed fixture files' >&2
  exit 1
}

# Fail safely on a link redirected outside the expected application.
other="$HOME/apps/nodejs/other_app"
mkdir -p "$other"
rm "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
ln -s "$other" "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
if bash "$script" "$sha" panel >/dev/null 2>&1; then
  echo 'Inventory accepted a redirected DEV domain' >&2
  exit 1
fi

# Fail safely on an app-root symlink: dangerous for later rename activation.
rm "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
ln -s "$app" "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
mv "$app" "$app.original"
ln -s "$app.original" "$app"
if bash "$script" "$sha" panel >/dev/null 2>&1; then
  echo 'Inventory accepted symlinked live app' >&2
  exit 1
fi
printf 'DEV_RUNTIME_INVENTORY_OFFLINE_CHECK=PASS\n'
