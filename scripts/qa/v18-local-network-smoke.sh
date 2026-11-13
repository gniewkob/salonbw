#!/usr/bin/env bash
# Local-only transport probe; this is not the application E2E harness.
set -Eeuo pipefail
if [[ $# -ne 0 || ${CI:-} == true || ${GITHUB_ACTIONS:-} == true ]]; then
  echo 'LOCAL_NETWORK_BLOCKED: local invocation without arguments required' >&2
  exit 1
fi
command -v docker >/dev/null
command -v openssl >/dev/null
nonce=$(openssl rand -hex 12)
name="salonbw-v18-net-${nonce}"
db="v18_${nonce}"
network_id='' pg_id='' node_id=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  for id in "$node_id" "$pg_id"; do
    if [[ -n $id ]]; then docker rm -f "$id" >/dev/null || status=1; fi
  done
  if [[ -n $network_id ]]; then docker network rm "$network_id" >/dev/null || status=1; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
network_id=$(docker network create --internal --label "salonbw.v18.run=$nonce" "$name")
pg_id=$(docker create --name "${name}-pg" --network "$network_id" --network-alias db \
  --label "salonbw.v18.run=$nonce" -e POSTGRES_USER=v18_local \
  -e POSTGRES_PASSWORD=v18_local_disposable -e "POSTGRES_DB=$db" postgres@sha256:63e83b5a3dc36a917dccb76fe1bd2ac51f1ec9c1deb47ff20d4f04233bf6eae9)
node_id=$(docker create --name "${name}-node" --network "$network_id" \
  --label "salonbw.v18.run=$nonce" node@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee \
  node -e 'const net=require("node:net"); const s=net.connect(5432,"db"); s.setTimeout(5000); s.on("connect",()=>{ console.log("NODE_PG_DNS_TCP=PASS"); s.end(); }); s.on("error",()=>process.exit(1)); s.on("timeout",()=>process.exit(1));')
[[ $(docker network inspect -f '{{.Internal}}' "$network_id") == true ]]
for id in "$pg_id" "$node_id"; do
  [[ $(docker inspect -f '{{index .Config.Labels "salonbw.v18.run"}} {{.HostConfig.NetworkMode}}' "$id") == "$nonce $network_id" ]]
  bindings=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$id")
  [[ $bindings == '{}' || $bindings == null ]]
done
docker start "$pg_id" >/dev/null
for attempt in {1..60}; do
  if docker exec "$pg_id" pg_isready -q -U v18_local -d "$db"; then break; fi
  if [[ $attempt == 60 ]]; then echo 'LOCAL_NETWORK_BLOCKED: database not ready' >&2; exit 1; fi
  sleep 1
done
[[ $(docker exec -e PGDATABASE="$db" "$pg_id" psql -X -U v18_local -Atc 'SELECT current_database()') == "$db" ]]
docker start -a "$node_id"
[[ $(docker inspect -f '{{.State.ExitCode}}' "$node_id") == 0 ]]
echo 'LOCAL_NETWORK_SMOKE=PASS (DNS and TCP only; not application E2E)'
