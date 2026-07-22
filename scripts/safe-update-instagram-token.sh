#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/safe-update-instagram-token.sh [--read-stdin | --value VALUE]
                                         [--ssh-user USER] [--ssh-host HOST]
                                         [--api-env PATH] [--landing-env PATH]
                                         [--panel-env PATH]
                                         [--no-restart] [--no-verify]

Examples:
  printf '%s' "$NEW_TOKEN" | scripts/safe-update-instagram-token.sh --read-stdin

Notes:
  The token is never printed. The script validates it against Instagram Graph API,
  updates API/landing/panel runtime .env files, restarts affected MyDevil domains,
  and verifies API health unless disabled.
EOF
}

SSH_USER="${SSH_USER:-vetternkraft}"
SSH_HOST="${SSH_HOST:-s0.mydevil.net}"
API_ENV="${API_ENV:-/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env}"
LANDING_ENV="${LANDING_ENV:-/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs/.env}"
PANEL_ENV="${PANEL_ENV:-/usr/home/vetternkraft/apps/nodejs/panelbw/.env}"
API_HEALTH_URL="${API_HEALTH_URL:-https://api.salon-bw.pl/healthz}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

TOKEN=""
TOKEN_SET=0
DO_RESTART=1
DO_VERIFY=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --read-stdin)
      TOKEN="$(cat)"
      TOKEN_SET=1
      shift
      ;;
    --value)
      TOKEN="${2:-}"
      TOKEN_SET=1
      shift 2
      ;;
    --ssh-user)
      SSH_USER="${2:-}"
      shift 2
      ;;
    --ssh-host)
      SSH_HOST="${2:-}"
      shift 2
      ;;
    --api-env)
      API_ENV="${2:-}"
      shift 2
      ;;
    --landing-env)
      LANDING_ENV="${2:-}"
      shift 2
      ;;
    --panel-env)
      PANEL_ENV="${2:-}"
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

if [[ "$TOKEN_SET" -eq 0 ]]; then
  read -r -s -p "Enter Instagram access token: " TOKEN
  echo
fi

if [[ -z "$TOKEN" ]]; then
  echo "ERROR: empty token is not allowed" >&2
  exit 1
fi

export INSTAGRAM_TOKEN_FOR_VALIDATION="$TOKEN"
python3 - <<'PY'
import json
import os
import sys
import urllib.parse
import urllib.request

token = os.environ["INSTAGRAM_TOKEN_FOR_VALIDATION"]
params = urllib.parse.urlencode({"fields": "id,username", "access_token": token})
url = f"https://graph.instagram.com/me?{params}"

try:
    with urllib.request.urlopen(url, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))
except Exception as exc:
    print("ERROR: Instagram token validation failed", file=sys.stderr)
    detail = getattr(exc, "reason", None) or exc.__class__.__name__
    print(f"reason={detail}", file=sys.stderr)
    raise SystemExit(1)

if not payload.get("id"):
    print("ERROR: Instagram token validation returned no account id", file=sys.stderr)
    raise SystemExit(1)

print("instagram_token_validation=ok")
PY
unset INSTAGRAM_TOKEN_FOR_VALIDATION

printf '%s' "$TOKEN" | "${SCRIPT_DIR}/safe-update-api-env.sh" \
  --key INSTAGRAM_ACCESS_TOKEN \
  --read-stdin \
  --ssh-user "$SSH_USER" \
  --ssh-host "$SSH_HOST" \
  --remote-env "$API_ENV" \
  --no-restart \
  --no-verify

TOKEN_B64="$(printf '%s' "$TOKEN" | base64 | tr -d '\r\n')"
unset TOKEN

echo "Updating Instagram token in frontend runtime env files on ${SSH_USER}@${SSH_HOST}"

ssh "${SSH_USER}@${SSH_HOST}" \
  "TOKEN_B64='${TOKEN_B64}' LANDING_ENV='${LANDING_ENV}' PANEL_ENV='${PANEL_ENV}' python3 - <<'PY'
from pathlib import Path
from datetime import datetime
import base64
import os
import re

key = 'INSTAGRAM_ACCESS_TOKEN'
value = base64.b64decode(os.environ['TOKEN_B64']).decode('utf-8')
targets = [Path(os.environ['LANDING_ENV']), Path(os.environ['PANEL_ENV'])]

def update_env(env_path: Path) -> str:
    if not env_path.exists():
        raise SystemExit(f'ERROR: env file not found: {env_path}')

    text = env_path.read_text()
    backup = env_path.with_name(
        f'{env_path.name}.bak.safe-instagram-token.{datetime.utcnow().strftime(\"%Y%m%d%H%M%S\")}'
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

    bad_literal_lines = [
        str(i + 1) for i, line in enumerate(updated.splitlines()) if '\\\\n' in line
    ]
    if bad_literal_lines:
        raise SystemExit(
            'ERROR: guardrail failed (literal \\\\n in .env line(s): '
            + ','.join(bad_literal_lines)
            + ')'
        )

    for i, line in enumerate(updated.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        if '=' not in line:
            raise SystemExit(f'ERROR: invalid .env line {i}: missing =')

    env_path.write_text(updated)
    return str(backup)

for target in targets:
    backup = update_env(target)
    print(f'updated={target}')
    print(f'backup={backup}')
PY"

unset TOKEN_B64

if [[ "$DO_RESTART" -eq 1 ]]; then
  echo "Restarting affected MyDevil domains"
  ssh "${SSH_USER}@${SSH_HOST}" \
    "devil www restart api.salon-bw.pl && devil www restart dev.salon-bw.pl && devil www restart panel.salon-bw.pl"
fi

if [[ "$DO_VERIFY" -eq 1 ]]; then
  echo "Verifying API health endpoint: ${API_HEALTH_URL}"
  BODY=""
  for _ in 1 2 3 4 5 6; do
    if BODY="$(curl -fsS "${API_HEALTH_URL}")"; then
      break
    fi
    sleep 5
  done

  if [[ -z "${BODY}" ]]; then
    echo "ERROR: failed to read ${API_HEALTH_URL} after retries" >&2
    exit 1
  fi

  HEALTH_BODY="${BODY}" python3 - <<'PY'
import json
import os
import sys

payload = json.loads(os.environ['HEALTH_BODY'])
services = payload.get('services', {})
status = payload.get('status', 'unknown')
database = services.get('database', {}).get('status', 'unknown')
smtp = services.get('smtp', {}).get('status', 'unknown')
instagram = services.get('instagram', {}).get('status', 'unknown')
message = services.get('instagram', {}).get('message', '')
print(f'status={status} database={database} smtp={smtp} instagram={instagram}')
if instagram != 'ok':
    print(f'ERROR: instagram health is not ok ({message})', file=sys.stderr)
    raise SystemExit(1)
PY
fi

echo "Done."
