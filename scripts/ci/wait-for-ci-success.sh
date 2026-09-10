#!/usr/bin/env bash
set -euo pipefail

SHA="${1:-}"
REPOSITORY="${GITHUB_REPOSITORY:-}"
POLL_SECONDS="${POLL_SECONDS:-30}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-1800}"

if [[ ! "$SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: expected a full 40-character commit SHA" >&2
  exit 2
fi
if [[ -z "$REPOSITORY" ]]; then
  echo "ERROR: GITHUB_REPOSITORY is required" >&2
  exit 2
fi

started_at="$(date +%s)"
while true; do
  runs="$(gh run list \
    --repo "$REPOSITORY" \
    --workflow CI \
    --commit "$SHA" \
    --limit 20 \
    --json databaseId,headSha,status,conclusion,url)"
  run="$(jq -c --arg sha "$SHA" '
    map(select(.headSha == $sha)) | first // empty
  ' <<<"$runs")"

  if [[ -n "$run" ]]; then
    status="$(jq -r '.status' <<<"$run")"
    conclusion="$(jq -r '.conclusion // ""' <<<"$run")"
    run_id="$(jq -r '.databaseId' <<<"$run")"
    run_url="$(jq -r '.url' <<<"$run")"
    echo "CI run $run_id for $SHA: $status ${conclusion:-pending} ($run_url)"

    if [[ "$status" == "completed" ]]; then
      if [[ "$conclusion" == "success" ]]; then
        exit 0
      fi
      echo "ERROR: CI for $SHA completed with conclusion: $conclusion" >&2
      exit 1
    fi
  else
    echo "Waiting for CI run registered for $SHA"
  fi

  now="$(date +%s)"
  if (( now - started_at >= TIMEOUT_SECONDS )); then
    echo "ERROR: timed out waiting for successful CI for $SHA" >&2
    exit 124
  fi
  sleep "$POLL_SECONDS"
done
