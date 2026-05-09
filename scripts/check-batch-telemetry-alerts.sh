#!/usr/bin/env bash

set -euo pipefail

LOKI_QUERY_URL="${LOKI_QUERY_URL:-https://observability.salon-bw.pl/loki/api/v1/query}"
LOKI_BASIC_AUTH="${LOKI_BASIC_AUTH:-}"
LOOKBACK_WINDOW="${LOOKBACK_WINDOW:-10m}"
CRITICAL_ERROR_THRESHOLD="${CRITICAL_ERROR_THRESHOLD:-3}"

if [[ -z "$LOKI_BASIC_AUTH" ]]; then
  echo "LOKI_BASIC_AUTH is required"
  exit 2
fi

query_count() {
  local query="$1"
  local response
  response=$(
    curl -fsS -G "$LOKI_QUERY_URL" \
      -u "$LOKI_BASIC_AUTH" \
      --data-urlencode "query=$query"
  )
  local count
  count=$(printf "%s" "$response" | jq -r '.data.result[0].value[1] // "0"')
  printf "%s" "$count"
}

slow_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"warn\"} |= \"customer statistics batch slow\"[${LOOKBACK_WINDOW}]))"
warn_failed_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"warn\"} |= \"customer statistics batch failed\"[${LOOKBACK_WINDOW}]))"
error_failed_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"error\"} |= \"customer statistics batch failed\"[${LOOKBACK_WINDOW}]))"
burst_query="sum(count_over_time({service=\"salonbw-backend\",environment=\"production\",level=\"error\"} |= \"customer statistics batch failure burst\"[${LOOKBACK_WINDOW}]))"

slow_count="$(query_count "$slow_query")"
warn_failed_count="$(query_count "$warn_failed_query")"
error_failed_count="$(query_count "$error_failed_query")"
burst_count="$(query_count "$burst_query")"

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
  echo "CRITICAL: failure burst detected (${burst_count})"
  exit 1
fi

if (( error_failed_count >= CRITICAL_ERROR_THRESHOLD )); then
  echo "CRITICAL: batch failed(error) count ${error_failed_count} >= ${CRITICAL_ERROR_THRESHOLD}"
  exit 1
fi

if [[ "$warn_failed_count" != "0" || "$slow_count" != "0" ]]; then
  echo "WARNING: non-critical telemetry signals detected"
  exit 0
fi

echo "OK: no telemetry alerts in lookback window"
