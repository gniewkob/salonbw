#!/usr/bin/env bash
# Offline deterministic checks; no GitHub/SSH/MyDevil access.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/mydevil/git-source-sync.sh"
bash -n "$script"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin" "$tmp/home"
cat > "$tmp/bin/git" <<'MOCK_GIT'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == ls-remote ]] || exit 90
printf '%s\t%s\n' "$FAKE_SHA" "refs/heads/$FAKE_BRANCH"
MOCK_GIT
chmod +x "$tmp/bin/git"
export PATH="$tmp/bin:$PATH"
export HOME="$tmp/home"
export FAKE_SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
export FAKE_BRANCH=fix/v18-valid-branch
output="$(bash "$script" "$FAKE_BRANCH" "$FAKE_SHA" --check)"
grep -Fq "SOURCE_CHECK=PASS branch=$FAKE_BRANCH sha=$FAKE_SHA" <<< "$output"
[[ ! -e "$HOME/.salonbw-manual" ]] || {
  echo "Read-only check mutated home directory" >&2
  exit 1
}
if bash "$script" "$FAKE_BRANCH" bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb --check >/dev/null 2>&1; then
  echo "Mismatched GitHub HEAD accepted" >&2
  exit 1
fi
if bash "$script" 'fix/../unsafe' "$FAKE_SHA" --check >/dev/null 2>&1; then
  echo "Invalid Git ref accepted" >&2
  exit 1
fi
if bash "$script" "$FAKE_BRANCH" 1234 --check >/dev/null 2>&1; then
  echo "Short commit accepted" >&2
  exit 1
fi
if bash "$script" "$FAKE_BRANCH" "$FAKE_SHA" --dangerous >/dev/null 2>&1; then
  echo "Unknown mode accepted" >&2
  exit 1
fi
[[ ! -e "$HOME/.salonbw-manual" ]] || {
  echo "Rejected input mutated home directory" >&2
  exit 1
}
echo "GIT_SOURCE_SYNC_OFFLINE_CHECK=PASS (syntax, pinning, read-only)"
