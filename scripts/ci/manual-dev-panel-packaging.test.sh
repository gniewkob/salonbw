#!/usr/bin/env bash
# Read-only QA for manual Mac packager and FreeBSD staging command.
# Creates no host app files, does not upload bundles or run npm.
set -euo pipefail

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
pack="$repo/scripts/ci/package-manual-dev-panel.sh"
stage="$repo/scripts/mydevil/manual-dev-panel-stage.sh"
retry="$repo/scripts/ci/retry-manual-dev-panel-stage.sh"

bash -n "$pack"
bash -n "$stage"
bash -n "$retry"
# Runs on Node 22; tests actual safe-link materialization, hardlinks and
# fail-closed external/cyclic/dangling link handling.
node --test "$repo/scripts/ci/flatten-internal-bundle-links.test.mjs"
node --test "$repo/scripts/ci/manual-dev-panel-stage-smoke.test.mjs"
node --test "$repo/scripts/ci/manual-dev-panel-activate.test.mjs"
node --test "$repo/scripts/ci/manual-dev-panel-startup-diagnose.test.mjs"
node --test "$repo/scripts/ci/manual-dev-panel-port-probe.test.mjs"

# Invalid SHA must stop before any download, remote write or npm call.
for source in "$pack" "$stage" "$retry"; do
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
   "$pack" "$stage" "$retry" >/dev/null; then
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
grep -Fq 'SALONBW_STAGE_LOOPBACK_HOST' "$repo/scripts/mydevil/manual-dev-panel-stage-smoke.mjs"
grep -Fq 'SALONBW_STAGE_LOOPBACK_HOST' "$repo/scripts/mydevil/manual-dev-panel-startup-diagnose.mjs"
grep -Fq 'node --test apps/panel/scripts/staged-listen-host.test.cjs' "$pack"
grep -Fq "font-manifest.json" "$pack"
grep -Fq 'flatten-internal-bundle-links.mjs' "$pack"
grep -Fq 'cp -R packages/api/src "$bundle/packages/api/src"' "$pack"
if grep -Fq 'cp -R packages/api "$bundle/packages/api"' "$pack"; then
  echo 'MANUAL_DEV_PANEL_PACKAGE_TEST=BLOCKED copied Mac node_modules' >&2
  exit 1
fi
grep -Fq 'REMOTE_ARTIFACT=PASS checksum-verified-atomic-replacement' "$retry"
grep -Fq 'archive-still-contains-links' "$pack"
grep -Fq 'npm22 install --omit=dev --ignore-scripts' "$stage"
grep -Fq 'LIVE_RUNTIME_MUTATIONS=NONE' "$stage"
grep -Fq 'ACTIVATION=NOT_STARTED' "$stage"

printf 'MANUAL_DEV_PANEL_PACKAGE_OFFLINE_CHECK=PASS\n'
