#!/usr/bin/env bash
# Preview first; dispatch the existing CI-gated MyDevil workflow only with --execute.
set -euo pipefail

usage() {
  echo "Usage: bash scripts/deploy-environment.sh development|production <40-char SHA> [landing|panel|api|all] [--execute]"
}
if [[ "${1:-}" == "--help" ]]; then usage; exit 0; fi
if (( $# < 2 || $# > 4 )); then usage >&2; exit 2; fi
deployment_environment="$1"
release_sha="$2"
deployment_target="${3:-}"
execute=false
if [[ "$deployment_target" == "--execute" ]]; then deployment_target=""; execute=true; fi
if [[ "${4:-}" == "--execute" ]]; then execute=true
elif [[ -n "${4:-}" ]]; then usage >&2; exit 2; fi
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || { echo "Use an immutable full commit SHA." >&2; exit 2; }
case "$deployment_environment" in
  development) workflow_environment=staging; deployment_target="${deployment_target:-landing}" ;;
  production) workflow_environment=production; deployment_target="${deployment_target:-all}" ;;
  *) usage >&2; exit 2 ;;
esac
case "$deployment_target" in landing|panel|api|all) ;; *) usage >&2; exit 2 ;; esac
if [[ "$deployment_environment" == development && "$deployment_target" != landing ]]; then
  echo "Blocked: dev-panel/dev-api do not have an isolated deployment configuration yet." >&2
  exit 1
fi
for dependency in gh jq curl; do
  command -v "$dependency" >/dev/null || { echo "Missing dependency: $dependency" >&2; exit 1; }
done

# Keep environment overrides in the same precedence order as GitHub Actions.
repository_variables="$(gh variable list --json name,value)"
environment_variables="$(gh variable list --env "$workflow_environment" --json name,value)"
variable() {
  printf '%s\n%s\n' "$repository_variables" "$environment_variables" |
    jq -rs --arg key "$1" '(.[0] + .[1]) | map(select(.name == $key)) | last | .value // ""'
}
suffix=PRODUCTION
[[ "$deployment_environment" == development ]] && suffix=STAGING
landing_app="$(variable "MYDEVIL_PUBLIC_APP_NAME_$suffix")"
landing_path="$(variable "MYDEVIL_PUBLIC_REMOTE_PATH_$suffix")"
api_app="$(variable "MYDEVIL_API_APP_NAME_$suffix")"
api_path="$(variable "MYDEVIL_API_REMOTE_PATH_$suffix")"
blockers=0
block() { echo "BLOCKED: $*" >&2; blockers=$((blockers + 1)); }

if [[ "$deployment_target" == landing || "$deployment_target" == all ]]; then
  expected_app=salon-bw.pl
  [[ "$deployment_environment" == development ]] && expected_app=dev.salon-bw.pl
  [[ "$landing_app" == "$expected_app" ]] || block "Landing must target $expected_app (GitHub variable MYDEVIL_PUBLIC_APP_NAME_$suffix)."
  if [[ "$deployment_environment" == production ]]; then
    [[ "$landing_path" == /usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs ]] ||
      block "Production landing path has not been configured for the canonical domain."
  else
    case "$landing_path" in
      /usr/home/vetternkraft/apps/nodejs/salonbw|/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs) ;;
      *) block "Development landing path differs from the verified MyDevil paths." ;;
    esac
  fi
  cors_headers="$(curl --fail --silent --show-error --connect-timeout 10 --max-time 20 \
    --dump-header - --output /dev/null -H "Origin: https://$expected_app" \
    https://api.salon-bw.pl/calendar/opening-hours)" || block "API rejected the landing origin."
  if ! printf '%s\n' "$cors_headers" | tr -d '\r' | tr '[:upper:]' '[:lower:]' |
    grep -Fxiq "access-control-allow-origin: https://$expected_app"; then
    block "API CORS does not allow the exact landing origin."
  fi
fi
if [[ "$deployment_target" == api || "$deployment_target" == all ]]; then
  [[ "$api_app" == api.salon-bw.pl && "$api_path" == /usr/home/vetternkraft/apps/nodejs/api_salonbw ]] ||
    block "API must target the verified production application."
fi
ci_runs="$(gh run list --workflow ci.yml --commit "$release_sha" --limit 100 --json status,conclusion)"
if ! jq -e 'length > 0 and .[0].status == "completed" and .[0].conclusion == "success"' <<< "$ci_runs" >/dev/null; then
  block "The latest CI run for the requested SHA is not successful."
fi

echo "Environment: $deployment_environment; target: $deployment_target; SHA: $release_sha"
echo "Landing: https://${landing_app:-UNCONFIGURED}; panel: https://panel.salon-bw.pl; API: https://api.salon-bw.pl"
printf 'Command: gh workflow run deploy.yml --ref master -f ref=%q -f environment=%q -f target=%q\n' \
  "$release_sha" "$workflow_environment" "$deployment_target"
if [[ "$execute" == false ]]; then
  echo "Preview only. Blockers: $blockers. No workflow was dispatched."
  exit 0
fi
(( blockers == 0 )) || { echo "No deployment dispatched." >&2; exit 1; }
gh workflow run deploy.yml --ref master -f "ref=$release_sha" \
  -f "environment=$workflow_environment" -f "target=$deployment_target"
echo "Dispatched, not yet deployed. Follow the dispatch run ID with: gh run watch <run-id> --exit-status"
