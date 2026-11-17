#!/usr/bin/env bash
# Offline safety checks for the DEV-only FreeBSD API stage script.
# No SSH, network, database access, or MyDevil writes.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/mydevil/manual-dev-api-stage.sh"
bash -n "$script"

expect_reject() {
  if bash "$script" "$@" >/dev/null 2>&1; then
    echo 'DEV_API_STAGE_TEST=FAIL invalid-input-accepted' >&2
    exit 1
  fi
}
sha="$(printf '%040d' 0)"
digest="$(printf '%064d' 0)"
expect_reject BAD "$digest" --plan
expect_reject "$sha" BAD --plan
expect_reject "$sha" "$digest" --dangerous
expect_reject "$sha" "$digest"
# Approval check must fail before attempting any host mutations.
if SALONBW_DEV_API_STAGE_APPROVED_SHA= bash "$script" "$sha" "$digest" --execute \
    >/dev/null 2>&1; then
  echo 'DEV_API_STAGE_TEST=FAIL unapproved-state-change-accepted' >&2
  exit 1
fi

# Guard required invariants. Functional FreeBSD install/smoke is a separate gate.
grep -Fq 'SALONBW_DEV_API_STAGE_APPROVED_SHA' "$script"
grep -Fq 'unsupported-operating-system' "$script"
grep -Fq 'source-receipt-mismatch' "$script"
grep -Fq 'domain-rerouted' "$script"
grep -Fq 'quota-below-approved-minimum' "$script"
grep -Fq 'archive-digest-mismatch' "$script"
grep -Fq 'archive-contains-links' "$script"
grep -Fq 'archive-parent-traversal' "$script"
grep -Fq 'unexpected-archive-member' "$script"
grep -Fq 'private-runtime-stage-failed' "$script"
grep -Fq -- '--manifest-only "$temp/package.json"' "$script"
grep -Fq 'npm22 install --omit=dev --ignore-scripts' "$script"
grep -Fq 'npm22 rebuild bcrypt' "$script"
grep -Fq 'sharp-freebsd-codec-smoke-failed' "$script"
grep -Fq 'PASSENGER_RESTART=NOT_STARTED' "$script"
grep -Fq 'DATABASE_MUTATIONS=NONE' "$script"
grep -Fq 'ACTIVATION=NOT_STARTED' "$script"

# Never alter live, database or production; verify the script does not
# contain direct deployment, migration or restart commands.
if grep -En 'devil www restart|rsync --delete|dropdb|psql|db:migrate|runMigrations|touch .*restart.txt' "$script"; then
  echo 'DEV_API_STAGE_TEST=FAIL live-mutation-command-detected' >&2
  exit 1
fi
echo 'DEV_API_STAGE_TEST=PASS static-and-negative'
