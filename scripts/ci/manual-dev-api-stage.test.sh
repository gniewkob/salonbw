#!/usr/bin/env bash
# Fully offline regression for immutable MyDevil DEV API staging.
# Synthetic archives and Git objects only: no MyDevil, network or live writes.
set -euo pipefail
umask 077

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/mydevil/manual-dev-api-stage.sh"
bash -n "$script"

expect_reject() {
  if bash "$script" "$@" >/dev/null 2>&1; then
    echo 'DEV_API_STAGE_TEST=FAIL invalid-input-accepted' >&2
    exit 1
  fi
}
expect_reason() {
  local reason="$1"
  shift
  local output
  if output="$(bash "$script" "$@" 2>&1)"; then
    echo 'DEV_API_STAGE_TEST=FAIL unsafe-input-accepted' >&2
    exit 1
  fi
  if [[ "$output" != *"reason=$reason"* ]]; then
    echo "DEV_API_STAGE_TEST=FAIL unexpected-rejection expected=$reason" >&2
    exit 1
  fi
}

sha="$(printf '%040d' 0)"
digest="$(printf '%064d' 0)"
expect_reject BAD "$digest" --plan
expect_reject "$sha" BAD --plan
expect_reject "$sha" "$digest" --dangerous
expect_reject "$sha" "$digest"
# Unauthorized host staging must fail before any host filesystem access.
expect_reason unapproved-stage "$sha" "$digest" --execute

tmp="$(mktemp -d "${TMPDIR:-/tmp}/salonbw-api-stage-test.XXXXXXXX")"
trap 'rm -rf -- "$tmp"' EXIT
mkdir -p "$tmp/good/dist/src" "$tmp/mirror/scripts/ci" "$tmp/source/scripts/ci"
printf 'module.exports = {}\n' > "$tmp/good/dist/src/main.js"
printf 'module.exports = {}\n' > "$tmp/good/dist/src/migrate.js"
printf 'module.exports = {}\n' > "$tmp/good/app.js"
printf '{"name":"salonbw-backend"}\n' > "$tmp/good/package.json"
printf '{"sha":"test","target":"api","environment":"development"}\n' \
  > "$tmp/good/.salonbw-api-release.json"

# Real tar payloads exercise the exact archive check used by --plan.
COPYFILE_DISABLE=1 tar -czf "$tmp/good.tar.gz" -C "$tmp/good" .
bash "$script" --verify-archive "$tmp/good.tar.gz" |
  grep -Fq 'DEV_API_ARCHIVE_ONLY=PASS'

# A second tar with an otherwise allowlisted path can carry special types.
ln -s main.js "$tmp/good/dist/src/reference.js"
COPYFILE_DISABLE=1 tar -czf "$tmp/symlink.tar.gz" -C "$tmp/good" .
expect_reason archive-unsupported-type --verify-archive "$tmp/symlink.tar.gz"
rm "$tmp/good/dist/src/reference.js"

mkfifo "$tmp/good/dist/src/unsafe.fifo"
COPYFILE_DISABLE=1 tar -czf "$tmp/fifo.tar.gz" -C "$tmp/good" .
expect_reason archive-unsupported-type --verify-archive "$tmp/fifo.tar.gz"
rm "$tmp/good/dist/src/unsafe.fifo"

printf 'unexpected\n' > "$tmp/good/unexpected.txt"
COPYFILE_DISABLE=1 tar -czf "$tmp/extra.tar.gz" -C "$tmp/good" .
expect_reason unexpected-archive-member --verify-archive "$tmp/extra.tar.gz"
rm "$tmp/good/unexpected.txt"

# Simulate a truncated gzip: it must never pass because listing output was
# partially available through an unchecked process substitution.
head -c 64 "$tmp/good.tar.gz" > "$tmp/broken.tar.gz"
expect_reason archive-name-list-failed --verify-archive "$tmp/broken.tar.gz"

