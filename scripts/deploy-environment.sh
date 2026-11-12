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
# GitHub Actions headSha identifies the workflow source, NOT the -f ref release.
# This distinction is required for production rollback to an older version.
workflow_sha=""
historical_dev_recovery=false
if [[ "${4:-}" == --execute ]]; then
  if [[ "$deploy_env" == staging && -z "${DEPLOY_WORKFLOW_REF:-}" ]]; then
    echo 'Development --execute requires an explicit DEPLOY_WORKFLOW_REF for source-locked deployments' >&2
    exit 2
  fi
  if ! workflow_sha="$(gh api "repos/gniewkob/salonbw/commits/$workflow_ref" --jq .sha)"; then
    echo 'Cannot resolve deployment workflow revision; refusing dispatch' >&2
    exit 2
  fi
  if [[ ! "$workflow_sha" =~ ^[a-f0-9]{40}$ ]]; then
    echo 'Invalid deployment workflow revision; refusing dispatch' >&2
    exit 2
  fi
  # Normal DEV deployments must use exactly the checked application SHA.
  # Historical DEV recovery is different: use CURRENT approved master workflow
  # with an earlier master-ancestor release, never an old workflow missing
  # the no-snapshot and provider quota safety guards.
  if [[ "$deploy_env" == staging && "$workflow_sha" != "$release_sha" ]]; then
    if [[ "${DEV_HISTORICAL_REDEPLOY_APPROVED:-}" != true || "$workflow_ref" != master ]]; then
      echo 'Development workflow ref must resolve to the EXACT release commit SHA; historical recovery requires DEV_HISTORICAL_REDEPLOY_APPROVED=true with DEPLOY_WORKFLOW_REF=master' >&2
      exit 2
    fi
    # Prevent a pre-merge or legacy master workflow from restoring with the
    # old snapshot logic or without the provider's account-quota guard.
    if ! workflow_source="$(gh api "repos/gniewkob/salonbw/contents/.github/workflows/deploy.yml?ref=${workflow_sha}" -H 'Accept: application/vnd.github.raw+json')"; then
      echo 'Cannot inspect approved workflow policy; refusing historical DEV recovery' >&2
      exit 2
    fi
    if ! grep -Fq 'name: DEV disk preflight (no deployment snapshots)' <<< "$workflow_source" ||
       ! grep -Fq 'git show "$GITHUB_SHA:scripts/ci/check-mydevil-dev-quota.cjs"' <<< "$workflow_source" ||
       grep -Fq 'staging-release-snapshot.sh' <<< "$workflow_source"; then
      echo 'The master workflow does not contain verified snapshotless DEV recovery safeguards' >&2
      exit 2
    fi
    if ! merge_base="$(gh api "repos/gniewkob/salonbw/compare/${release_sha}...${workflow_sha}" --jq .merge_base_commit.sha)"; then
      echo 'Cannot verify historical DEV release ancestry; refusing recovery' >&2
      exit 2
    fi
    if [[ "$merge_base" != "$release_sha" ]]; then
      echo 'Historical DEV release must be an ancestor of the approved master workflow; refusing recovery' >&2
      exit 2
    fi
    historical_dev_recovery=true
    echo "Approved historical DEV recovery: application SHA=$release_sha, workflow SHA=$workflow_sha"
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
  dispatch_inputs=(-f "ref=$release_sha" -f "environment=$deploy_env" -f "target=$deploy_target")
  if [[ "$historical_dev_recovery" == true ]]; then
    dispatch_inputs+=(-f historical_dev_recovery=true -f "historical_dev_workflow_sha=$workflow_sha")
  fi
  if ! gh workflow run deploy.yml --ref "$workflow_ref" "${dispatch_inputs[@]}"; then
    deploy_statuses[i]=BLOCKED
    echo "Failed to dispatch $deploy_target; no previously deployed application was rolled back." >&2
    exit 1
  fi
  run_id=''
  # Only a new dispatch on our workflow revision can satisfy this wait.
  for attempt in {1..30}; do
    run_id="$(gh run list --workflow deploy.yml --branch "$workflow_ref" --event workflow_dispatch --limit 20 --json databaseId,createdAt,displayTitle,headSha | jq -r --arg since "$dispatched_at" --arg sha "$release_sha" --arg workflow_sha "$workflow_sha" --arg target "$deploy_target" --arg env "$deploy_env" '[.[] | select(.createdAt >= $since) | select(.headSha == $workflow_sha) | select(.displayTitle | contains($sha)) | select(.displayTitle | contains($target)) | select(.displayTitle | contains($env))] | sort_by(.databaseId) | first | .databaseId // empty')"
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
    echo "No automatic DEV snapshot rollback: inspect the affected runtime, confirm DB/API compatibility, then use an approved recovery plan." >&2
    exit 1
  fi
done
