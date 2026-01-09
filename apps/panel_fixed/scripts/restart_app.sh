#!/bin/bash
# Script resides in scripts/
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Restarting Panel App in $ROOT_DIR"
cd "$ROOT_DIR" || exit 1
./scripts/start_app.sh
