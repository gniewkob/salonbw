#!/usr/bin/env bash
# Package an immutable DEV API build on Mac. No host, database, or runtime changes.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash scripts/ci/package-manual-dev-api.sh <40-char-sha> <branch> <absolute-output-dir>' >&2
  exit 2
}
[[ $# -eq 3 ]] || usage
sha="$1"
branch="$2"
out_dir="$3"
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$branch" =~ ^[a-zA-Z0-9][a-zA-Z0-9_./-]*$ ]] || usage
[[ "$branch" != *..* && "$branch" != */ && "$branch" != *//* ]] || usage
[[ "$out_dir" == /* && "$out_dir" != / && ! -L "$out_dir" ]] || usage

repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
cd "$repo"
for tool in git node pnpm tar gitleaks shasum mktemp; do
  command -v "$tool" >/dev/null || {
    echo "DEV_API_PACKAGE=BLOCKED missing-tool=$tool" >&2
    exit 1
  }
done
remote_sha="$(git ls-remote https://github.com/gniewkob/salonbw.git "refs/heads/$branch" |
  awk -v ref="refs/heads/$branch" '$2 == ref {print $1}')"
[[ "$remote_sha" == "$sha" ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED branch-head-mismatch' >&2
  exit 1
}
git cat-file -e "$sha^{commit}" || {
  echo 'DEV_API_PACKAGE=BLOCKED source-commit-missing' >&2
  exit 1
}

node_bin="$(bash "$repo/scripts/ci/resolve-local-node.sh" 22)"
export PATH="$(dirname "$node_bin"):$PATH"
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED node22-required' >&2
  exit 1
}
[[ "$(pnpm --version)" == 10.14.0 ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED pnpm-10.14.0-required' >&2
  exit 1
}

mkdir -p "$out_dir"
[[ -d "$out_dir" && ! -L "$out_dir" ]] || usage
out_dir="$(cd "$out_dir" && pwd -P)"
archive="$out_dir/api-dev-$sha.tar.gz"
digest="$archive.sha256"
[[ ! -e "$archive" && ! -L "$archive" && ! -e "$digest" && ! -L "$digest" ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED artifact-already-exists' >&2
  exit 1
}

tmp="$(mktemp -d /tmp/salonbw-api-package.XXXXXXXX)"
worktree="$tmp/source"
bundle="$tmp/bundle"
created=false
complete=false
cleanup() {
  if [[ "$created" == true ]]; then
    git -C "$repo" worktree remove --force "$worktree" >/dev/null 2>&1 || true
  fi
  if [[ "$complete" != true ]]; then
    rm -f -- "$archive" "$digest"
  fi
  rm -rf -- "$tmp"
}
trap cleanup EXIT
git -C "$repo" worktree add --detach "$worktree" "$sha" >/dev/null
created=true
cd "$worktree"

base="$(git merge-base origin/master "$sha")"
[[ "$base" =~ ^[a-f0-9]{40}$ ]] || exit 1
gitleaks git --redact=100 --no-banner --log-opts="$base..$sha" .
gitleaks dir --redact=100 --no-banner .
HUSKY=0 pnpm install --frozen-lockfile

# The source-lock applies to the API, not to the ops worktree.
node "$repo/scripts/ci/check-api-production-dependencies.cjs" \
  --manifest-only backend/salonbw-backend/package.json
pnpm --filter salonbw-backend build
api_root="backend/salonbw-backend"
[[ -f "$api_root/dist/src/main.js" || -f "$api_root/dist/main.js" ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED compiled-entrypoint-missing' >&2
  exit 1
}
[[ -f "$api_root/dist/src/migrate.js" || -f "$api_root/dist/migrate.js" ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED compiled-migration-entrypoint-missing' >&2
  exit 1
}
[[ -f "$api_root/app.js" && -f "$api_root/package.json" ]] || exit 1

mkdir -p "$bundle"
cp -R "$api_root/dist" "$bundle/dist"
cp "$api_root/package.json" "$api_root/app.js" "$bundle/"

# The host installs FreeBSD-native dependencies in a private stage directory.
# Deliberately exclude Mac node_modules, .env, personal files, and uploads.
node - "$bundle" "$sha" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const root = process.argv[2];
const sha = process.argv[3];
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.name !== 'salonbw-backend') process.exit(1);
fs.writeFileSync(path.join(root, '.salonbw-api-release.json'), JSON.stringify({
  sha, environment: 'development', target: 'api'
}) + '\n', {flag: 'wx', mode: 0o600});
NODE

[[ ! -e "$bundle/.env" && ! -e "$bundle/node_modules" ]] || {
  echo 'DEV_API_PACKAGE=BLOCKED forbidden-runtime-files' >&2
  exit 1
}
COPYFILE_DISABLE=1 tar -czf "$archive" -C "$bundle" .
tar -tzf "$archive" >/dev/null
if tar -tvzf "$archive" | awk '$1 ~ /^[lh]/ {found=1} END {exit !found}'; then
  echo 'DEV_API_PACKAGE=BLOCKED archive-contains-links' >&2
  exit 1
fi
shasum -a 256 "$archive" | awk '{print $1}' > "$digest"
chmod 600 "$archive" "$digest"
complete=true
printf 'DEV_API_PACKAGE=PASS sha=%s\n' "$sha"
printf 'DEV_API_ARTIFACT=%s\n' "$archive"
printf 'DEV_API_ARTIFACT_SHA256=%s\n' "$(cat "$digest")"
printf 'HOST_RUNTIME_MUTATIONS=NONE\n'
printf 'DATABASE_MUTATIONS=NONE\n'
printf 'PASSENGER_RESTART=NOT_STARTED\n'
printf 'ACTIVATION=NOT_STARTED\n'
