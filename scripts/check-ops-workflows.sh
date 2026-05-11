#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OPS_WORKFLOWS=(
  ".github/workflows/ops_batch_stats_alerts.yml"
  ".github/workflows/ops_batch_stats_incident_ticket.yml"
  ".github/workflows/ops_batch_stats_incident_sla.yml"
  ".github/workflows/ops_batch_stats_incident_closure_guard.yml"
  ".github/workflows/ops_batch_stats_drill.yml"
  ".github/workflows/ops_workflow_noise_guard.yml"
)

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "ERROR: missing file: $file" >&2
    exit 1
  fi
}

require_pattern() {
  local file="$1"
  local pattern="$2"
  local description="$3"
  if ! rg -q "$pattern" "$file"; then
    echo "ERROR: $description (file: $file, pattern: $pattern)" >&2
    exit 1
  fi
}

for wf in "${OPS_WORKFLOWS[@]}"; do
  require_file "$wf"
  require_pattern "$wf" '^permissions:' "missing explicit permissions block"

done

require_pattern ".github/workflows/ops_batch_stats_alerts.yml" '^concurrency:' "alerts workflow missing concurrency guard"
require_pattern ".github/workflows/ops_batch_stats_incident_ticket.yml" '^concurrency:' "incident ticket workflow missing concurrency guard"
require_pattern ".github/workflows/ops_batch_stats_incident_sla.yml" '^concurrency:' "incident SLA workflow missing concurrency guard"
require_pattern ".github/workflows/ops_batch_stats_incident_closure_guard.yml" '^concurrency:' "incident closure guard workflow missing concurrency guard"
require_pattern ".github/workflows/ops_workflow_noise_guard.yml" '^concurrency:' "noise guard workflow missing concurrency guard"

for wf in \
  ".github/workflows/ops_batch_stats_incident_ticket.yml" \
  ".github/workflows/ops_batch_stats_incident_sla.yml" \
  ".github/workflows/ops_batch_stats_incident_closure_guard.yml"; do
  require_pattern "$wf" 'dry_run' "incident workflow missing dry_run input/guard"
  require_pattern "$wf" 'DRY_RUN: would|dry run' "incident workflow missing dry_run execution guard markers"
done

INCIDENT_TICKET_WF=".github/workflows/ops_batch_stats_incident_ticket.yml"
require_pattern "$INCIDENT_TICKET_WF" 'synthetic_fixture' "incident_ticket missing synthetic_fixture input"
require_pattern "$INCIDENT_TICKET_WF" 'missing_evidence_artifact|missing_evidence' "incident_ticket missing missing-evidence fallback path"
require_pattern "$INCIDENT_TICKET_WF" 'rate-limit hit|Retrying in|MAX_ATTEMPTS|GH_API_MAX_ATTEMPTS' "incident_ticket missing API retry/backoff guard"

ALERTS_WF=".github/workflows/ops_batch_stats_alerts.yml"
require_pattern "$ALERTS_WF" 'batch-telemetry-evidence\.json' "alerts workflow missing evidence artifact path"
require_pattern "$ALERTS_WF" 'Validate telemetry evidence schema' "alerts workflow missing evidence schema validation step"

NOISE_GUARD_WF=".github/workflows/ops_workflow_noise_guard.yml"
require_pattern "$NOISE_GUARD_WF" '\.github/ops-noise-allowlist\.txt' "noise guard missing canonical allowlist path"

require_file "docs/AGENT_OPERATIONS.md"
require_pattern "docs/AGENT_OPERATIONS.md" 'Ops workflow permissions matrix' "runbook missing workflow permissions matrix section"

printf 'OK: ops workflow regression checks passed\n'
