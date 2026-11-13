#!/usr/bin/env bash
# Exact-SHA local quality gate. Not a substitute for all hosted CI/PG/E2E checks.
# Runs in a disposable Git worktree, preserving uncommitted operator changes.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash scripts/ci/local-release-gate.sh <40-char-sha> <api|panel|landing>' >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
sha="$1"
target="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$target" == api || "$target" == panel || "$target" == landing ]] || usage

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repo"
git cat-file -e "$sha^{commit}" || {
  echo 'Requested immutable commit was not fetched locally' >&2
  exit 1
}

for tool in git node pnpm gitleaks; do
  command -v "$tool" >/dev/null || {
    echo "LOCAL_RELEASE_GATE=BLOCKED missing_tool=$tool" >&2
    exit 1
  }
done
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] || {
  echo 'LOCAL_RELEASE_GATE=BLOCKED Node.js 22 is required' >&2
  exit 1
}
[[ "$(pnpm --version)" == 10.14.0 ]] || {
  echo 'LOCAL_RELEASE_GATE=BLOCKED pnpm 10.14.0 is required' >&2
  exit 1
}

base="$(git merge-base origin/master "$sha")" || {
  echo 'Cannot determine comparison base; fetch origin/master first' >&2
  exit 1
}
[[ "$base" =~ ^[a-f0-9]{40}$ ]] || exit 1

tmp_base="${TMPDIR:-/tmp}"
tmp="$(mktemp -d "$tmp_base/salonbw-release.XXXXXXXX")"
rmdir "$tmp"
created=false
cleanup() {
  if [[ "$created" == true ]]; then
    git -C "$repo" worktree remove --force "$tmp" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT
git worktree add --detach "$tmp" "$sha" >/dev/null
created=true
cd "$tmp"

# Run from source before installing dependencies so that scan scope is limited.
# Inspect both new Git commits and the current source tree. Historical
# secrets outside this range require separate repository-wide remediation.
echo 'LOCAL_RELEASE_GATE: scanning new commits for secrets (redacted output)'
gitleaks git --redact=100 --no-banner --log-opts="$base..$sha" .
gitleaks dir --redact=100 --no-banner .

# Prevent the worktree's package prepare scripts from modifying shared Git hooks.
HUSKY=0 pnpm install --frozen-lockfile
echo 'LOCAL_RELEASE_GATE: dependencies installed'

# Use the same read-only checks regardless of requested target.
pnpm --filter salonbw-backend typecheck
pnpm --filter salonbw-backend test --runInBand
pnpm --filter @salonbw/panel typecheck
pnpm --filter @salonbw/panel test --runInBand

case "$target" in
  api)
    pnpm --filter salonbw-backend build
    [[ -f backend/salonbw-backend/dist/src/main.js ||
       -f backend/salonbw-backend/dist/main.js ]] || {
      echo 'LOCAL_RELEASE_GATE=BLOCKED backend build artifact missing' >&2
      exit 1
    }
    ;;
  panel)
    NEXT_PUBLIC_API_URL=/api \
    API_PROXY_URL=https://dev-api.salon-bw.pl \
    NEXT_PUBLIC_DEPLOYMENT_ENV=development \
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_ \
    NEXT_PUBLIC_LANDING_URL=https://dev.salon-bw.pl \
    NEXT_PANEL_HTML_NOSTORE=true \
    pnpm --filter @salonbw/panel build
    test -s apps/panel/.next/BUILD_ID
    ;;
  landing)
    NEXT_PUBLIC_API_URL=/api \
    API_PROXY_URL=https://dev-api.salon-bw.pl \
    NEXT_PUBLIC_DEPLOYMENT_ENV=development \
    NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_ \
    NEXT_PUBLIC_SITE_URL=https://dev.salon-bw.pl \
    NEXT_PUBLIC_PANEL_URL=https://dev-panel.salon-bw.pl \
    pnpm --filter @salonbw/landing build
    test -s apps/landing/.next/BUILD_ID
    ;;
esac

# Publish no user data, test output or credentials. The worktree is discarded.
printf 'LOCAL_RELEASE_GATE=PASS sha=%s target=%s\n' "$sha" "$target"
printf 'GITLEAKS=PASS\nBACKEND_UNIT=PASS\nPANEL_UNIT=PASS\n'
printf 'TYPECHECK=PASS\nTARGET_BUILD=PASS\n'
printf 'POSTGRES_E2E=UNVERIFIED\nHOSTED_DEV_UAT=UNVERIFIED\n'
