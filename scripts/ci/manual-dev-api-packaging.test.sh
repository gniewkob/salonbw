#!/usr/bin/env bash
# Negative/syntax tests. Never builds, uploads, or writes on MyDevil.
set -euo pipefail

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/ci/package-manual-dev-api.sh"
bash -n "$script"

fail_if_accepted() {
  if bash "$script" "$@" >/dev/null 2>&1; then
    echo 'DEV_API_PACKAGE_TEST=FAIL accepted-invalid-input' >&2
    exit 1
  fi
}
sha="$(printf '%040d' 0)"
fail_if_accepted INVALID "codex/v18-integracja-20261113" /tmp
fail_if_accepted "$sha" ../invalid /tmp
fail_if_accepted "$sha" "codex/v18-integracja-20261113" .
fail_if_accepted "$sha" "codex/v18-integracja-20261113" /
fail_if_accepted "$sha" "codex/v18-integracja-20261113" //invalid

# Assert that the release contract has not regressed into an in-place deploy.
grep -Fq 'git -C "$repo" worktree add --detach' "$script"
grep -Fq 'HUSKY=0 pnpm install --frozen-lockfile' "$script"
grep -Fq 'gitleaks dir --redact=100' "$script"
grep -Fq -- '--manifest-only backend/salonbw-backend/package.json' "$script"
grep -Fq 'pnpm --filter salonbw-backend build' "$script"
grep -Fq 'compiled-migration-entrypoint-missing' "$script"
grep -Fq 'archive-contains-links' "$script"
grep -Fq 'COPYFILE_DISABLE=1 tar' "$script"
grep -Fq 'HOST_RUNTIME_MUTATIONS=NONE' "$script"
grep -Fq 'DATABASE_MUTATIONS=NONE' "$script"
grep -Fq 'ACTIVATION=NOT_STARTED' "$script"

# Packaging must not copy live app state or secrets into a distributable.
if grep -En 'cp[[:space:]].*\.env|rsync|devil[[:space:]]+www|ssh[[:space:]]|scp[[:space:]]' "$script"; then
  echo 'DEV_API_PACKAGE_TEST=FAIL unexpected-host-or-secret-operation' >&2
  exit 1
fi

echo 'DEV_API_PACKAGE_TEST=PASS static-and-negative'
