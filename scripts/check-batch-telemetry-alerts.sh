#!/usr/bin/env bash

set -euo pipefail

LOKI_QUERY_URL="${LOKI_QUERY_URL:-https://observability.salon-bw.pl/loki/api/v1/query}"
LOKI_BASIC_AUTH="${LOKI_BASIC_AUTH:-}"
LOOKBACK_WINDOW="${LOOKBACK_WINDOW:-10m}"
CRITICAL_ERROR_THRESHOLD="${CRITICAL_ERROR_THRESHOLD:-3}"
LOKI_QUERY_TIMEOUT_SECONDS="${LOKI_QUERY_TIMEOUT_SECONDS:-12}"
FAIL_ON_OBSERVABILITY_GAP="${FAIL_ON_OBSERVABILITY_GAP:-0}"
EVIDENCE_PATH="${EVIDENCE_PATH:-batch-telemetry-evidence.json}"

slow_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"warn\"} |= \"customer statistics batch slow\"[${LOOKBACK_WINDOW}]))"
warn_failed_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"warn\"} |= \"customer statistics batch failed\"[${LOOKBACK_WINDOW}]))"
error_failed_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"error\"} |= \"customer statistics batch failed\"[${LOOKBACK_WINDOW}]))"
burst_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"error\"} |= \"customer statistics batch failure burst\"[${LOOKBACK_WINDOW}]))"

json_array_from_lines() {
  if (( "$#" == 0 )); then
    printf '[]'
    return 0
  fi
  printf '%s\n' "$@" | jq -R . | jq -s .
}

write_evidence() {
  local status="$1"
  local action="$2"
  local exit_code="$3"
  local failed_queries_json="$4"
  local slow_count="${5:-null}"
  local warn_failed_count="${6:-null}"
  local error_failed_count="${7:-null}"
  local burst_count="${8:-null}"
  local reason="${9:-}"

  jq -n \
    --arg generatedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --arg status "$status" \
    --arg action "$action" \
    --arg reason "$reason" \
    --arg lokiQueryUrl "$LOKI_QUERY_URL" \
    --arg lookbackWindow "$LOOKBACK_WINDOW" \
    --argjson criticalErrorThreshold "$CRITICAL_ERROR_THRESHOLD" \
    --argjson lokiQueryTimeoutSeconds "$LOKI_QUERY_TIMEOUT_SECONDS" \
    --argjson failOnObservabilityGap "$FAIL_ON_OBSERVABILITY_GAP" \
    --argjson exitCode "$exit_code" \
    --arg slowQuery "$slow_query" \
    --arg warnFailedQuery "$warn_failed_query" \
    --arg errorFailedQuery "$error_failed_query" \
    --arg burstQuery "$burst_query" \
    --argjson failedQueries "$failed_queries_json" \
    --argjson slowCount "$slow_count" \
    --argjson warnFailedCount "$warn_failed_count" \
    --argjson errorFailedCount "$error_failed_count" \
    --argjson burstCount "$burst_count" \
    '{
      generatedAt: $generatedAt,
      status: $status,
      action: $action,
      reason: $reason,
      config: {
        lokiQueryUrl: $lokiQueryUrl,
        lookbackWindow: $lookbackWindow,
        criticalErrorThreshold: $criticalErrorThreshold,
        lokiQueryTimeoutSeconds: $lokiQueryTimeoutSeconds,
        failOnObservabilityGap: ($failOnObservabilityGap == 1)
      },
      counts: {
        slowWarn: $slowCount,
        failedWarn4xx: $warnFailedCount,
        failedError5xxOrUnexpected: $errorFailedCount,
        failureBurstError: $burstCount
      },
      failedQueries: $failedQueries,
      queries: {
        slow: $slowQuery,
        failedWarn: $warnFailedQuery,
        failedError: $errorFailedQuery,
        burst: $burstQuery
      },
      exitCode: $exitCode
    }' > "$EVIDENCE_PATH"
}

