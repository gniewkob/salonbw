#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FIXTURES=(
  "scripts/fixtures/batch-telemetry-evidence-critical.json"
  "scripts/fixtures/batch-telemetry-evidence-degraded-observability.json"
)

for fixture in "${FIXTURES[@]}"; do
  if [[ ! -f "$fixture" ]]; then
    echo "ERROR: missing fixture: $fixture" >&2
    exit 1
  fi

  jq -e '.status | type == "string"' "$fixture" >/dev/null
  jq -e '.action | type == "string" and length > 0' "$fixture" >/dev/null
  jq -e '.reason | type == "string" and length > 0' "$fixture" >/dev/null
  jq -e '.config.lookbackWindow | type == "string" and length > 0' "$fixture" >/dev/null
  jq -e '(.queries | type == "object" and has("slow") and has("failedWarn") and has("failedError") and has("burst"))' "$fixture" >/dev/null
  jq -e '.exitCode | type == "number"' "$fixture" >/dev/null

  status="$(jq -r '.status' "$fixture")"
  case "$status" in
    critical|warning|degraded_observability|ok|config_error)
      ;;
    *)
      echo "ERROR: unsupported status '$status' in $fixture" >&2
      exit 1
      ;;
  esac

  if [[ "$status" == "degraded_observability" ]]; then
    jq -e '
      (.counts.slowWarn == null) and
      (.counts.failedWarn4xx == null) and
      (.counts.failedError5xxOrUnexpected == null) and
      (.counts.failureBurstError == null)
    ' "$fixture" >/dev/null
  else
    jq -e '
      (.counts.slowWarn | type == "number") and
      (.counts.failedWarn4xx | type == "number") and
      (.counts.failedError5xxOrUnexpected | type == "number") and
      (.counts.failureBurstError | type == "number")
    ' "$fixture" >/dev/null
  fi

done

echo "OK: batch telemetry fixtures schema checks passed"
