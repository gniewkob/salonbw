#!/usr/bin/env bash
set -euo pipefail

RETRIES=${NPM_RETRIES:-3}
DELAY=${NPM_RETRY_DELAY:-60}

for attempt in $(seq 1 "$RETRIES"); do
  if npm ci; then
    exit 0
  fi

  if [ "$attempt" -lt "$RETRIES" ]; then
    echo "npm ci failed (attempt $attempt/$RETRIES). Possible rate limit. Waiting ${DELAY}s before retrying..." >&2
    sleep "$DELAY"
  else
    echo "npm ci failed after $RETRIES attempts" >&2
    exit 1
  fi
done
