#!/usr/bin/env bash

set -euo pipefail

# Template deployment script for the public Next.js app on mydevil.
# Replace the placeholder values and remove comments once you finalise the process.

REMOTE_USER="<user>"
REMOTE_HOST="s0.mydevil.net"
REMOTE_PATH="/home/<user>/domains/<domain>/public_nodejs"

echo "Building frontend..."
pnpm --filter frontend build

echo "Uploading artifacts to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  frontend/.next \
  frontend/public \
  frontend/app.js \
  frontend/package.json \
  frontend/package-lock.json \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

echo "Restarting Passenger app (edit the command for your environment)"
ssh "${REMOTE_USER}@${REMOTE_HOST}" "devil www restart <app-name>"

echo "Deployment template finished. Verify the site manually."
