#!/bin/sh
set -eu

umask 077

LOG="${CODEX_PAYLOAD_CLEANUP_LOG:-$HOME/logs/codex-payload-cleanup.log}"
LOCKDIR="${CODEX_PAYLOAD_CLEANUP_LOCK:-$HOME/.codex-payload-cleanup.lock}"
MAX_LOG_BYTES="${CODEX_PAYLOAD_CLEANUP_MAX_LOG_BYTES:-1048576}"
TMP="${TMPDIR:-/tmp}/codex-payload-cleanup.$$"

mkdir -p "$HOME/logs"

if ! mkdir "$LOCKDIR" 2>/dev/null; then
  exit 0
fi

cleanup() {
  rm -f "$TMP" "$TMP.remaining" "$TMP.snapshot"
  rmdir "$LOCKDIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

DIAGNOSTIC_PS_FIELDS="pid,ppid,pgid"
for FIELD in sid tpgid tty state etime lstart wchan xstat command; do
  if ps -p "$$" -o "$FIELD" >/dev/null 2>&1; then
    DIAGNOSTIC_PS_FIELDS="$DIAGNOSTIC_PS_FIELDS,$FIELD"
  fi
done

log_process_snapshot() {
  SNAP_LABEL=$1
  SNAP_PID=$2

  printf '%s %s pid=%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$SNAP_LABEL" "$SNAP_PID" >> "$LOG"
  ps -ww -p "$SNAP_PID" -o "$DIAGNOSTIC_PS_FIELDS" > "$TMP.snapshot" 2>&1 || true
  cat "$TMP.snapshot" >> "$LOG"
  if ! awk -v pid="$SNAP_PID" '$1 == pid { found = 1 } END { exit !found }' "$TMP.snapshot"; then
    printf '%s %s pid=%s unavailable\n' \
      "$(date '+%Y-%m-%d %H:%M:%S')" "$SNAP_LABEL" "$SNAP_PID" >> "$LOG"
  fi
}

if [ -f "$LOG" ]; then
  LOG_BYTES=$(wc -c < "$LOG" | awk '{ print $1 }')
  if [ "$LOG_BYTES" -gt "$MAX_LOG_BYTES" ]; then
    mv "$LOG" "$LOG.1"
  fi
fi

touch "$LOG"
chmod 600 "$LOG"

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

while read -r TARGET_PID PARENT_PID STATE ETIME; do
  printf '%s diagnostic begin target_pid=%s parent_pid=%s state=%s etime=%s fields=%s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S')" "$TARGET_PID" "$PARENT_PID" "$STATE" "$ETIME" \
    "$DIAGNOSTIC_PS_FIELDS" >> "$LOG"
  log_process_snapshot "diagnostic target" "$TARGET_PID"
  log_process_snapshot "diagnostic parent" "$PARENT_PID"
  printf '%s diagnostic end target_pid=%s\n' \
    "$(date '+%Y-%m-%d %H:%M:%S')" "$TARGET_PID" >> "$LOG"
done < "$TMP"

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
