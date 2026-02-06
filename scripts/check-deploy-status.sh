#!/bin/bash
# Convenient wrapper for post-deploy smoke checks
# Usage: ./scripts/check-deploy-status.sh [panel|api|public]

TARGET=${1:-dashboard}
HOST="panel.salon-bw.pl"

if [ "$TARGET" == "api" ]; then
    HOST="api.salon-bw.pl"
elif [ "$TARGET" == "public" ]; then
    HOST="salon-bw.pl"
fi

echo "🚀 Running post-deploy smoke checks for $TARGET on $HOST..."

export TARGET_HOST="$HOST"
export DEPLOY_TARGET="$TARGET"
export CHECK_MAX_ATTEMPTS=5
export CHECK_BACKOFF_INITIAL=2

python3 scripts/post_deploy_checks.py
