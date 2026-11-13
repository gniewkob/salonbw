#!/usr/bin/env bash
# Rebuild exact-SHA DEV panel artifact after archive-link normalization,
# upload through an atomic verified incoming replacement, stage separately.
# No live app writes, Passenger restart, database mutations, or PROD access.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash retry-manual-dev-panel-stage.sh <40-char-sha> <source-branch>' >&2
  exit 2
}
[[ $# -eq 2 ]] || usage
sha="$1"
branch="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$branch" =~ ^[a-zA-Z0-9][a-zA-Z0-9_./-]*$ ]] || usage
[[ "$branch" != *..* && "$branch" != */ && "$branch" != *//* ]] || usage

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repo"
for tool in git node scp ssh mktemp shasum; do
  command -v "$tool" >/dev/null || {
    echo "DEV_PANEL_STAGE=BLOCKED missing-tool=$tool" >&2
    exit 1
  }
done

# Validate the new security gate BEFORE the slow build or network transport.
bash scripts/ci/manual-dev-panel-packaging.test.sh

local_root="$HOME/.salonbw-manual"
[[ ! -L "$local_root" ]] || {
  echo 'DEV_PANEL_STAGE=BLOCKED local-root-symlink' >&2
  exit 1
}
mkdir -p "$local_root"
out="$(mktemp -d "$local_root/panel-artifact.XXXXXXXX")"
printf 'LOCAL_ARTIFACT_DIR=%s\n' "$out"
bash scripts/ci/package-manual-dev-panel.sh "$sha" "$branch" "$out"

archive="$out/panel-dev-$sha.tar.gz"
digest_file="$archive.sha256"
[[ -s "$archive" && -f "$digest_file" && ! -L "$archive" ]] || {
  echo 'DEV_PANEL_STAGE=BLOCKED local-artifact-missing' >&2
  exit 1
}
digest="$(cat "$digest_file")"
[[ "$digest" =~ ^[a-f0-9]{64}$ ]] || {
  echo 'DEV_PANEL_STAGE=BLOCKED invalid-digest' >&2
  exit 1
}
actual="$(shasum -a 256 "$archive" | awk '{print $1}')"
[[ "$actual" == "$digest" ]] || {
  echo 'DEV_PANEL_STAGE=BLOCKED local-digest-mismatch' >&2
  exit 1
}

nonce="$(date -u +%Y%m%d%H%M%S)-$$"
remote_temp=".panel-upload-$sha-$nonce.tar.gz"

# Check no symlink redirection and ensure unique incoming filename.
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes devil \
  bash -s -- "$sha" "$remote_temp" <<'REMOTE'
set -euo pipefail
sha="$1"
filename="$2"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 2
[[ "$filename" =~ ^\.panel-upload-[a-f0-9]{40}-[0-9]{14}-[0-9]+\.tar\.gz$ ]] || exit 2
root="$HOME/.salonbw-manual"
incoming="$root/incoming"
[[ -d "$root" && ! -L "$root" && -d "$incoming" && ! -L "$incoming" ]] || exit 1
[[ ! -e "$incoming/$filename" && ! -L "$incoming/$filename" ]] || exit 1
[[ -d "$root/sources/$sha" ]] || exit 1
[[ -f "$root/sources/$sha/.salonbw-source-sha" ]] || exit 1
[[ "$(cat "$root/sources/$sha/.salonbw-source-sha")" == "$sha" ]] || exit 1
echo 'INCOMING_TRANSFER_PREFLIGHT=PASS'
REMOTE

echo '=== Transfer private, new archive to MyDevil incoming ==='
scp -p -o BatchMode=yes -o StrictHostKeyChecking=yes \
  "$archive" "devil:.salonbw-manual/incoming/$remote_temp"

# Verify new archive BEFORE it replaces the previous rejected incoming
# archive. No app or original 90 MiB predeployment backup is touched.
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes devil \
  bash -s -- "$sha" "$remote_temp" "$digest" <<'REMOTE'
set -euo pipefail
umask 077
sha="$1"
filename="$2"
expected="$3"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || exit 2
[[ "$filename" =~ ^\.panel-upload-[a-f0-9]{40}-[0-9]{14}-[0-9]+\.tar\.gz$ ]] || exit 2
[[ "$expected" =~ ^[a-f0-9]{64}$ ]] || exit 2
incoming="$HOME/.salonbw-manual/incoming"
[[ -d "$incoming" && ! -L "$incoming" ]] || exit 1
tmp="$incoming/$filename"
target="$incoming/panel-dev-$sha.tar.gz"
[[ -f "$tmp" && ! -L "$tmp" ]] || exit 1
[[ ! -L "$target" ]] || exit 1
actual="$(node22 - "$tmp" <<'NODE'
const fs = require('fs'), crypto = require('crypto');
const hash = crypto.createHash('sha256');
const stream = fs.createReadStream(process.argv[2]);
stream.on('error', () => process.exit(1));
stream.on('data', (chunk) => hash.update(chunk));
stream.on('end', () => console.log(hash.digest('hex')));
NODE
)"
[[ "$actual" == "$expected" ]] || {
  echo 'REMOTE_ARTIFACT=BLOCKED digest-mismatch' >&2
  exit 1
}
mv -f -- "$tmp" "$target"
chmod 600 "$target"
echo 'REMOTE_ARTIFACT=PASS checksum-verified-atomic-replacement'
REMOTE

echo '=== Install FreeBSD runtime into private isolated staged directory ==='
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes devil \
  bash -s -- "$sha" "$digest" \
  < scripts/mydevil/manual-dev-panel-stage.sh

echo 'DEV_PANEL_STAGING=PASS'
echo 'LIVE_PANEL_DEPLOYMENT=NOT_STARTED'
echo 'PRODUCTION_MUTATIONS=NONE'
