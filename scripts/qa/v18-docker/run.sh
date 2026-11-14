#!/usr/bin/env bash
# Executed ONLY as the ephemeral qa service from compose.yaml.
# No host mounts, exposed ports, external egress, or real client records.
set -euo pipefail
umask 077

die() { printf 'V18_DOCKER_UAT=BLOCKED (%s)\n' "$1" >&2; exit 1; }
[[ -f /.dockerenv ]] || die 'not a Docker container'
[[ ${QA_ISOLATED_DOCKER:-} == 1 && ${CI:-} == true ]] || die 'Docker QA mode missing'
[[ ${GITHUB_ACTIONS:-} != true ]] || die 'GitHub Actions mode cannot be spoofed'
[[ ${V18_QA_SOURCE_SHA:-} =~ ^[a-f0-9]{40}$ ]] || die 'immutable source SHA missing'
[[ ${APP_ENV:-} == test && ${NODE_ENV:-} == test ]] || die 'APP_ENV / NODE_ENV not test'
[[ ${DATABASE_URL:-} == postgresql://salonbw_browser_uat:salonbw_browser_uat_local_only@127.0.0.1:5432/salonbw_browser_uat ]] || die 'unexpected DB target'
[[ ${API_PROXY_URL:-} == http://127.0.0.1:3200 ]] || die 'unexpected proxy'
[[ ${OUTBOUND_DELIVERY_ENABLED:-} == false && ${SMSAPI_ENABLED:-} == false && ${EMAIL_ENABLED:-} == false && ${WHATSAPP_ENABLED:-} == false ]] || die 'outbound not disabled'
[[ ${DB_SYNCHRONIZE:-} == false ]] || die 'unsafe schema synchronization'
[[ ${NEXT_PUBLIC_DEPLOYMENT_ENV:-} == development && ${NEXT_PUBLIC_AUTH_COOKIE_PREFIX:-} == dev_ ]] || die 'frontend isolation missing'
[[ -z ${PLAYWRIGHT_BASE_URL:-} ]] || die 'external browser base URL prohibited'
[[ -z ${PRODUCTION_DATABASE_URL:-} ]] || die 'production DSN prohibited'

cd /app
printf 'V18_DOCKER_UAT_SOURCE=%s\n' "$V18_QA_SOURCE_SHA"
printf 'V18_DOCKER_UAT_NETWORK=PRIVATE_NO_HOST_PORTS\n'

node --check scripts/qa/v18-docker/disposable-db-marker.cjs
node --test scripts/ci/qa-owner-browser-pg-safety.test.mjs
pnpm --filter salonbw-backend exec jest --runInBand environment-isolation.spec.ts
pnpm --filter salonbw-backend run typecheck
pnpm --dir apps/panel exec tsc --noEmit
printf 'V18_DOCKER_STATIC_TESTS=PASS\n'

# Negative proof: fixture must fail on a nonempty disposable DB.
node scripts/qa/v18-docker/disposable-db-marker.cjs mark-nonempty
negative_log=$(mktemp /tmp/salonbw-negative-seed.XXXXXX)
api_pid=''
cleanup() {
    if [[ -n $api_pid ]]; then
        kill "$api_pid" >/dev/null 2>&1 || true
        wait "$api_pid" >/dev/null 2>&1 || true
    fi
    rm -f "$negative_log"
}
trap cleanup EXIT
if pnpm --dir backend/salonbw-backend exec ts-node --transpile-only \
    scripts/qa-owner-browser-postgres.ts seed >"$negative_log" 2>&1; then
    die 'fixture incorrectly seeded populated database'
fi
node scripts/qa/v18-docker/disposable-db-marker.cjs assert-unchanged-and-clear
printf 'V18_DOCKER_NEGATIVE_SEED=PASS\n'

# Positive path uses the same newly empty disposable PG (no dropSchema).
pnpm --dir backend/salonbw-backend exec ts-node --transpile-only \
    scripts/qa-owner-browser-postgres.ts seed

NODE_ENV=test APP_ENV=test PORT=3200 \
    node backend/salonbw-backend/dist/src/main.js >/tmp/salonbw-docker-api.log 2>&1 &
api_pid=$!
ready=0
for ((i=0; i<90; i++)); do
    if node -e "fetch('http://127.0.0.1:3200/healthz').then(r => process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; then
        ready=1
        break
    fi
    kill -0 "$api_pid" 2>/dev/null || die 'NestJS exited before health'
    sleep 2
done
[[ $ready == 1 ]] || die 'NestJS health failed'
printf 'V18_DOCKER_NEST_HEALTH=PASS\n'

# Playwright config runs prebuilt Next.js with no rebuild/network access.
pnpm --dir apps/panel exec playwright test \
    tests/visual/studio-v18-owner-real-stack.spec.ts \
    --project=mobile-chromium-390 --workers=1 --retries=0 --reporter=list
pnpm --dir backend/salonbw-backend exec ts-node --transpile-only \
    scripts/qa-owner-browser-postgres.ts verify
printf 'V18_DOCKER_OWNER_REAL_STACK=PASS\n'

pnpm --dir apps/panel exec playwright test \
    tests/visual/studio-v18-calendar-drag-real-stack.spec.ts \
    --project=desktop-1366 --workers=1 --retries=0 --reporter=list
printf 'V18_DOCKER_DRAG_REAL_STACK=PASS\n'
printf 'V18_DOCKER_UAT=PASS_ISOLATED_SYNTHETIC_ONLY\n'
