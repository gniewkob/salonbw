#!/bin/bash
export NODE_ENV=production
export HOSTNAME=0.0.0.0
export PORT=3001
export PATH=/usr/local/bin:$PATH

# APP_DIR is where this script resides (apps/nodejs/panelbw/scripts) -> ../
# But better to hardcode or use relative.
# If script is in .../scripts/
# App root is .../
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd $ROOT_DIR

# Kill existing
if [ -f app.pid ]; then
  kill $(cat app.pid) 2>/dev/null
fi

nohup node app.js > public/server.log 2>&1 &
PID=$!
echo $PID > app.pid
echo "Started Panel App with PID $PID on Port $PORT"
