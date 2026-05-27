#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/safe-update-api-env.sh --key KEY [--value VALUE | --read-stdin]
                                 [--ssh-user USER] [--ssh-host HOST]
                                 [--remote-env PATH] [--domain DOMAIN]
                                 [--health-url URL]
                                 [--no-restart] [--no-verify]

Examples:
  scripts/safe-update-api-env.sh --key SMTP_PASSWORD --read-stdin
  printf '%s' "$NEW_TOKEN" | scripts/safe-update-api-env.sh --key INSTAGRAM_ACCESS_TOKEN --read-stdin
  scripts/safe-update-api-env.sh --key SMTP_FROM --value noreply@salon-bw.pl --no-restart --no-verify
EOF
}

SSH_USER="${SSH_USER:-vetternkraft}"
SSH_HOST="${SSH_HOST:-s0.mydevil.net}"
REMOTE_ENV="${REMOTE_ENV:-/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env}"
DOMAIN="${DOMAIN:-api.salon-bw.pl}"
HEALTH_URL="${HEALTH_URL:-https://api.salon-bw.pl/healthz}"

DO_RESTART=1
DO_VERIFY=1
KEY=""
VALUE=""
VALUE_SET=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --key)
      KEY="${2:-}"
      shift 2
      ;;
    --value)
      VALUE="${2:-}"
      VALUE_SET=1
      shift 2
      ;;
    --read-stdin)
      VALUE="$(cat)"
      VALUE_SET=1
      shift
      ;;
    --ssh-user)
      SSH_USER="${2:-}"
      shift 2
      ;;
    --ssh-host)
      SSH_HOST="${2:-}"
      shift 2
      ;;
    --remote-env)
      REMOTE_ENV="${2:-}"
      shift 2
      ;;
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --health-url)
      HEALTH_URL="${2:-}"
      shift 2
      ;;
    --no-restart)
      DO_RESTART=0
      shift
      ;;
    --no-verify)
      DO_VERIFY=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$KEY" ]]; then
  echo "ERROR: --key is required" >&2
  usage >&2
  exit 1
fi

if [[ ! "$KEY" =~ ^[A-Z0-9_]+$ ]]; then
  echo "ERROR: key must match ^[A-Z0-9_]+$" >&2
  exit 1
fi

if [[ "$VALUE_SET" -eq 0 ]]; then
  read -r -s -p "Enter value for ${KEY}: " VALUE
  echo
fi

if [[ -z "$VALUE" ]]; then
  echo "ERROR: empty value is not allowed (refusing to update ${KEY})" >&2
  exit 1
fi

VALUE_B64="$(printf '%s' "$VALUE" | base64 | tr -d '\r\n')"
unset VALUE

echo "Updating ${KEY} in remote API .env on ${SSH_USER}@${SSH_HOST}"

ssh "${SSH_USER}@${SSH_HOST}" \
  "KEY='${KEY}' VALUE_B64='${VALUE_B64}' REMOTE_ENV='${REMOTE_ENV}' python3 - <<'PY'
from pathlib import Path
from datetime import datetime
import base64
import os
import re

key = os.environ['KEY']
value = base64.b64decode(os.environ['VALUE_B64']).decode('utf-8')
env_path = Path(os.environ['REMOTE_ENV'])

if not env_path.exists():
    raise SystemExit(f'ERROR: env file not found: {env_path}')

text = env_path.read_text()
backup = env_path.with_name(
    f'{env_path.name}.bak.safe-update.{datetime.utcnow().strftime(\"%Y%m%d%H%M%S\")}'
)
backup.write_text(text)

escaped = value.replace('\\\\', '\\\\\\\\').replace('\"', '\\\\\"')
updated_line = f'{key}=\"{escaped}\"'

out_lines = []
seen = 0
pattern = re.compile(rf'^{re.escape(key)}=')
for line in text.splitlines():
    if pattern.match(line):
        if seen == 0:
            out_lines.append(updated_line)
            seen = 1
        continue
    out_lines.append(line)

if seen == 0:
    out_lines.append(updated_line)

updated = '\\n'.join(out_lines)
if not updated.endswith('\\n'):
    updated += '\\n'

# Guardrail: detect accidental single-line serialization (literal \n)
bad_literal_lines = [
    str(i + 1) for i, line in enumerate(updated.splitlines()) if '\\\\n' in line
]
if bad_literal_lines:
    raise SystemExit(
        'ERROR: guardrail failed (literal \\\\n in .env line(s): '
        + ','.join(bad_literal_lines)
        + ')'
    )

# Guardrail: every non-comment line must be KEY=VALUE
for i, line in enumerate(updated.splitlines(), start=1):
    stripped = line.strip()
    if not stripped or stripped.startswith('#'):
        continue
    if '=' not in line:
        raise SystemExit(f'ERROR: invalid .env line {i}: missing =')

env_path.write_text(updated)

print('updated_key=' + key)
print('backup=' + str(backup))
print('line_count=' + str(len(updated.splitlines())))
PY"

if [[ "$DO_RESTART" -eq 1 ]]; then
  echo "Restarting ${DOMAIN}"
  ssh "${SSH_USER}@${SSH_HOST}" "devil www restart ${DOMAIN}"
fi

if [[ "$DO_VERIFY" -eq 1 ]]; then
  echo "Verifying health endpoint: ${HEALTH_URL}"
  BODY=""
  for attempt in 1 2 3 4 5 6; do
    if BODY="$(curl -fsS "${HEALTH_URL}")"; then
      break
    fi
    sleep 5
  done

  if [[ -z "${BODY}" ]]; then
    echo "ERROR: failed to read ${HEALTH_URL} after retries" >&2
    exit 1
  fi

  if command -v python3 >/dev/null 2>&1; then
    HEALTH_SUMMARY="$(printf '%s' "${BODY}" | python3 - <<'PY'
import json
import sys

payload = json.loads(sys.stdin.read())
db = payload.get('services', {}).get('database', {}).get('status', 'unknown')
smtp = payload.get('services', {}).get('smtp', {}).get('status', 'unknown')
ig = payload.get('services', {}).get('instagram', {}).get('status', 'unknown')
status = payload.get('status', 'unknown')
print(f'status={status} database={db} smtp={smtp} instagram={ig}')
PY
)"
    echo "Health summary: ${HEALTH_SUMMARY}"
  else
    echo "Health payload: ${BODY}"
  fi
fi

echo "Done."
