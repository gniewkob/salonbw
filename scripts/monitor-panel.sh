#!/bin/sh
set -eu

# Passenger-safe panel monitor for MyDevil.
#
# Default mode is check-only and is safe for cron/alerts:
#   scripts/monitor-panel.sh
#
# Optional controlled restart uses the official MyDevil Passenger lifecycle:
#   PANEL_MONITOR_ACTION=restart scripts/monitor-panel.sh
#
# Do not call start_app.sh, next start, or node app.js from this script.

DOMAIN="${PANEL_DOMAIN:-panel.salon-bw.pl}"
URL="${PANEL_URL:-https://panel.salon-bw.pl/}"
RESTART_FILE="${PANEL_RESTART_FILE:-/usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs/tmp/restart.txt}"
ACTION="${PANEL_MONITOR_ACTION:-check}"
REQUIRE_NODE="${PANEL_MONITOR_REQUIRE_NODE:-1}"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

node_count() {
  ps auxww | awk -v domain="$DOMAIN" 'NR > 1 && $11 ~ /^node/ && index($0, domain) { count++ } END { print count + 0 }'
}

http_code() {
  curl -k -sS -o /dev/null -w '%{http_code}' --max-time 10 "$URL" 2>/dev/null || true
}

NODE_COUNT="$(node_count)"
HTTP_CODE="$(http_code)"

case "$HTTP_CODE" in
  200|301|302|303|307|308) HTTP_OK=1 ;;
  *) HTTP_OK=0 ;;
esac

if { [ "$REQUIRE_NODE" = "0" ] || [ "$NODE_COUNT" -gt 0 ]; } && [ "$HTTP_OK" -eq 1 ]; then
  log "OK domain=$DOMAIN node_workers=$NODE_COUNT http=$HTTP_CODE"
  exit 0
fi

log "UNHEALTHY domain=$DOMAIN node_workers=$NODE_COUNT http=${HTTP_CODE:-none} action=$ACTION"

if [ "$ACTION" = "restart" ]; then
  devil www restart "$DOMAIN"
  mkdir -p "$(dirname "$RESTART_FILE")"
  touch "$RESTART_FILE"
  log "RESTART_REQUESTED domain=$DOMAIN restart_file=$RESTART_FILE"
fi

exit 1
