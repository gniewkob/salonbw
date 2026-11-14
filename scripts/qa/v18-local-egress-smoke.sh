#!/usr/bin/env bash
# Test isolation against a controlled container, not against an Internet service.
set -Eeuo pipefail
if [[ $# -ne 0 || ${CI:-} == true || ${GITHUB_ACTIONS:-} == true ]]; then
  echo 'LOCAL_EGRESS_BLOCKED: local invocation without arguments required' >&2
  exit 1
fi
command -v docker >/dev/null
command -v openssl >/dev/null
nonce=$(openssl rand -hex 12)
name="salonbw-v18-egress-${nonce}"
image='node@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee'
internal='' outside='' server='' control='' probe=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  for id in "$probe" "$control" "$server"; do
    if [[ -n $id ]]; then docker rm -f "$id" >/dev/null || status=1; fi
  done
  for id in "$internal" "$outside"; do
    if [[ -n $id ]]; then docker network rm "$id" >/dev/null || status=1; fi
  done
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
internal=$(docker network create --internal --label "salonbw.v18.run=$nonce" "${name}-internal")
outside=$(docker network create --internal --label "salonbw.v18.run=$nonce" "${name}-outside")
server=$(docker create --name "${name}-server" --network "$outside" --network-alias target \
  --label "salonbw.v18.run=$nonce" "$image" node -e 'require("node:net").createServer(s=>s.end("v18-controlled-target\n")).listen(8765,"0.0.0.0")')
control=$(docker create --name "${name}-control" --network "$outside" \
  --label "salonbw.v18.run=$nonce" "$image" node -e 'const net=require("node:net");const s=net.connect(8765,"target");s.setTimeout(3000);let v="";s.on("data",d=>v+=d);s.on("end",()=>process.exit(v==="v18-controlled-target\n"?0:1));s.on("error",()=>process.exit(1));s.on("timeout",()=>process.exit(1))')
[[ $(docker network inspect -f '{{.Internal}}' "$internal") == true ]]
[[ $(docker network inspect -f '{{.Internal}}' "$outside") == true ]]
docker start "$server" >/dev/null
for attempt in {1..30}; do
  if docker exec "$server" node -e 'const s=require("node:net").connect(8765,"127.0.0.1");s.on("connect",()=>{s.end();process.exit(0)});s.on("error",()=>process.exit(1))'; then break; fi
  if [[ $attempt == 30 ]]; then echo 'LOCAL_EGRESS_BLOCKED: target not ready' >&2; exit 1; fi
  sleep 1
done
target_ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$server")
[[ $target_ip =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]
probe=$(docker create --name "${name}-probe" --network "$internal" -e "TARGET_IP=$target_ip" \
  --label "salonbw.v18.run=$nonce" "$image" node -e 'const s=require("node:net").connect(8765,process.env.TARGET_IP);s.setTimeout(3000);s.on("connect",()=>{s.destroy();process.exit(1)});s.on("error",()=>process.exit(0));s.on("timeout",()=>process.exit(0))')
for id in "$server" "$control" "$probe"; do
  [[ $(docker inspect -f '{{index .Config.Labels "salonbw.v18.run"}}' "$id") == "$nonce" ]]
  bindings=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$id")
  [[ $bindings == '{}' || $bindings == null ]]
done
docker start -a "$control"
[[ $(docker inspect -f '{{.State.ExitCode}}' "$control") == 0 ]]
docker start -a "$probe"
[[ $(docker inspect -f '{{.State.ExitCode}}' "$probe") == 0 ]]
echo 'LOCAL_EGRESS_SMOKE=PASS (controlled TCP target only)'
