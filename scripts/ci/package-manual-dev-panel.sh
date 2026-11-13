#!/usr/bin/env bash
# Build and package the exact Studio V18 commit on Mac for MyDevil DEV.
# No production configuration, macOS node_modules, or secrets in the archive.
set -euo pipefail
umask 077

usage() {
  echo 'Usage: bash package-manual-dev-panel.sh <sha> <branch> <absolute-output-dir>' >&2
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
for tool in git node pnpm tar gitleaks shasum; do
  command -v "$tool" >/dev/null || {
    echo "PANEL_PACKAGE=BLOCKED missing_tool=$tool" >&2
    exit 1
  }
done
source_sha="$(git ls-remote https://github.com/gniewkob/salonbw.git "refs/heads/$branch" |
  awk -v ref="refs/heads/$branch" '$2 == ref {print $1}')"
[[ "$source_sha" == "$sha" ]] || {
  echo 'PANEL_PACKAGE=BLOCKED branch-head-mismatch' >&2
  exit 1
}
git cat-file -e "$sha^{commit}" || {
  echo 'PANEL_PACKAGE=BLOCKED missing-local-sha' >&2
  exit 1
}

node_bin="$(bash "$repo/scripts/ci/resolve-local-node.sh" 22)"
export PATH="$(dirname "$node_bin"):$PATH"
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] || exit 1
[[ "$(pnpm --version)" == 10.14.0 ]] || exit 1

mkdir -p "$out_dir"
[[ ! -L "$out_dir" && -d "$out_dir" ]] || exit 1
out_dir="$(cd "$out_dir" && pwd -P)"
archive="$out_dir/panel-dev-$sha.tar.gz"
digest="$archive.sha256"
[[ ! -e "$archive" && ! -L "$archive" && ! -e "$digest" && ! -L "$digest" ]] || {
  echo 'PANEL_PACKAGE=BLOCKED archive-already-exists' >&2
  exit 1
}

temp="$(mktemp -d /tmp/salonbw-panel-package.XXXXXXXX)"
worktree="$temp/source"
bundle="$temp/bundle"
created=false
complete=false
cleanup() {
  if [[ "$created" == true ]]; then
    git -C "$repo" worktree remove --force "$worktree" >/dev/null 2>&1 || true
  fi
  if [[ "$complete" != true ]]; then
    rm -f -- "$archive" "$digest"
  fi
  rm -rf -- "$temp"
}
trap cleanup EXIT
git worktree add --detach "$worktree" "$sha" >/dev/null
created=true
cd "$worktree"

base="$(git merge-base origin/master "$sha")"
gitleaks git --redact=100 --no-banner --log-opts="$base..$sha" .
gitleaks dir --redact=100 --no-banner .
HUSKY=0 pnpm install --frozen-lockfile

NEXT_PUBLIC_API_URL=/api \
API_PROXY_URL=https://dev-api.salon-bw.pl \
NEXT_PUBLIC_DEPLOYMENT_ENV=development \
NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_ \
NEXT_PUBLIC_LANDING_URL=https://dev.salon-bw.pl \
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false \
NEXT_PANEL_HTML_NOSTORE=true \
NEXT_PUBLIC_SENTRY_DSN='' \
pnpm --filter @salonbw/panel build

test -s apps/panel/.next/BUILD_ID
test -f apps/panel/app.cjs
test -d apps/panel/public
test -f packages/api/package.json

mkdir -p "$bundle/packages" "$bundle/src"
cp -R apps/panel/.next "$bundle/.next"
rm -rf -- "$bundle/.next/cache"
cp -R apps/panel/public "$bundle/public"
cp -R packages/api "$bundle/packages/api"
cp apps/panel/package.json apps/panel/next.config.mjs apps/panel/app.cjs "$bundle/"
if [[ -f apps/panel/app.js ]]; then cp apps/panel/app.js "$bundle/"; fi
if [[ -f apps/panel/src/middleware.ts ]]; then
  cp apps/panel/src/middleware.ts "$bundle/src/"
fi
if [[ -d apps/panel/scripts ]]; then
  cp -R apps/panel/scripts "$bundle/scripts"
fi

# npm22 cannot resolve workspace:* outside the monorepo.
node - "$bundle/package.json" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
const p = JSON.parse(fs.readFileSync(file, 'utf8'));
if (p.name !== '@salonbw/panel' ||
    p.dependencies?.['@salonbw/api'] !== 'workspace:*') {
    throw new Error('Unexpected panel dependency manifest');
}
p.dependencies['@salonbw/api'] = 'file:./packages/api';
fs.writeFileSync(file, JSON.stringify(p, null, 2) + '\n');
NODE

APP_RELEASE="$sha" FRONTEND_ENVIRONMENT=development \
UPSTREAM_API=https://dev-api.salon-bw.pl \
node scripts/ci/frontend-release-metadata.mjs "$bundle"

[[ ! -e "$bundle/.env.runtime.json" && ! -e "$bundle/node_modules" ]] || {
  echo 'PANEL_PACKAGE=BLOCKED private-or-native-files-in-bundle' >&2
  exit 1
}

COPYFILE_DISABLE=1 tar -czf "$archive" -C "$bundle" .
tar -tzf "$archive" >/dev/null
shasum -a 256 "$archive" | awk '{print $1}' > "$digest"
chmod 600 "$archive" "$digest"
complete=true
printf 'PANEL_PACKAGE=PASS sha=%s\n' "$sha"
printf 'PANEL_ARTIFACT=%s\n' "$archive"
printf 'PANEL_ARTIFACT_SHA256=%s\n' "$(cat "$digest")"
printf 'HOST_RUNTIME_MUTATIONS=NONE\n'
