#!/usr/bin/env bash
# Static, read-only runtime isolation checks on the MyDevil DEV host.
# Does not restart processes, inspect customer records, login, or change data.
set -euo pipefail

if [[ $# -ne 0 || ${MYDEVIL_SSH_TARGET:-} != vetternkraft@s0.mydevil.net ]]; then
  echo 'DEV_RUNTIME_SSH=BLOCKED (fixed DEV SSH target required)' >&2
  exit 2
fi
command -v ssh >/dev/null || {
  echo 'DEV_RUNTIME_SSH=BLOCKED (SSH client unavailable)' >&2
  exit 2
}

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
  -o ConnectTimeout=12 -o NumberOfPasswordPrompts=0 \
  "$MYDEVIL_SSH_TARGET" /bin/sh -s <<'REMOTE'
set -eu
[ "$(uname -s)" = FreeBSD ] || {
  echo 'DEV_RUNTIME_SSH=BLOCKED (OS mismatch)' >&2
  exit 1
}
node_cmd=''
if command -v node22 >/dev/null 2>&1; then
  node_cmd=$(command -v node22)
elif command -v node >/dev/null 2>&1; then
  node_cmd=$(command -v node)
else
  echo 'DEV_RUNTIME_SSH=BLOCKED (Node.js missing)' >&2
  exit 1
fi
cd "$HOME/apps/nodejs/api_salonbw_dev" || {
  echo 'DEV_RUNTIME_SSH=BLOCKED (API root missing)' >&2
  exit 1
}

"$node_cmd" - <<'JS'
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const base = path.resolve(process.cwd(), '..');
const api = path.join(base, 'api_salonbw_dev');
const prod = path.join(base, 'api_salonbw');
const requireApi = createRequire(path.join(api, 'package.json'));

const guard = (ok) => {
  if (!ok) throw new Error('runtime boundary check failed');
};

function readPrivateRuntime(root) {
  const file = path.join(base, root, '.env.runtime.json');
  const st = fs.lstatSync(file);
  guard(st.isFile() && !st.isSymbolicLink());
  guard(st.size > 0 && st.size <= 16384 && (st.mode & 0o077) === 0);
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  guard(raw && typeof raw === 'object' && !Array.isArray(raw));

  const allowed = new Set([
    'NODE_ENV', 'APP_ENV', 'APP_RELEASE', 'API_PROXY_URL',
    'DEV_ACCESS_USER', 'DEV_ACCESS_PASSWORD',
    'NEXT_PUBLIC_DEPLOYMENT_ENV', 'NEXT_PUBLIC_AUTH_COOKIE_PREFIX',
    'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_LANDING_URL',
    'NEXT_PUBLIC_PANEL_URL'
  ]);
  for (const [key, value] of Object.entries(raw)) {
    guard(allowed.has(key) && typeof value === 'string');
  }
  guard(raw.NODE_ENV === 'production');
  guard(raw.APP_ENV === 'development');
  guard(raw.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development');
  guard(raw.NEXT_PUBLIC_AUTH_COOKIE_PREFIX === 'dev_');
  guard(raw.API_PROXY_URL === 'https://dev-api.salon-bw.pl');
  guard(/^[a-f0-9]{40}$/.test(raw.APP_RELEASE || ''));
  guard(typeof raw.DEV_ACCESS_USER === 'string' && raw.DEV_ACCESS_USER.length > 0);
  guard(typeof raw.DEV_ACCESS_PASSWORD === 'string' && raw.DEV_ACCESS_PASSWORD.length > 0);
  return raw;
}

async function main() {
  try {
    const dotenv = requireApi('dotenv');
    const dev = dotenv.parse(fs.readFileSync(path.join(api, '.env'), 'utf8'));
    const production = dotenv.parse(fs.readFileSync(path.join(prod, '.env'), 'utf8'));
    guard(dev.APP_ENV === 'development' && dev.AUTH_COOKIE_PREFIX === 'dev_');
    guard(dev.OUTBOUND_DELIVERY_ENABLED === 'false' && dev.SMSAPI_ENABLED === 'false');
    guard(dev.DB_SYNCHRONIZE !== 'true');
    guard(typeof dev.DEV_ACCESS_USER === 'string' && dev.DEV_ACCESS_USER.length > 0);
    guard(typeof dev.DEV_ACCESS_PASSWORD === 'string' && dev.DEV_ACCESS_PASSWORD.length > 0);

    const devDb = new URL(dev.DATABASE_URL || '');
    const prodDb = new URL(production.DATABASE_URL || '');
    guard(['postgres:', 'postgresql:'].includes(devDb.protocol));
    guard(devDb.hostname === 'pgsql0.mydevil.net');
    guard(decodeURIComponent(devDb.pathname) === '/p11522_salonbw_d');
    guard(decodeURIComponent(devDb.username) === 'p11522_salonbw_d');
    guard(prodDb.username && prodDb.pathname);
    guard(
      decodeURIComponent(devDb.username) !== decodeURIComponent(prodDb.username) &&
      decodeURIComponent(devDb.pathname) !== decodeURIComponent(prodDb.pathname)
    );
    process.stdout.write('DEV_PROD_DB_IDENTITIES_DISTINCT=PASS (config only)\n');

    const panel = readPrivateRuntime('panelbw_dev');
    const landing = readPrivateRuntime('salonbw');
    for (const frontend of [panel, landing]) {
      guard(frontend.DEV_ACCESS_USER === dev.DEV_ACCESS_USER);
      guard(frontend.DEV_ACCESS_PASSWORD === dev.DEV_ACCESS_PASSWORD);
    }
    process.stdout.write('DEV_FRONTEND_RUNTIME_PERMISSIONS=PASS\n');
    process.stdout.write('DEV_FRONTEND_COOKIE_NAMESPACE=PASS\n');
    process.stdout.write('DEV_FRONTEND_API_PROXY=PASS\n');
    process.stdout.write('DEV_GATEWAY_CONFIGURATION_CONSISTENT=PASS\n');
    process.stdout.write('DEV_OUTBOUND_FLAGS=PASS (configuration only)\n');
    process.stdout.write('DEV_DB_SYNCHRONIZE_NOT_ENABLED=PASS\n');
    process.stdout.write('DEV_SESSIONS_EFFECTIVE=NOT_VERIFIED\n');
    process.stdout.write('DEV_SCHEDULERS_AND_SENDERS_EFFECTIVE=NOT_VERIFIED\n');
    process.stdout.write('DEV_PROD_DB_ACCESS_PERMISSIONS=NOT_VERIFIED\n');
    process.stdout.write('DEV_RUNTIME_SSH=PASS_READ_ONLY_LIMITED\n');
  } catch {
    // Never print env values, credentials, runtime JSON or nested error metadata.
    process.stderr.write(
      'DEV_RUNTIME_SSH=BLOCKED (runtime configuration or access mismatch; details redacted)\n'
    );
    process.exitCode = 1;
  }
}
void main();
JS
REMOTE
