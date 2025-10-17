#!/usr/bin/env bash

set -euo pipefail

# Template script for deploying the admin panel build.

REMOTE_USER="<user>"
REMOTE_HOST="s0.mydevil.net"
REMOTE_PATH="/home/<user>/domains/<admin-domain>/public_nodejs"

pnpm --filter frontend build

rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  frontend/.next \
  frontend/public \
  frontend/app.js \
  frontend/package.json \
  frontend/package-lock.json \
  "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

ssh "${REMOTE_USER}@${REMOTE_HOST}" "devil www restart <admin-app-name>"

echo "Admin deployment template completed."
