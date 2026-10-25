#!/usr/bin/env bash
set -euo pipefail
# Build and deploy one immutable revision; all means API success before frontends.
usage() { echo 'Usage: scripts/deploy-environment.sh <production|development> <api|landing|panel|frontends|all> <commit> [--execute]'; }
[[ $# -ge 3 && $# -le 4 ]] || { usage >&2; exit 2; }
case "$1" in production) deploy_env=production;; development) deploy_env=staging;; *) usage >&2; exit 2;; esac
case "$2" in api|landing|panel|frontends) deploy_targets=("$2");; all) deploy_targets=(api frontends);; *) usage >&2; exit 2;; esac
release_sha="$(git rev-parse --verify "$3^{commit}")"
workflow_ref="${DEPLOY_WORKFLOW_REF:-master}"
[[ "$release_sha" =~ ^[a-f0-9]{40}$ ]] || exit 2
for deploy_target in "${deploy_targets[@]}"; do
  GITHUB_OUTPUT= DEPLOY_ENV="$deploy_env" DEPLOY_TARGET="$deploy_target" node scripts/ci/deployment-config.mjs
 done
if [[ "${4:-}" != --execute ]]; then
  [[ $# -eq 3 ]] || { usage >&2; exit 2; }
  echo 'Preview only. Add --execute to dispatch and wait for successful deployments.'
  exit 0
fi
for deploy_target in "${deploy_targets[@]}"; do
  dispatched_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  gh workflow run deploy.yml --ref "$workflow_ref" -f ref="$release_sha" -f environment="$deploy_env" -f target="$deploy_target"
  run_id=''
  # Only a new dispatch on our workflow revision can satisfy this wait.
  for attempt in {1..30}; do
    run_id="$(gh run list --workflow deploy.yml --branch "$workflow_ref" --event workflow_dispatch --limit 20 --json databaseId,createdAt,displayTitle | jq -r --arg since "$dispatched_at" --arg sha "$release_sha" --arg target "$deploy_target" --arg env "$deploy_env" '[.[] | select(.createdAt >= $since) | select(.displayTitle | contains($sha)) | select(.displayTitle | contains($target)) | select(.displayTitle | contains($env))] | sort_by(.databaseId) | first | .databaseId // empty')"
    [[ -n "$run_id" ]] && break
    sleep 2
  done
  [[ -n "$run_id" ]] || { echo 'Cannot identify dispatched deployment; refusing to continue' >&2; exit 1; }
  gh run watch "$run_id" --exit-status --interval 20
 done
