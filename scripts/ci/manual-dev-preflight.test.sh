#!/usr/bin/env bash
# Offline synthetic preflight tests; nothing touches the real MyDevil runtime.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/mydevil/manual-dev-preflight.sh"
bash -n "$script"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
export HOME="$tmp/home"
export MOCK_RELEASE_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export MOCK_GUARD_BLOB=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
export REAL_NODE="$(command -v node)"
[[ -n "$REAL_NODE" ]] || { echo "Node required for offline test" >&2; exit 1; }

mkdir -p "$tmp/bin" \
  "$HOME/.salonbw-manual/git-source/.git" \
  "$HOME/.salonbw-manual/sources/$MOCK_RELEASE_SHA/scripts/ci" \
  "$HOME/apps/nodejs/panelbw_dev" \
  "$HOME/domains/dev-panel.salon-bw.pl"
export PATH="$tmp/bin:$PATH"

cat > "$tmp/bin/git" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == -C && "$3" == rev-parse && "$4" == --verify ]] || exit 15
case "$5" in
  *'^{commit}')
    echo "$MOCK_RELEASE_SHA"
    ;;
  refs/remotes/origin/master:scripts/ci/check-mydevil-dev-quota.cjs)
    echo "$MOCK_GUARD_BLOB"
    ;;
  *:scripts/ci/check-mydevil-dev-quota.cjs)
    echo "$MOCK_GUARD_BLOB"
    ;;
  *)
    exit 16
    ;;
esac
MOCK
cat > "$tmp/bin/node22" <<'MOCK'
#!/usr/bin/env bash
exec "$REAL_NODE" "$@"
MOCK
cat > "$tmp/bin/npm22" <<'MOCK'
#!/usr/bin/env bash
echo 10.14.0
MOCK
cat > "$tmp/bin/devil" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == info && "$2" == limits ]] || exit 2
echo 'Dysk: 1 GiB / 50 GiB'
MOCK
cat > "$tmp/bin/df" <<'MOCK'
#!/usr/bin/env bash
[[ "$1" == -Pk ]] || exit 2
printf 'Filesystem 1024-blocks Used Available Capacity Mounted on\n'
printf 'fake 104857600 1000000 50000000 1%% /home\n'
MOCK
chmod +x "$tmp/bin/"*

source_dir="$HOME/.salonbw-manual/sources/$MOCK_RELEASE_SHA"
printf '%s\n' "$MOCK_RELEASE_SHA" > "$source_dir/.salonbw-source-sha"
cp "$repo/scripts/ci/check-mydevil-dev-quota.cjs" \
  "$source_dir/scripts/ci/check-mydevil-dev-quota.cjs"

app="$HOME/apps/nodejs/panelbw_dev"
ln -s "$app" "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
cat > "$app/.env.runtime.json" <<'JSON'
{
  "APP_ENV": "development",
  "NEXT_PUBLIC_DEPLOYMENT_ENV": "development",
  "NEXT_PUBLIC_AUTH_COOKIE_PREFIX": "dev_",
  "API_PROXY_URL": "https://dev-api.salon-bw.pl",
  "DEV_ACCESS_USER": "synthetic",
  "DEV_ACCESS_PASSWORD": "synthetic"
}
JSON
passed="$(bash "$script" "$MOCK_RELEASE_SHA" panel)"
grep -Fq "MANUAL_DEV_PREFLIGHT=PASS" <<< "$passed"
grep -Fq "RUNTIME_MUTATIONS=NONE" <<< "$passed"

if bash "$script" 123 panel >/dev/null 2>&1; then
  echo "Accepted short SHA" >&2
  exit 1
fi
if bash "$script" "$MOCK_RELEASE_SHA" production >/dev/null 2>&1; then
  echo "Accepted production target" >&2
  exit 1
fi
mv "$app/.env.runtime.json" "$app/.env.runtime.json.saved"
if bash "$script" "$MOCK_RELEASE_SHA" panel >/dev/null 2>&1; then
  echo "Accepted missing private config" >&2
  exit 1
fi
mv "$app/.env.runtime.json.saved" "$app/.env.runtime.json"
sed -i.bak 's|"dev_"|"prod_"|' "$app/.env.runtime.json"
if bash "$script" "$MOCK_RELEASE_SHA" panel >/dev/null 2>&1; then
  echo "Accepted wrong cookie isolation" >&2
  exit 1
fi
mv "$app/.env.runtime.json.bak" "$app/.env.runtime.json"
rm "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
mkdir "$HOME/domains/dev-panel.salon-bw.pl/public_nodejs"
if bash "$script" "$MOCK_RELEASE_SHA" panel >/dev/null 2>&1; then
  echo "Accepted unexpected domain root directory" >&2
  exit 1
fi
echo "MANUAL_DEV_PREFLIGHT_OFFLINE_CHECK=PASS"
