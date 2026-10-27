#!/usr/bin/env bash
set -euo pipefail
# Build and deploy one immutable revision; all means API success before frontends.
usage() { echo 'Usage: scripts/deploy-environment.sh <production|development> <api|landing|panel|frontends|all> <commit> [--execute]'; }
[[ $# -ge 3 && $# -le 4 ]] || { usage >&2; exit 2; }
case "$1" in production) deploy_env=production;; development) deploy_env=staging;; *) usage >&2; exit 2;; esac
# Production stays unchanged. Development always dispatches ONE application
# per workflow run; successful siblings keep their release when another fails.
case "$2" in
  api|landing|panel) deploy_targets=("$2");;
  frontends)
    if [[ "$deploy_env" == staging ]]; then deploy_targets=(panel landing)
    else deploy_targets=(frontends); fi;;
  all)
    if [[ "$deploy_env" == staging ]]; then deploy_targets=(api panel landing)
    else deploy_targets=(api frontends); fi;;
  *) usage >&2; exit 2;;
esac
release_sha="$(git rev-parse --verify "$3^{commit}")"
workflow_ref="${DEPLOY_WORKFLOW_REF:-master}"
[[ "$release_sha" =~ ^[a-f0-9]{40}$ ]] || exit 2
# Until the selective workflow is merged, development must explicitly choose
# the matching workflow revision; silently falling back to master is unsafe.
if [[ "$deploy_env" == staging && "${4:-}" == --execute ]]; then
  if [[ -z "${DEPLOY_WORKFLOW_REF:-}" ]]; then
    echo 'Development --execute requires an explicit DEPLOY_WORKFLOW_REF with selective recovery support' >&2
    exit 2
  fi
  # A supplied ref is NOT proof that its workflow has snapshot/rollback steps.
  # Require its actual GitHub commit to match the immutable source release.
  # This refuses an old master workflow during unmerged development releases.
  if ! workflow_sha="$(gh api "repos/gniewkob/salonbw/commits/$workflow_ref" --jq .sha)"; then
    echo 'Cannot verify development deployment workflow revision; refusing dispatch' >&2
    exit 2
  fi
  if [[ ! "$workflow_sha" =~ ^[a-f0-9]{40}$ || "$workflow_sha" != "$release_sha" ]]; then
    echo 'Development workflow ref must resolve to the EXACT release commit SHA; refusing dispatch' >&2
    exit 2
  fi
fi
for deploy_target in "${deploy_targets[@]}"; do
  GITHUB_OUTPUT= DEPLOY_ENV="$deploy_env" DEPLOY_TARGET="$deploy_target" node scripts/ci/deployment-config.mjs
done
if [[ "${4:-}" != --execute ]]; then
  [[ $# -eq 3 ]] || { usage >&2; exit 2; }
  echo 'Preview only. Add --execute to dispatch and wait for successful deployments.'
  exit 0
fi
# The status report belongs to DEPLOYMENT, not to business UAT.
# No component is treated as passed merely because another component passed.
deploy_statuses=()
deploy_run_ids=()
for deploy_target in "${deploy_targets[@]}"; do
  deploy_statuses+=("NOT_RUN")
  deploy_run_ids+=("-")
done
print_development_statuses() {
  [[ "$deploy_env" == staging ]] || return 0
  echo "DEV per-application deployment status (not UAT acceptance):"
  for i in "${!deploy_targets[@]}"; do
    printf '  %s: %s (GitHub run: %s)\n' "${deploy_targets[i]}" "${deploy_statuses[i]}" "${deploy_run_ids[i]}"
  done
  echo "Successful components stay deployed; validate cross-app API compatibility before UAT."
}
trap print_development_statuses EXIT

for i in "${!deploy_targets[@]}"; do
  deploy_target="${deploy_targets[i]}"
  dispatched_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if ! gh workflow run deploy.yml --ref "$workflow_ref" -f ref="$release_sha" -f environment="$deploy_env" -f target="$deploy_target"; then
    deploy_statuses[i]=BLOCKED
    echo "Failed to dispatch $deploy_target; no previously deployed application was rolled back." >&2
    exit 1
  fi
  run_id=''
  # Only a new dispatch on our workflow revision can satisfy this wait.
  for attempt in {1..30}; do
    run_id="$(gh run list --workflow deploy.yml --branch "$workflow_ref" --event workflow_dispatch --limit 20 --json databaseId,createdAt,displayTitle | jq -r --arg since "$dispatched_at" --arg sha "$release_sha" --arg target "$deploy_target" --arg env "$deploy_env" '[.[] | select(.createdAt >= $since) | select(.displayTitle | contains($sha)) | select(.displayTitle | contains($target)) | select(.displayTitle | contains($env))] | sort_by(.databaseId) | first | .databaseId // empty')"
    [[ -n "$run_id" ]] && break
    sleep 2
  done
  if [[ -z "$run_id" ]]; then
    deploy_statuses[i]=BLOCKED
    echo "Cannot identify $deploy_target deployment; manual verification required." >&2
    exit 1
  fi
  deploy_run_ids[i]="$run_id"
  if gh run watch "$run_id" --exit-status --interval 20; then
    deploy_statuses[i]=PASS
  else
    deploy_statuses[i]=BLOCKED
    echo "Component $deploy_target failed; prior PASS components remain deployed." >&2
    echo "Check this run's rollback and verify shared API compatibility before retrying." >&2
    exit 1
  fi
done
