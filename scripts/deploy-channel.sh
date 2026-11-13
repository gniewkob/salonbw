#!/usr/bin/env bash
# Unified deployment entrypoint. Fail closed when fallback activation is unsafe.
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: bash scripts/deploy-channel.sh <development|production> <api|panel|landing> <branch> <40-char-sha> [auto|actions|mydevil] [--plan|--prepare|--execute]
  --plan    Read GitHub status and print route. No host mutations.
  --prepare Actions: preview; MyDevil: verified Git source transfer and read-only DEV preflight.
  --execute Actions: dispatch existing deployment; MyDevil: NO-GO until safe activation is reviewed.
USAGE
  exit 2
}
[[ $# -ge 4 && $# -le 6 ]] || usage
environment="$1"
target="$2"
branch="$3"
sha="$4"
mode=auto
operation=--plan
if [[ $# -ge 5 ]]; then mode="$5"; fi
if [[ $# -eq 6 ]]; then operation="$6"; fi

[[ "$environment" == development || "$environment" == production ]] || usage
[[ "$target" == api || "$target" == panel || "$target" == landing ]] || usage
[[ "$branch" =~ ^[a-zA-Z0-9][a-zA-Z0-9_./-]*$ ]] || usage
[[ "$branch" != *..* && "$branch" != */ && "$branch" != *//* ]] || usage
[[ "$sha" =~ ^[a-f0-9]{40}$ ]] || usage
[[ "$mode" == auto || "$mode" == actions || "$mode" == mydevil ]] || usage
[[ "$operation" == --plan || "$operation" == --prepare || "$operation" == --execute ]] || usage

repo_root="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$repo_root"
[[ -f "scripts/ci/deployment-channel.mjs" ]] || {
  echo 'Missing reviewed GitHub Actions channel detector' >&2
  exit 1
}

if [[ "$mode" == auto ]]; then
  # Never treat failed CI tests or an inaccessible API as billing lock.
  decision="$(node scripts/ci/deployment-channel.mjs)" || {
    echo 'DEPLOY_CHANNEL=BLOCKED: Cannot prove Actions status' >&2
    exit 1
  }
  mode="$(printf '%s\n' "$decision" | node -e '
    let raw = "";
    process.stdin.on("data", c => raw += c);
    process.stdin.on("end", () => {
      const d = JSON.parse(raw);
      console.log(d.channel === "mydevil" ? "mydevil" :
                  d.channel === "actions" ? "actions" : "blocked");
    });
  ')"
  [[ "$mode" != blocked ]] || {
    echo 'DEPLOY_CHANNEL=BLOCKED: no reliable runner/billing-lock evidence' >&2
    exit 1
  }
fi

# No automatic or manual PROD bypass on an Actions billing lock.
if [[ "$mode" == mydevil && "$environment" != development ]]; then
  echo 'DEPLOY_CHANNEL=BLOCKED: manual PROD promotion is not authorized' >&2
  exit 1
fi

# Reject unsupported activation BEFORE any remote source or host write.
if [[ "$operation" == --execute && "$mode" == mydevil ]]; then
  echo 'MANUAL_ACTIVATION=NO_GO: runtime activation is not yet implemented or validated' >&2
  exit 1
fi

printf 'DEPLOY_CHANNEL=%s\n' "$mode"
printf 'DEPLOY_ENVIRONMENT=%s\n' "$environment"
printf 'DEPLOY_TARGET=%s\n' "$target"
printf 'DEPLOY_SOURCE_SHA=%s\n' "$sha"

if [[ "$operation" == --plan ]]; then
  echo 'DEPLOYMENT=NOT_STARTED'
  exit 0
fi

git cat-file -e "$sha^{commit}" || {
  echo 'Exact source SHA absent in local Git clone' >&2
  exit 1
}

if [[ "$mode" == actions ]]; then
  # Keep the existing SHA gates and GitHub environment approvals.
  if [[ "$operation" == --prepare ]]; then
    bash scripts/deploy-environment.sh "$environment" "$target" "$sha"
  elif [[ "$environment" == development ]]; then
    DEPLOY_WORKFLOW_REF="$branch" bash scripts/deploy-environment.sh \
      "$environment" "$target" "$sha" --execute
  else
    DEPLOY_WORKFLOW_REF=master bash scripts/deploy-environment.sh \
      "$environment" "$target" "$sha" --execute
  fi
  exit 0
fi

[[ "$operation" == --prepare ]] || {
  echo 'Unsupported manual operation' >&2
  exit 1
}

# Local tests before any MyDevil source transfer.
bash -n scripts/mydevil/git-source-sync.sh
bash -n scripts/mydevil/manual-dev-preflight.sh
bash scripts/ci/git-source-sync.test.sh
bash scripts/ci/manual-dev-preflight.test.sh
node --test scripts/ci/deployment-channel.test.mjs

host="vetternkraft@s0.mydevil.net"
remote_sha="$(git ls-remote \
  https://github.com/gniewkob/salonbw.git "refs/heads/$branch" |
  awk -v ref="refs/heads/$branch" '$2 == ref {print $1}')"
[[ "$remote_sha" == "$sha" ]] || {
  echo 'Source branch HEAD changed since approval' >&2
  exit 1
}

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$host" bash -s -- \
  "$branch" "$sha" --check < scripts/mydevil/git-source-sync.sh
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$host" bash -s -- \
  "$branch" "$sha" --sync < scripts/mydevil/git-source-sync.sh
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$host" bash -s -- \
  "$sha" "$target" < scripts/mydevil/manual-dev-preflight.sh

echo 'MANUAL_SOURCE_PREPARATION=PASS'
echo 'DEPLOYMENT=NOT_STARTED (activation remains a separate release gate)'