# Synthetic immutable Git mirror: candidate and approved master must agree,
# and the on-disk script must match the exact Git blob before execution.
git -C "$tmp/mirror" init -q
git -C "$tmp/mirror" config user.name 'Synthetic Test'
git -C "$tmp/mirror" config user.email 'synthetic@example.invalid'
printf "'use strict';\n" \
  > "$tmp/mirror/scripts/ci/check-api-production-dependencies.cjs"
git -C "$tmp/mirror" add scripts/ci/check-api-production-dependencies.cjs
git -C "$tmp/mirror" commit -qm 'fixture: approved dependency policy'
approved_sha="$(git -C "$tmp/mirror" rev-parse HEAD)"
git -C "$tmp/mirror" update-ref refs/remotes/origin/master "$approved_sha"
cp "$tmp/mirror/scripts/ci/check-api-production-dependencies.cjs" \
  "$tmp/source/scripts/ci/check-api-production-dependencies.cjs"
bash "$script" --verify-dependency-source "$tmp/mirror" "$tmp/source" "$approved_sha" |
  grep -Fq 'DEV_API_DEPENDENCY_SOURCE_ONLY=PASS'

printf 'tampered script\n' >> "$tmp/source/scripts/ci/check-api-production-dependencies.cjs"
expect_reason dependency-source-drift \
  --verify-dependency-source "$tmp/mirror" "$tmp/source" "$approved_sha"

# Divergent candidate source must not silently downgrade approved master gate.
printf "'use strict'; // altered\n" \
  > "$tmp/mirror/scripts/ci/check-api-production-dependencies.cjs"
git -C "$tmp/mirror" add scripts/ci/check-api-production-dependencies.cjs
git -C "$tmp/mirror" commit -qm 'fixture: unapproved policy change'
new_sha="$(git -C "$tmp/mirror" rev-parse HEAD)"
cp "$tmp/mirror/scripts/ci/check-api-production-dependencies.cjs" \
  "$tmp/source/scripts/ci/check-api-production-dependencies.cjs"
expect_reason dependency-source-drift \
  --verify-dependency-source "$tmp/mirror" "$tmp/source" "$new_sha"

# Structural guards against accidentally promoting the staged API.
grep -Fq 'SALONBW_DEV_API_STAGE_APPROVED_SHA' "$script"
grep -Fq 'unsupported-operating-system' "$script"
grep -Fq 'source-receipt-mismatch' "$script"
grep -Fq 'domain-rerouted' "$script"
grep -Fq 'quota-below-approved-minimum' "$script"
grep -Fq 'archive-digest-mismatch' "$script"
grep -Fq 'archive-name-list-failed' "$script"
grep -Fq 'archive-type-list-failed' "$script"
grep -Fq 'archive-unsupported-type' "$script"
grep -Fq 'archive-member-count-mismatch' "$script"
grep -Fq 'archive-parent-traversal' "$script"
grep -Fq 'unexpected-archive-member' "$script"
grep -Fq 'dependency-source-drift' "$script"
grep -Fq 'git -C "$mirror" cat-file blob "$APPROVED_DEPENDENCY_BLOB"' "$script"
grep -Fq -- '--manifest-only "$temp/package.json"' "$script"
grep -Fq 'npm22 install --omit=dev --ignore-scripts' "$script"
grep -Fq 'npm22 rebuild bcrypt' "$script"
grep -Fq 'sharp-freebsd-codec-smoke-failed' "$script"
grep -Fq 'PASSENGER_RESTART=NOT_STARTED' "$script"
grep -Fq 'DATABASE_MUTATIONS=NONE' "$script"
grep -Fq 'ACTIVATION=NOT_STARTED' "$script"

if grep -En 'devil www restart|rsync --delete|dropdb|psql|db:migrate|runMigrations|touch .*restart.txt' "$script"; then
  echo 'DEV_API_STAGE_TEST=FAIL unexpected-live-command' >&2
  exit 1
fi
echo 'DEV_API_STAGE_TEST=PASS synthetic-archive-source-and-negative'
