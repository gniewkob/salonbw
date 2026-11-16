#!/usr/bin/env bash
# Read-only PostgreSQL identity preflight for the existing DEV API on MyDevil.
# Uses the DEV .env and installed runtime dependencies only on the SSH host.
# No secrets, DSNs, role names, SQL rows, or connection errors are printed.
# No application startup, restart, migration, fixture, or data mutation.
set -euo pipefail

if [[ $# -ne 0 || ${MYDEVIL_SSH_TARGET:-} != vetternkraft@s0.mydevil.net ]]; then
  echo 'DEV_DB_SSH=BLOCKED (expected fixed DEV SSH target, no arguments)' >&2
  exit 2
fi
command -v ssh >/dev/null || {
  echo 'DEV_DB_SSH=BLOCKED (ssh unavailable)' >&2
  exit 2
}

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
  -o ConnectTimeout=12 -o NumberOfPasswordPrompts=0 \
  "$MYDEVIL_SSH_TARGET" /bin/sh -s <<'REMOTE'
set -eu

stop() {
  printf 'DEV_DB_SSH=BLOCKED (%s)\n' "$1" >&2
  exit 1
}

[ "$(uname -s)" = FreeBSD ] || stop 'unexpected server OS'
app="$HOME/apps/nodejs/api_salonbw_dev"
prod="$HOME/apps/nodejs/api_salonbw/.env"
[ -r "$app/.env" ] && [ -f "$app/package.json" ] && [ -r "$prod" ] ||
  stop 'DEV runtime or environment unavailable'
cd "$app" || stop 'DEV API directory unavailable'

if command -v node22 >/dev/null 2>&1; then
  node_cmd=$(command -v node22)
elif command -v node >/dev/null 2>&1; then
  node_cmd=$(command -v node)
else
  stop 'Node.js runtime unavailable'
fi

"$node_cmd" - <<'JS'
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { URL } = require('node:url');

const EXPECTED = 'p11522_salonbw_d';
const HOST = 'pgsql0.mydevil.net';
const localRequire = createRequire(path.join(process.cwd(), 'package.json'));

async function verify() {
  let client;
  let connected = false;
  let transactionOpen = false;
  try {
    const { parse } = localRequire('dotenv');
    const { Client } = localRequire('pg');
    const devText = fs.readFileSync('.env', 'utf8');
    const prodText = fs.readFileSync('../api_salonbw/.env', 'utf8');
    const dev = parse(devText);
    const prod = parse(prodText);

    // A repeated sensitive setting is an ambiguous runtime configuration.
    for (const key of [
      'APP_ENV', 'DATABASE_URL', 'DEV_DATABASE_NAME',
      'OUTBOUND_DELIVERY_ENABLED', 'SMSAPI_ENABLED'
    ]) {
      const escaped = key.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
      const pattern = new RegExp('^\\s*(?:export\\s+)?' + escaped + '\\s*=', 'gm');
      if ((devText.match(pattern) || []).length !== 1) {
        throw new Error('ambiguous dev env');
      }
    }

    if (
      dev.APP_ENV !== 'development' ||
      dev.DEV_DATABASE_NAME !== EXPECTED ||
      dev.OUTBOUND_DELIVERY_ENABLED !== 'false' ||
      dev.SMSAPI_ENABLED !== 'false' ||
      !dev.DATABASE_URL || !prod.DATABASE_URL ||
      dev.DATABASE_URL === prod.DATABASE_URL
    ) {
      throw new Error('unsafe runtime isolation');
    }

    const url = new URL(dev.DATABASE_URL);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      url.hostname !== HOST ||
      (url.port && url.port !== '5432') ||
      decodeURIComponent(url.pathname) !== '/' + EXPECTED ||
      decodeURIComponent(url.username) !== EXPECTED ||
      !url.password || url.hash
    ) {
      throw new Error('unsafe database target');
    }

    // No production database is connected to, including for permissions probes.
    client = new Client({
      connectionString: dev.DATABASE_URL,
      ssl: dev.PGSSL === '1' ? true : undefined,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
      application_name: 'salonbw_v18_dev_readonly_identity'
    });

    await client.connect();
    connected = true;
    await client.query('BEGIN TRANSACTION READ ONLY');
    transactionOpen = true;
    await client.query("SET LOCAL statement_timeout = '10s'");

    const result = await client.query(
      'SELECT current_database() AS db_name, current_user AS role_name, ' +
      "current_setting('transaction_read_only') AS readonly_flag, " +
      'r.rolsuper AS is_superuser, r.rolcreatedb AS can_create_db, ' +
      'r.rolcreaterole AS can_create_role ' +
      'FROM pg_catalog.pg_roles r WHERE r.rolname = current_user'
    );
    if (result.rows.length !== 1) {
      throw new Error('ambiguous database identity');
    }
    const row = result.rows[0];
    if (
      row.db_name !== EXPECTED ||
      row.role_name !== EXPECTED ||
      row.readonly_flag !== 'on' ||
      row.is_superuser !== false ||
      row.can_create_db !== false ||
      row.can_create_role !== false
    ) {
      throw new Error('database role identity or privilege mismatch');
    }

    await client.query('ROLLBACK');
    transactionOpen = false;
    await client.end();
    connected = false;

    process.stdout.write('DEV_DB_LIVE_IDENTITY=PASS\n');
    process.stdout.write('DEV_DB_READ_ONLY_TRANSACTION=PASS\n');
    process.stdout.write('DEV_DB_ROLE_NO_CLUSTER_ADMIN=PASS\n');
    process.stdout.write('DEV_DB_PROD_ACCESS_BOUNDARY=NOT_VERIFIED\n');
    process.stdout.write('DEV_DB_RESTORE=NOT_VERIFIED\n');
  } catch {
    process.stderr.write('DEV_DB_SSH=BLOCKED (configuration, connection or role; details redacted)\n');
    process.exitCode = 1;
  } finally {
    if (transactionOpen) {
      try { await client.query('ROLLBACK'); } catch { /* no detail output */ }
    }
    if (connected) {
      try { await client.end(); } catch { /* no detail output */ }
    }
  }
}

void verify();
JS
REMOTE
