#!/usr/bin/env bash
set -euo pipefail

# Monitor CI + Deploy (MyDevil) runs for a given commit SHA on master.
# Usage:
#   scripts/monitor-master-runs.sh [sha_prefix]
# Examples:
#   scripts/monitor-master-runs.sh
#   scripts/monitor-master-runs.sh 62076e9a

SHA_PREFIX="${1:-$(git rev-parse --short=8 HEAD)}"
POLL_SECONDS="${POLL_SECONDS:-20}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1800}"

start_ts="$(date +%s)"

echo "Monitoring runs for SHA prefix: ${SHA_PREFIX}"
echo "Poll interval: ${POLL_SECONDS}s | Timeout: ${TIMEOUT_SECONDS}s"

get_runs() {
  gh run list \
    --branch master \
    --limit 30 \
    --json databaseId,workflowName,headSha,status,conclusion,url \
    | jq -c --arg sha "${SHA_PREFIX}" '
        map(select(.headSha | startswith($sha)))
        | map(select(.workflowName == "CI" or .workflowName == "Deploy (MyDevil)"))
      '
}

while true; do
  now_ts="$(date +%s)"
  elapsed="$((now_ts - start_ts))"
  if (( elapsed > TIMEOUT_SECONDS )); then
    echo "Timeout after ${elapsed}s."
    exit 124
  fi

  runs_json="$(get_runs)"
  run_count="$(echo "${runs_json}" | jq 'length')"

  if [[ "${run_count}" -eq 0 ]]; then
    echo "No CI/Deploy runs found yet for ${SHA_PREFIX} (elapsed ${elapsed}s)..."
    sleep "${POLL_SECONDS}"
    continue
  fi

  echo
  echo "Elapsed: ${elapsed}s"
  echo "${runs_json}" | jq -r '.[] | "\(.workflowName)\t\(.databaseId)\t\(.status)\t\(.conclusion // "-")\t\(.url)"'

  ci_status="$(echo "${runs_json}" | jq -r '.[] | select(.workflowName=="CI") | .status' | tail -n1)"
  ci_conclusion="$(echo "${runs_json}" | jq -r '.[] | select(.workflowName=="CI") | .conclusion // ""' | tail -n1)"
  deploy_status="$(echo "${runs_json}" | jq -r '.[] | select(.workflowName=="Deploy (MyDevil)") | .status' | tail -n1)"
  deploy_conclusion="$(echo "${runs_json}" | jq -r '.[] | select(.workflowName=="Deploy (MyDevil)") | .conclusion // ""' | tail -n1)"

  if [[ "${ci_status}" == "completed" && "${deploy_status}" == "completed" ]]; then
    if [[ "${ci_conclusion}" == "success" && "${deploy_conclusion}" == "success" ]]; then
      echo
      echo "Done: CI and Deploy are successful for ${SHA_PREFIX}."
      exit 0
    fi
    echo
    echo "Completed with failure."
    [[ "${ci_conclusion}" != "success" ]] && echo "CI: ${ci_conclusion}"
    [[ "${deploy_conclusion}" != "success" ]] && echo "Deploy: ${deploy_conclusion}"
    exit 1
  fi

  sleep "${POLL_SECONDS}"
done
