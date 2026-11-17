#!/usr/bin/env bash
# Read-only QA for the manual DEV landing packager, stage and activation.
# Creates no host app files, does not upload bundles or run npm.
set -euo pipefail

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
pack="$repo/scripts/ci/package-manual-dev-landing.sh"
stage="$repo/scripts/mydevil/manual-dev-landing-stage.sh"
activate="$repo/scripts/mydevil/manual-dev-landing-activate.mjs"

bash -n "$pack"
bash -n "$stage"
node --check "$activate"
node --test "$repo/scripts/ci/flatten-internal-bundle-links.test.mjs"
node --test "$repo/scripts/ci/manual-dev-landing-activate.test.mjs"

# Invalid SHA must stop before any download, remote write or npm call.
for source in "$pack" "$stage"; do
  if bash "$source" BAD_SHA invalid /tmp >/dev/null 2>&1; then
    echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED invalid sha accepted" >&2
    exit 1
  fi
done
if bash "$pack" "$(printf '%040d' 0)" design/example . >/dev/null 2>&1; then
  echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED relative path accepted" >&2
  exit 1
fi

# Packager and stage never restart or write the live application.
if grep -E 'devil www restart|mv .*apps/nodejs/salonbw|rsync .*apps/nodejs/salonbw' \
   "$pack" "$stage" >/dev/null; then
  echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED unexpected live activation" >&2
  exit 1
fi
# DEV only: no production landing root or domain anywhere.
if grep -E 'salonbw_prod|domains/salon-bw\.pl|//salon-bw\.pl' \
   "$pack" "$stage" "$activate" >/dev/null; then
  echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED production target referenced" >&2
  exit 1
fi
# DEV access is environment-only (never a literal) and must be absent
# from the archive.
if grep -E 'DEV_ACCESS_(USER|PASSWORD)=[^$"]' "$pack" >/dev/null; then
  echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED literal secret in packager" >&2
  exit 1
fi
grep -Fq 'missing-dev-access-environment' "$pack"
grep -Fq 'dev-access-secret-in-bundle' "$pack"
if env -u DEV_ACCESS_USER -u DEV_ACCESS_PASSWORD bash "$pack" "$(printf '%040d' 0)" \
   design/example /tmp/salonbw-landing-test-out 2>&1 | grep -q 'missing-dev-access-environment'; then :; else
  echo "MANUAL_DEV_LANDING_PACKAGE_TEST=BLOCKED packager ran without DEV access" >&2
  exit 1
fi

grep -Fq 'gitleaks dir --redact=100' "$pack"
grep -Fq 'HUSKY=0 pnpm install --frozen-lockfile' "$pack"
grep -Fq 'pnpm --filter @salonbw/landing build' "$pack"
grep -Fq 'NEXT_PUBLIC_DEPLOYMENT_ENV=development' "$pack"
grep -Fq 'NEXT_PUBLIC_SITE_URL=https://dev.salon-bw.pl' "$pack"
grep -Fq 'file:./packages/api' "$pack"
grep -Fq 'font-manifest.json' "$pack"
grep -Fq 'flatten-internal-bundle-links.mjs' "$pack"
grep -Fq 'archive-still-contains-links' "$pack"
grep -Fq 'live="$HOME/apps/nodejs/salonbw"' "$stage"
grep -Fq 'link="$HOME/domains/dev.salon-bw.pl/public_nodejs"' "$stage"
grep -Fq "pkg.name!=='@salonbw/landing'" "$stage"
grep -Fq 'archive-digest-mismatch' "$stage"
grep -Fq 'quota-below-approved-minimum' "$stage"
grep -Fq 'archive-contains-links' "$stage"
grep -Fq 'npm22 install --omit=dev --ignore-scripts' "$stage"
grep -Fq 'LIVE_RUNTIME_MUTATIONS=NONE' "$stage"
grep -Fq 'ACTIVATION=NOT_STARTED' "$stage"
grep -Fq "const liveDomain = 'dev.salon-bw.pl';" "$activate"
grep -Fq 'SALONBW_DEV_LANDING_APPROVED_SHA' "$activate"

printf 'MANUAL_DEV_LANDING_PACKAGE_OFFLINE_CHECK=PASS\n'
