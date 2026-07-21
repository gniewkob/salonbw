#!/bin/sh
set -eu

LOG="${CODEX_PAYLOAD_CLEANUP_LOG:-$HOME/logs/codex-payload-cleanup.log}"
LOCKDIR="${CODEX_PAYLOAD_CLEANUP_LOCK:-$HOME/.codex-payload-cleanup.lock}"
MAX_LOG_BYTES="${CODEX_PAYLOAD_CLEANUP_MAX_LOG_BYTES:-1048576}"
TMP="${TMPDIR:-/tmp}/codex-payload-cleanup.$$"

mkdir -p "$HOME/logs"

if ! mkdir "$LOCKDIR" 2>/dev/null; then
  exit 0
fi

cleanup() {
  rm -f "$TMP" "$TMP.remaining"
  rmdir "$LOCKDIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [ -f "$LOG" ]; then
  LOG_BYTES=$(wc -c < "$LOG" | awk '{ print $1 }')
  if [ "$LOG_BYTES" -gt "$MAX_LOG_BYTES" ]; then
    mv "$LOG" "$LOG.1"
  fi
fi

ps -x -o pid,ppid,state,etime,command |
  awk 'NR > 1 && $3 ~ /T/ && index($0, "CODEX_REMOTE_PAYLOAD") { print $1, $2, $3, $4 }' > "$TMP"

if [ ! -s "$TMP" ]; then
  exit 0
fi

COUNT=$(wc -l < "$TMP" | awk '{ print $1 }')
DETAILS=$(awk '{ printf "%s:%s:%s:%s ", $1, $2, $3, $4 }' "$TMP")
printf '%s killing %s stopped CODEX_REMOTE_PAYLOAD processes: %s\n' \
  "$(date '+%Y-%m-%d %H:%M:%S')" \
  "$COUNT" \
  "$DETAILS" >> "$LOG"

awk '{ print $1 }' "$TMP" | xargs kill -TERM 2>/dev/null || true
sleep 2

ps -x -o pid,ppid,state,etime,command |
  awk 'NR > 1 && $3 ~ /T/ && index($0, "CODEX_REMOTE_PAYLOAD") { print $1 }' > "$TMP.remaining"

if [ -s "$TMP.remaining" ]; then
  printf '%s force killing remaining stopped CODEX_REMOTE_PAYLOAD processes: %s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S')" \
    "$(tr '\n' ' ' < "$TMP.remaining")" >> "$LOG"
  xargs kill -KILL < "$TMP.remaining" 2>/dev/null || true
fi
