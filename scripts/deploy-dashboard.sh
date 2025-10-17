#!/usr/bin/env bash

set -euo pipefail

# Template for deploying the dashboard/admin Next.js build to mydevil.

REMOTE_USER="<user>"
REMOTE_HOST="s0.mydevil.net"
REMOTE_PATH="/home/<user>/domains/<dashboard-domain>/public_nodejs"

echo "Building frontend..."
pnpm --filter frontend build

echo "Uploading dashboard bundle"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  frontend/.next \
  frontend/public \
  frontend/app.js \
  frontend/package.json \
  frontend/package-lock.json \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "Restarting Passenger for dashboard"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "devil www restart <dashboard-app-name>"

echo "Done. Capture logs if issues appear."
