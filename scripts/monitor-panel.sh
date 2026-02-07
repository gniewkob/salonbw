#!/bin/bash
# Monitor and restart panel.salon-bw.pl Node.js app if not running
# This script should be run via cron every 5 minutes
# Add to crontab: */5 * * * * /usr/home/vetternkraft/apps/nodejs/panelbw/monitor-panel.sh

APP_DIR="/usr/home/vetternkraft/apps/nodejs/panelbw"
PID_FILE="$APP_DIR/app.pid"
PORT=3001

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    echo "[$(date)] No PID file found. Starting app..."
    cd "$APP_DIR" && ./start_app.sh
    exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "[$(date)] Process $PID not running. Restarting..."
    cd "$APP_DIR" && ./start_app.sh
else
    # Optional: Check if port is actually listening
    if ! nc -z 127.0.0.1 $PORT 2>/dev/null; then
        echo "[$(date)] Process running but port $PORT not listening. Restarting..."
        kill "$PID" 2>/dev/null
        sleep 2
        cd "$APP_DIR" && ./start_app.sh
    fi
fi
