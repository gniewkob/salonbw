#!/usr/bin/env bash
set -euo pipefail

[[ "${DEBUG:-}" == "1" ]] && set -x

check_var() {
    local name=$1
    if [[ -z "${!name:-}" ]]; then
        echo "error: $name is not set" >&2
        exit 1
    fi
}

MYDEVIL_SSH_HOST=${MYDEVIL_SSH_HOST:-}
MYDEVIL_SSH_USER=${MYDEVIL_SSH_USER:-}
MYDEVIL_PG_HOST=${MYDEVIL_PG_HOST:-}
MYDEVIL_PG_PORT=${MYDEVIL_PG_PORT:-5432}
DB_LOCAL_PORT=${DB_LOCAL_PORT:-8543}
PID_FILE=${PID_FILE:-"${XDG_RUNTIME_DIR:-/tmp}/salonbw-db-tunnel.pid"}

check_var MYDEVIL_SSH_HOST
check_var MYDEVIL_SSH_USER
check_var MYDEVIL_PG_HOST

if [[ -f "$PID_FILE" ]]; then
    if ps -p "$(cat "$PID_FILE")" >/dev/null 2>&1; then
        echo "Tunnel already running (PID $(cat "$PID_FILE"))."
        exit 0
    else
        rm -f "$PID_FILE"
    fi
fi

echo "Opening SSH tunnel ${MYDEVIL_SSH_USER}@${MYDEVIL_SSH_HOST} -> localhost:${DB_LOCAL_PORT}"

ssh -f \
    -N \
    -L "${DB_LOCAL_PORT}:${MYDEVIL_PG_HOST}:${MYDEVIL_PG_PORT}" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    "${MYDEVIL_SSH_USER}@${MYDEVIL_SSH_HOST}"

TUNNEL_PID=$(pgrep -f "ssh -f -N -L ${DB_LOCAL_PORT}:${MYDEVIL_PG_HOST}:${MYDEVIL_PG_PORT}")

if [[ -z "${TUNNEL_PID:-}" ]]; then
    echo "error: tunnel failed to start" >&2
    exit 1
fi

echo "$TUNNEL_PID" > "$PID_FILE"
echo "Tunnel started (PID $TUNNEL_PID). Connect to PostgreSQL via localhost:${DB_LOCAL_PORT}"
