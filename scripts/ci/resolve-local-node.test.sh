#!/usr/bin/env bash
# Offline tests: no Homebrew install, no shell profile edits, no server access.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/ci/resolve-local-node.sh"
bash -n "$script"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/22" "$tmp/26"
cat > "$tmp/22/node" <<'MOCK22'
#!/usr/bin/env bash
[[ "$1" == -p ]] || exit 2
echo 22
MOCK22
cat > "$tmp/26/node" <<'MOCK26'
#!/usr/bin/env bash
[[ "$1" == -p ]] || exit 2
echo 26
MOCK26
chmod +x "$tmp/22/node" "$tmp/26/node"

check() {
  local expected="$1" requested="$2"
  local result
  result="$(SALONBW_LOCAL_NODE_BIN="$tmp/$expected/node" bash "$script" "$requested")"
  [[ "$result" == "$tmp/$expected/node" ]] || {
    echo "Wrong local Node selection" >&2
    exit 1
  }
}
check 22 22
check 26 26

if SALONBW_LOCAL_NODE_BIN="$tmp/26/node" bash "$script" 22 >/dev/null 2>&1; then
  echo "Accepted wrong major as Node 22" >&2
  exit 1
fi
if SALONBW_LOCAL_NODE_BIN="$tmp/missing" bash "$script" 22 >/dev/null 2>&1; then
  echo "Accepted missing Node interpreter" >&2
  exit 1
fi
if SALONBW_LOCAL_NODE_BIN="$tmp/22/node" bash "$script" 20 >/dev/null 2>&1; then
  echo "Accepted unsupported Node major" >&2
  exit 1
fi
echo "LOCAL_NODE_RESOLVER_OFFLINE_CHECK=PASS"
