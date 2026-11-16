#!/usr/bin/env bash
# Local-only isolation probe. This does not seed the application or run E2E.
set -Eeuo pipefail

if [[ $# -ne 0 || ${CI:-} == true || ${GITHUB_ACTIONS:-} == true ]]; then
  echo 'LOCAL_PG_BLOCKED: local invocation without arguments required' >&2
  exit 1
fi
command -v docker >/dev/null
command -v openssl >/dev/null
nonce=$(openssl rand -hex 12)
name="salonbw-v18-local-${nonce}"
db="v18_${nonce}"
network_id=''
container_id=''
cleanup() {
  local status=$?
  trap - EXIT INT TERM
  if [[ -n $container_id ]]; then
    # Remove by the immutable ID returned by our own create, never by name.
    docker rm -f "$container_id" >/dev/null || status=1
  fi
  if [[ -n $network_id ]]; then
    docker network rm "$network_id" >/dev/null || status=1
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Network has no external route and exposes no host port.
network_id=$(docker network create --internal --label "salonbw.v18.run=$nonce" "$name")
container_id=$(docker create --name "$name" --network "$network_id" \
  --label "salonbw.v18.run=$nonce" \
  -e POSTGRES_USER=v18_local -e POSTGRES_PASSWORD=v18_local_disposable \
  -e "POSTGRES_DB=$db" postgres:16)
docker start "$container_id" >/dev/null
for attempt in {1..60}; do
  if docker exec "$container_id" pg_isready -q -U v18_local -d "$db"; then break; fi
  if [[ $attempt == 60 ]]; then echo 'LOCAL_PG_BLOCKED: database not ready' >&2; exit 1; fi
  sleep 1
done
# No user-provided URL or SQL, no DROP, no host database connection.
identity=$(docker inspect -f '{{index .Config.Labels "salonbw.v18.run"}} {{.HostConfig.NetworkMode}}' "$container_id")
[[ $identity == "$nonce $network_id" ]] || { echo 'LOCAL_PG_BLOCKED: identity mismatch' >&2; exit 1; }
bindings=$(docker inspect -f '{{json .HostConfig.PortBindings}}' "$container_id")
[[ $bindings == '{}' || $bindings == null ]] || { echo 'LOCAL_PG_BLOCKED: unexpected published port' >&2; exit 1; }
result=$(docker exec -e PGDATABASE="$db" "$container_id" psql -X -v ON_ERROR_STOP=1 -U v18_local -Atc 'SELECT current_database()')
[[ $result == "$db" ]] || { echo 'LOCAL_PG_BLOCKED: database mismatch' >&2; exit 1; }
docker exec -e PGDATABASE="$db" "$container_id" psql -X -v ON_ERROR_STOP=1 -U v18_local -q -c 'CREATE TABLE isolation_probe (value integer NOT NULL); INSERT INTO isolation_probe VALUES (1);' >/dev/null
result=$(docker exec -e PGDATABASE="$db" "$container_id" psql -X -v ON_ERROR_STOP=1 -U v18_local -Atc 'SELECT value FROM isolation_probe')
[[ $result == 1 ]] || exit 1
echo 'LOCAL_PG_ISOLATION_SMOKE=PASS (not application E2E)'
