#!/usr/bin/env bash
# Pick an installed Node major without mutating default shell or host config.
set -euo pipefail
[[ $# -eq 1 ]] || exit 2
major="$1"
[[ "$major" == 22 || "$major" == 26 ]] || {
  echo "NODE_RESOLVER=BLOCKED invalid Node major" >&2
  exit 2
}
test_binary() {
  local bin="$1" found
  [[ -n "$bin" && -x "$bin" && ! -d "$bin" ]] || return 1
  found="$("$bin" -p 'process.versions.node.split(".")[0]' 2>/dev/null)" || return 1
  [[ "$found" == "$major" ]]
}
candidate=""
explicit="$(printenv SALONBW_LOCAL_NODE_BIN 2>/dev/null || true)"
if [[ -n "$explicit" ]]; then
  test_binary "$explicit" || {
    echo "NODE_RESOLVER=BLOCKED explicit Node does not match requested major" >&2
    exit 1
  }
  candidate="$explicit"
else
  active="$(command -v node || true)"
  if test_binary "$active"; then candidate="$active"; fi
fi
if [[ -z "$candidate" ]]; then
  for path in \
    "/opt/homebrew/opt/node@$major/bin/node" \
    "/usr/local/opt/node@$major/bin/node" \
    "$HOME"/.nvm/versions/node/v"$major".*/bin/node; do
    if test_binary "$path"; then
      candidate="$path"
      break
    fi
  done
fi
if [[ -z "$candidate" ]]; then
  versioned="$(command -v "node$major" || true)"
  if test_binary "$versioned"; then candidate="$versioned"; fi
fi
if [[ -z "$candidate" ]]; then
  echo "NODE_RESOLVER=BLOCKED Node $major unavailable" >&2
  echo "Install on Mac: brew install node@$major" >&2
  exit 1
fi
if [[ "$(basename "$candidate")" != node ]]; then
  echo "NODE_RESOLVER=BLOCKED versioned node binary cannot select pnpm runtime" >&2
  exit 1
fi
printf '%s\n' "$candidate"
