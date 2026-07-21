#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CLEANUP_SCRIPT="$SCRIPT_DIR/cleanup-codex-remote-payload.sh"
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/codex-payload-cleanup-test.XXXXXX")
LOG="$TEST_ROOT/cleanup.log"
DRY_LOG="$TEST_ROOT/dry-run.log"
PIDS=""
FAILURES=0

cleanup() {
  for PID in $PIDS; do
    kill -CONT "$PID" 2>/dev/null || true
    kill -KILL "$PID" 2>/dev/null || true
    wait "$PID" 2>/dev/null || true
  done
  [ ! -f "$LOG" ] || unlink "$LOG"
  [ ! -f "$DRY_LOG" ] || unlink "$DRY_LOG"
  rmdir "$TEST_ROOT/logs" 2>/dev/null || true
  rmdir "$TEST_ROOT" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

start_named_sleep() {
  NAME=$1
  bash -c 'exec -a "$1" sleep 300' sh "$NAME" &
  LAST_PID=$!
  PIDS="$PIDS $LAST_PID"
  sleep 0.1
}

assert_alive() {
  LABEL=$1
  PID=$2
  if kill -0 "$PID" 2>/dev/null; then
    printf 'PASS alive: %s pid=%s\n' "$LABEL" "$PID"
  else
    printf 'FAIL unexpectedly removed: %s pid=%s\n' "$LABEL" "$PID"
    FAILURES=$((FAILURES + 1))
  fi
}

assert_dead() {
  LABEL=$1
  PID=$2
  if kill -0 "$PID" 2>/dev/null; then
    printf 'FAIL unexpectedly alive: %s pid=%s\n' "$LABEL" "$PID"
    FAILURES=$((FAILURES + 1))
  else
    printf 'PASS removed: %s pid=%s\n' "$LABEL" "$PID"
  fi
}

start_named_sleep CODEX_REMOTE_PAYLOAD
DRY_RUN_PID=$LAST_PID
kill -STOP "$DRY_RUN_PID"

env CODEX_PAYLOAD_CLEANUP_DRY_RUN=1 \
  CODEX_PAYLOAD_CLEANUP_LOG="$DRY_LOG" \
  CODEX_PAYLOAD_CLEANUP_LOCK="$TEST_ROOT/dry-run-lock" \
  HOME="$TEST_ROOT" TMPDIR="$TEST_ROOT" \
  sh "$CLEANUP_SCRIPT"

assert_alive "dry-run stopped Codex payload" "$DRY_RUN_PID"
if grep -q "dry run: no signals sent" "$DRY_LOG"; then
  printf 'PASS dry-run decision recorded\n'
else
  printf 'FAIL dry-run decision missing\n'
  FAILURES=$((FAILURES + 1))
fi
kill -CONT "$DRY_RUN_PID" 2>/dev/null || true
kill -KILL "$DRY_RUN_PID" 2>/dev/null || true
wait "$DRY_RUN_PID" 2>/dev/null || true

start_named_sleep CODEX_REMOTE_PAYLOAD
TARGET_PID=$LAST_PID
kill -STOP "$TARGET_PID"

start_named_sleep UNRELATED_STOPPED_PROCESS
UNRELATED_PID=$LAST_PID
kill -STOP "$UNRELATED_PID"

start_named_sleep CODEX_REMOTE_PAYLOAD
RUNNING_CODEX_PID=$LAST_PID

env CODEX_PAYLOAD_CLEANUP_LOG="$LOG" \
  CODEX_PAYLOAD_CLEANUP_LOCK="$TEST_ROOT/lock" \
  HOME="$TEST_ROOT" TMPDIR="$TEST_ROOT" \
  sh "$CLEANUP_SCRIPT" &
CLEANUP_PID=$!

FOUND_DIAGNOSTIC=0
ATTEMPT=0
while [ "$ATTEMPT" -lt 100 ]; do
  if [ -f "$LOG" ] && grep -q "diagnostic end target_pid=$TARGET_PID" "$LOG"; then
    FOUND_DIAGNOSTIC=1
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 0.05
done

if [ "$FOUND_DIAGNOSTIC" -ne 1 ]; then
  printf 'FAIL target diagnostic was not written\n'
  kill -KILL "$CLEANUP_PID" 2>/dev/null || true
  wait "$CLEANUP_PID" 2>/dev/null || true
  exit 1
fi

start_named_sleep CODEX_REMOTE_PAYLOAD
LATE_CODEX_PID=$LAST_PID
kill -STOP "$LATE_CODEX_PID"

wait "$CLEANUP_PID"

assert_dead "initial stopped Codex payload" "$TARGET_PID"
assert_alive "unrelated stopped process" "$UNRELATED_PID"
assert_alive "running Codex payload" "$RUNNING_CODEX_PID"
assert_alive "late stopped Codex payload without diagnostic" "$LATE_CODEX_PID"

if grep -q "diagnostic target pid=$TARGET_PID" "$LOG"; then
  printf 'PASS target diagnostic recorded\n'
else
  printf 'FAIL target diagnostic missing\n'
  FAILURES=$((FAILURES + 1))
fi

if grep -q "diagnostic target pid=$LATE_CODEX_PID" "$LOG"; then
  printf 'FAIL late process was unexpectedly diagnosed in the initial batch\n'
  FAILURES=$((FAILURES + 1))
else
  printf 'PASS late process excluded from initial diagnostic batch\n'
fi

exit "$FAILURES"