query_count() {
  local query="$1"
  local response
  if ! response=$(
    curl -fsS --max-time "$LOKI_QUERY_TIMEOUT_SECONDS" -G "$LOKI_QUERY_URL" \
      -u "$LOKI_BASIC_AUTH" \
      --data-urlencode "query=$query"
  ); then
    return 1
  fi
  local count
  count=$(printf "%s" "$response" | jq -r '.data.result[0].value[1] // "0"')
  if ! [[ "$count" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
    return 1
  fi
  printf "%s" "$count"
}

if [[ -z "$LOKI_BASIC_AUTH" ]]; then
  echo "LOKI_BASIC_AUTH is required"
  write_evidence "config_error" "fix-workflow-secrets" 2 "[]" "null" "null" "null" "null" "missing_loki_basic_auth"
  exit 2
fi

failed_queries=()
slow_count="$(query_count "$slow_query")" || failed_queries+=("slow_query")
warn_failed_count="$(query_count "$warn_failed_query")" || failed_queries+=("warn_failed_query")
error_failed_count="$(query_count "$error_failed_query")" || failed_queries+=("error_failed_query")
burst_count="$(query_count "$burst_query")" || failed_queries+=("burst_query")
failed_queries_json="$(json_array_from_lines "${failed_queries[@]}")"

if (( ${#failed_queries[@]} > 0 )); then
  {
    echo "### Reception Batch Telemetry Check"
    echo
    echo "- status: \`degraded observability\`"
    echo "- failed queries: \`${failed_queries[*]}\`"
    echo "- action: validate Loki connectivity and rerun check"
  } >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

  if [[ "$FAIL_ON_OBSERVABILITY_GAP" == "1" ]]; then
    write_evidence \
      "critical" \
      "escalate-on-call" \
      1 \
      "$failed_queries_json" \
      "null" "null" "null" "null" \
      "observability_gap"
    echo "CRITICAL: observability gap while querying Loki (${failed_queries[*]})"
    exit 1
  fi

  write_evidence \
    "degraded_observability" \
    "validate-loki-connectivity" \
    0 \
    "$failed_queries_json" \
    "null" "null" "null" "null" \
    "observability_gap"
  echo "WARNING: observability gap while querying Loki (${failed_queries[*]})"
  exit 0
fi

{
  echo "### Reception Batch Telemetry Check"
  echo
  echo "- window: \`${LOOKBACK_WINDOW}\`"
  echo "- slow(warn): \`${slow_count}\`"
  echo "- failed warn(4xx): \`${warn_failed_count}\`"
  echo "- failed error(5xx/unexpected): \`${error_failed_count}\`"
  echo "- failure burst(error): \`${burst_count}\`"
} >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

# Route critical signals to workflow failure (can be wired to on-call notifications).
if [[ "$burst_count" != "0" ]]; then
  write_evidence \
    "critical" \
    "escalate-on-call" \
    1 \
    "$failed_queries_json" \
    "$slow_count" "$warn_failed_count" "$error_failed_count" "$burst_count" \
    "failure_burst_detected"
  echo "CRITICAL: failure burst detected (${burst_count})"
  exit 1
fi

if (( error_failed_count >= CRITICAL_ERROR_THRESHOLD )); then
  write_evidence \
    "critical" \
    "escalate-on-call" \
    1 \
    "$failed_queries_json" \
    "$slow_count" "$warn_failed_count" "$error_failed_count" "$burst_count" \
    "error_failed_threshold_exceeded"
  echo "CRITICAL: batch failed(error) count ${error_failed_count} >= ${CRITICAL_ERROR_THRESHOLD}"
  exit 1
fi

if [[ "$warn_failed_count" != "0" || "$slow_count" != "0" ]]; then
  write_evidence \
    "warning" \
    "review-in-ops" \
    0 \
    "$failed_queries_json" \
    "$slow_count" "$warn_failed_count" "$error_failed_count" "$burst_count" \
    "non_critical_signals_detected"
  echo "WARNING: non-critical telemetry signals detected"
  exit 0
fi

write_evidence \
  "ok" \
  "no-action" \
  0 \
  "$failed_queries_json" \
  "$slow_count" "$warn_failed_count" "$error_failed_count" "$burst_count" \
  "healthy_window"
echo "OK: no telemetry alerts in lookback window"
