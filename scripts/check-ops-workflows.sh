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
  if command -v rg >/dev/null 2>&1; then
    if rg -q "$pattern" "$file"; then
      return 0
    fi
  elif grep -Eq "$pattern" "$file"; then
    return 0
  fi

  if ! grep -Eq "$pattern" "$file"; then
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

DEPLOY_WF=".github/workflows/deploy.yml"
require_file "$DEPLOY_WF"
CI_GATE_SCRIPT="scripts/ci/wait-for-ci-success.sh"
require_file "$CI_GATE_SCRIPT"
require_pattern "$DEPLOY_WF" 'name: Wait for successful CI' "deploy workflow missing CI gate"
require_pattern "$DEPLOY_WF" 'wait-for-ci-success\.sh' "deploy workflow does not invoke CI gate"
# Owner-approved DEV release policy: MyDevil provider backups replace
# persistent per-deploy snapshot generation, rollback and prune. Keep the
# non-snapshot extract helper's temporary cleanup and exact-SHA CI gate.
require_pattern "$DEPLOY_WF" 'name: DEV disk preflight \(no deployment snapshots\)' "DEV disk capacity policy missing"
# MyDevil contractual account quota must be measured separately from the
# shared FreeBSD filesystem before deployment. No proxy estimates allowed.
require_file "scripts/ci/check-mydevil-dev-quota.cjs"
require_file "scripts/ci/check-mydevil-dev-quota.test.cjs"
require_pattern "$DEPLOY_WF" 'devil info limits' "DEV account quota read must use MyDevil provider"
require_pattern "$DEPLOY_WF" 'df -Pk' "DEV preflight must also check FreeBSD filesystem space"
require_pattern "$DEPLOY_WF" 'check-mydevil-dev-quota\.cjs' "DEV quota must be validated before deployment"
require_pattern "$DEPLOY_WF" 'historical_dev_recovery' "Historical DEV recovery flag missing from workflow"
require_pattern "$DEPLOY_WF" 'Historical DEV release is not an ancestor' "Historical DEV recovery ancestry gate absent"
require_pattern "$DEPLOY_WF" 'Load immutable workflow-owned deploy safeguards' "Historical deploy must load current workflow-owned guards"
require_pattern "$DEPLOY_WF" 'git show "\$GITHUB_SHA:\$script"' "Immutable workflow safeguards are not source-pinned"
if grep -q 'check-freebsd-dev-storage-budget\.cjs' "$DEPLOY_WF"; then
  echo "ERROR: legacy estimated quota budget must not be used by DEV deploy" >&2
  exit 1
fi
if grep -Eq 'staging-release-snapshot\.sh|steps\.dev_recovery|SNAPSHOT_TOKEN|SNAPSHOT_PRUNE_EXECUTE' "$DEPLOY_WF"; then
  echo "ERROR: automatic DEV snapshots are prohibited in deploy.yml" >&2
  exit 1
fi
require_pattern "$DEPLOY_WF" 'actions: read' "deploy workflow cannot read CI run status"
require_pattern "$CI_GATE_SCRIPT" 'headSha == \$sha' "CI gate does not require the exact deploy SHA"
require_pattern "$CI_GATE_SCRIPT" 'conclusion.*success' "CI gate does not require a successful conclusion"
require_file "scripts/test-wait-for-ci-success.sh"
bash scripts/test-wait-for-ci-success.sh

GATE_LINE="$(grep -n 'name: Wait for successful CI' "$DEPLOY_WF" | head -n1 | cut -d: -f1 || true)"
INSTALL_LINE="$(grep -n 'name: Install dependencies' "$DEPLOY_WF" | head -n1 | cut -d: -f1 || true)"
if [[ -z "$GATE_LINE" || -z "$INSTALL_LINE" || "$GATE_LINE" -ge "$INSTALL_LINE" ]]; then
  echo "ERROR: CI gate must run before dependency installation and deploy work" >&2
  exit 1
fi

SENTRY_BUILD_ENV_COUNT="$(
  grep -F "NEXT_PUBLIC_SENTRY_DSN: \${{ env.DEPLOY_ENV == 'production' && vars.NEXT_PUBLIC_SENTRY_DSN || '' }}" \
    "$DEPLOY_WF" | wc -l | tr -d ' '
)"
if [[ "$SENTRY_BUILD_ENV_COUNT" -lt 2 ]]; then
  echo "ERROR: landing and panel builds must receive Sentry only in production" >&2
  exit 1
fi

# Legacy E2E once auto-ran on master and connected to generic MYDEVIL_DB_*
# credentials. Neither prod/data isolation nor outbound disablement was proven.
# The workflow must stay manual-only AND fail closed before reading secrets.
LEGACY_E2E_WF=".github/workflows/e2e.yml"
require_file "$LEGACY_E2E_WF"
require_pattern "$LEGACY_E2E_WF" '^  workflow_dispatch:' "legacy E2E must be explicit/manual only"
require_pattern "$LEGACY_E2E_WF" '^  legacy-e2e-blocked:' "legacy E2E must publish a fail-closed block"
require_pattern "$LEGACY_E2E_WF" '^  cypress:' "legacy steps retained for traceability"
require_pattern "$LEGACY_E2E_WF" '^    if: \$\{\{ false \}\}' "legacy MyDevil-backed Cypress must remain disabled"
if grep -Eq '^[[:space:]]+push:|^[[:space:]]+schedule:|^[[:space:]]+workflow_run:' "$LEGACY_E2E_WF"; then
  echo "ERROR: legacy MyDevil-backed E2E cannot have unattended event triggers" >&2
  exit 1
fi
# GitHub's YAML must still remain parseable; deny unintended action secrets
# on push via the exact trigger and job guard even if future edits add steps.

require_file "docs/AGENT_OPERATIONS.md"
require_pattern "docs/AGENT_OPERATIONS.md" 'Ops workflow permissions matrix' "runbook missing workflow permissions matrix section"

printf 'OK: ops workflow regression checks passed\n'
