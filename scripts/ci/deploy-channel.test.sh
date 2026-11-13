#!/usr/bin/env bash
# No network or SSH, verifies router does not misclassify real CI failures.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && pwd -P)"
script="$repo/scripts/deploy-channel.sh"
bash -n "$script"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin"
cat > "$tmp/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
[[ "$1" == api ]] || exit 90
resource="$2"
case "$resource" in
  *'/actions/runs?per_page=30')
    if [[ "$MOCK_CHANNEL" == unavailable ]]; then exit 1; fi
    echo '{"workflow_runs":[{"id":43417583215,"name":"CI","status":"completed","conclusion":"failure"}]}'
    ;;
  *'/actions/runs/43417583215/jobs?per_page=100')
    if [[ "$MOCK_CHANNEL" == real-failure ]]; then
      echo '{"jobs":[{"id":99,"conclusion":"failure","runner_id":17,"steps":[{"name":"Run tests"}]}]}'
    else
      echo '{"jobs":[{"id":99,"conclusion":"failure","runner_id":0,"steps":[]}]}'
    fi
    ;;
  *'/check-runs/99/annotations?per_page=100')
    if [[ "$MOCK_CHANNEL" == billing ]]; then
      echo '[{"message":"The job was not started because your account is locked due to a billing issue."}]'
    else
      echo '[{"message":"Other pre-run failure"}]'
    fi
    ;;
  *) exit 91 ;;
esac
MOCK
chmod +x "$tmp/bin/gh"
export PATH="$tmp/bin:$PATH"
sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
branch=fix/v18-calendar-reschedule-overlap-brand-20261112

export MOCK_CHANNEL=billing
result="$(bash "$script" development panel "$branch" "$sha" auto --plan)"
grep -Fq 'DEPLOY_CHANNEL=mydevil' <<< "$result"
grep -Fq 'DEPLOYMENT=NOT_STARTED' <<< "$result"

export MOCK_CHANNEL=real-failure
result="$(bash "$script" development panel "$branch" "$sha" auto --plan)"
grep -Fq 'DEPLOY_CHANNEL=actions' <<< "$result"

export MOCK_CHANNEL=other-failure
if bash "$script" development panel "$branch" "$sha" auto --plan >/dev/null 2>&1; then
  echo 'Unexpected failover on unknown runner failure' >&2
  exit 1
fi

export MOCK_CHANNEL=unavailable
if bash "$script" development panel "$branch" "$sha" auto --plan >/dev/null 2>&1; then
  echo 'Unexpected failover when GitHub API is unavailable' >&2
  exit 1
fi

if bash "$script" production panel "$branch" "$sha" mydevil --plan >/dev/null 2>&1; then
  echo 'Production manual route was not blocked' >&2
  exit 1
fi

if bash "$script" development panel "$branch" "$sha" mydevil --execute >/dev/null 2>&1; then
  echo 'Unvalidated manual activation was allowed' >&2
  exit 1
fi

echo 'DEPLOY_CHANNEL_OFFLINE_CHECK=PASS'
