#!/usr/bin/env bash
set -euo pipefail

PID_FILE=${PID_FILE:-"${XDG_RUNTIME_DIR:-/tmp}/salonbw-db-tunnel.pid"}

if [[ ! -f "$PID_FILE" ]]; then
    echo "No tunnel PID file found at $PID_FILE"
    exit 0
fi

PID=$(cat "$PID_FILE")

if ps -p "$PID" >/dev/null 2>&1; then
    echo "Stopping tunnel process $PID"
    kill "$PID"
    sleep 1
    if ps -p "$PID" >/dev/null 2>&1; then
        echo "Process still running, sending SIGKILL"
        kill -9 "$PID"
    fi
else
    echo "No running process for PID $PID"
fi

rm -f "$PID_FILE"
echo "Tunnel stopped."
