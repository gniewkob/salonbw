#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-}"
HEAD="${2:-}"
OUTPUT_FILE="${GITHUB_OUTPUT:-/dev/stdout}"
ZERO_SHA="0000000000000000000000000000000000000000"

write_all() {
  local value="$1"
  {
    echo "panel=$value"
    echo "landing=$value"
    echo "api=$value"
  } >> "$OUTPUT_FILE"
}

if [[ -z "$BASE" || "$BASE" == "$ZERO_SHA" ]]; then
  write_all true
  exit 0
fi

if [[ -z "$HEAD" ]] || ! git cat-file -e "$HEAD^{commit}" 2>/dev/null; then
  echo "Head commit is unavailable; refusing partial deploy detection" >&2
  exit 1
fi

if ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  echo "Base commit $BASE is unavailable; deploying all targets" >&2
  write_all true
  exit 0
fi

files="$(git diff --name-only "$BASE" "$HEAD")"
echo "Changed files:"
printf '%s\n' "$files"

matches() {
  local pattern="$1"
  if command -v rg >/dev/null 2>&1; then
    printf '%s\n' "$files" | rg -q "$pattern"
  else
    printf '%s\n' "$files" | grep -Eq "$pattern"
  fi
}

panel=false
landing=false
api=false

if matches '^(package.json|pnpm-lock.yaml|pnpm-workspace.yaml|turbo.json|packages/api/)'; then
  panel=true
  landing=true
fi
if matches '^apps/panel/'; then
  panel=true
fi
if matches '^apps/landing/'; then
  landing=true
fi
if matches '^backend/'; then
  api=true
fi
if matches '^scripts/mydevil/extract-frontend-bundle\.sh$'; then
  panel=true
  landing=true
fi
if matches '^(\.github/workflows/deploy\.yml|scripts/ci/detect-deploy-changes\.sh)$'; then
  panel=true
  landing=true
  api=true
fi

{
  echo "panel=$panel"
  echo "landing=$landing"
  echo "api=$api"
} >> "$OUTPUT_FILE"
