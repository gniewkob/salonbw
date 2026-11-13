#!/usr/bin/env bash
# Read-only QA for manual Mac packager and FreeBSD staging command.
# Creates no host app files, does not upload bundles or run npm.
set -euo pipefail

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
pack="$repo/scripts/ci/package-manual-dev-panel.sh"
stage="$repo/scripts/mydevil/manual-dev-panel-stage.sh"

bash -n "$pack"
bash -n "$stage"

# Invalid SHA must stop before any download, remote write or npm call.
for source in "$pack" "$stage"; do
  if bash "$source" BAD_SHA invalid /tmp >/dev/null 2>&1; then
    echo "MANUAL_DEV_PANEL_PACKAGE_TEST=BLOCKED invalid sha accepted" >&2
    exit 1
  fi
done

# Packager requires an absolute, non-root output destination.
if bash "$pack" "$(printf '%040d' 0)" \
   fix/v18-calendar-reschedule-overlap-brand-20261112 . >/dev/null 2>&1; then
  echo "MANUAL_DEV_PANEL_PACKAGE_TEST=BLOCKED relative path accepted" >&2
  exit 1
fi

# No new manual code path may restart or modify the actual live application:
# the separate activation script must be reviewed and implemented later.
if grep -E 'devil www restart|mv .*panelbw_dev|rsync .*panelbw_dev' \
   "$pack" "$stage" >/dev/null; then
  echo "MANUAL_DEV_PANEL_PACKAGE_TEST=BLOCKED unexpected live activation" >&2
  exit 1
fi

# Critical safety restrictions must remain present.
grep -Fq 'gitleaks dir --redact=100' "$pack"
grep -Fq 'HUSKY=0 pnpm install --frozen-lockfile' "$pack"
grep -Fq 'file:./packages/api' "$pack"
grep -Fq 'archive-digest-mismatch' "$stage"
grep -Fq 'quota-below-approved-minimum' "$stage"
grep -Fq 'archive-contains-links' "$stage"
grep -Fq 'npm22 install --omit=dev --ignore-scripts' "$stage"
grep -Fq 'LIVE_RUNTIME_MUTATIONS=NONE' "$stage"
grep -Fq 'ACTIVATION=NOT_STARTED' "$stage"

printf 'MANUAL_DEV_PANEL_PACKAGE_OFFLINE_CHECK=PASS\n'
