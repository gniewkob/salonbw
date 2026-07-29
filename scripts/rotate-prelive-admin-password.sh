#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/rotate-prelive-admin-password.sh [--no-verify]

Rotates the sole production pre-live admin password to a random value, stores
it in macOS Keychain, and verifies API login without printing secrets.
EOF
}

SSH_USER="${SSH_USER:-vetternkraft}"
SSH_HOST="${SSH_HOST:-s0.mydevil.net}"
REMOTE_APP="${REMOTE_APP:-/usr/home/vetternkraft/apps/nodejs/api_salonbw}"
API_URL="${API_URL:-https://api.salon-bw.pl}"
KEYCHAIN_SERVICE="${KEYCHAIN_SERVICE:-salonbw-prelive-admin}"
DO_VERIFY=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-verify)
      DO_VERIFY=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

for command_name in openssl security ssh curl base64; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "ERROR: required command is unavailable: ${command_name}" >&2
    exit 1
  fi
done

NEW_PASSWORD="$(openssl rand -hex 24)"
PASSWORD_B64="$(printf '%s' "$NEW_PASSWORD" | base64 | tr -d '\r\n')"

cleanup() {
  unset \
    NEW_PASSWORD \
    STORED_PASSWORD \
    PASSWORD_B64 \
    ADMIN_EMAIL \
    ACCOUNT_B64 \
    REMOTE_RESULT
}
trap cleanup EXIT

echo "Rotating password for the sole pre-live admin on ${SSH_HOST}"

REMOTE_RESULT="$({
  printf 'export PASSWORD_B64=%q\n' "$PASSWORD_B64"
  printf 'export REMOTE_APP=%q\n' "$REMOTE_APP"
  cat <<'REMOTE'
set -euo pipefail
set +x

cd "$REMOTE_APP"
if command -v node22 >/dev/null 2>&1; then
  NODE_BIN=node22
elif command -v node >/dev/null 2>&1; then
  NODE_BIN=node
else
  echo "ERROR: Node.js runtime is unavailable" >&2
  exit 1
fi

"$NODE_BIN" <<'NODE'
const bcrypt = require('bcrypt');
const { config } = require('dotenv');
const { Client } = require('pg');

config({ path: '.env', quiet: true });

const password = Buffer.from(process.env.PASSWORD_B64, 'base64').toString('utf8');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing');
}
if (password.length < 32) {
  throw new Error('Generated password is unexpectedly short');
}

const client = new Client({
  connectionString,
  ssl: process.env.PGSSL === '1' ? true : undefined,
});

(async () => {
  await client.connect();
  try {
    await client.query('BEGIN');
    const selected = await client.query(
      `SELECT "id", "email", "role", "password"
       FROM "users"
       WHERE "role"::text = 'admin'
       FOR UPDATE`,
    );

    if (selected.rowCount !== 1) {
      throw new Error(`Expected exactly one pre-live admin, found ${selected.rowCount}`);
    }
    const user = selected.rows[0];
    if (user.role !== 'admin') {
      throw new Error(`Refusing to rotate account with role ${user.role}`);
    }

    const nextHash = await bcrypt.hash(password, 12);
    const updated = await client.query(
      `UPDATE "users"
       SET "password" = $1, "updatedAt" = now()
       WHERE "id" = $2 AND "password" = $3
       RETURNING "id"`,
      [nextHash, user.id, user.password],
    );
    if (updated.rowCount !== 1) {
      throw new Error('Concurrent password update detected');
    }
    if (!(await bcrypt.compare(password, nextHash))) {
      throw new Error('Generated password hash verification failed');
    }

    await client.query('COMMIT');
    process.stdout.write('database_update=ok role=admin\n');
    process.stdout.write(
      `account_b64=${Buffer.from(user.email, 'utf8').toString('base64')}\n`,
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
NODE
REMOTE
} | ssh "${SSH_USER}@${SSH_HOST}" 'bash -s')"

if ! grep -Fxq 'database_update=ok role=admin' <<<"$REMOTE_RESULT"; then
  echo "ERROR: remote update did not return the expected confirmation" >&2
  exit 1
fi

ACCOUNT_B64="$(sed -n 's/^account_b64=//p' <<<"$REMOTE_RESULT")"
if [[ -z "$ACCOUNT_B64" ]] || [[ "$(grep -c '^account_b64=' <<<"$REMOTE_RESULT")" -ne 1 ]]; then
  echo "ERROR: remote update did not return exactly one account identifier" >&2
  exit 1
fi
ADMIN_EMAIL="$(printf '%s' "$ACCOUNT_B64" | openssl base64 -d -A)"
if [[ "$ADMIN_EMAIL" != *@* ]] || [[ "$ADMIN_EMAIL" == *$'\n'* ]]; then
  echo "ERROR: remote account identifier is invalid" >&2
  exit 1
fi

echo "database_update=ok role=admin"

printf '%s\n%s\n' "$NEW_PASSWORD" "$NEW_PASSWORD" |
  security add-generic-password \
    -U \
    -a "$ADMIN_EMAIL" \
    -s "$KEYCHAIN_SERVICE" \
    -l "SalonBW E2E admin" \
    -w >/dev/null

echo "keychain_update=ok service=${KEYCHAIN_SERVICE}"

STORED_PASSWORD="$(
  security find-generic-password \
    -a "$ADMIN_EMAIL" \
    -s "$KEYCHAIN_SERVICE" \
    -w
)"
if [[ -z "$STORED_PASSWORD" ]] || [[ "$STORED_PASSWORD" != "$NEW_PASSWORD" ]]; then
  echo "ERROR: Keychain secret verification failed" >&2
  exit 1
fi
echo "keychain_readback=ok"

if [[ "$DO_VERIFY" -eq 1 ]]; then
  HTTP_STATUS="$(
    printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$STORED_PASSWORD" |
      curl -sS \
        -o /dev/null \
        -w '%{http_code}' \
        -H 'Content-Type: application/json' \
        --data-binary @- \
        "${API_URL%/}/auth/login"
  )"

  if [[ "$HTTP_STATUS" != "200" ]]; then
    echo "ERROR: API login verification failed (HTTP ${HTTP_STATUS})" >&2
    exit 1
  fi
  echo "api_login=ok"
fi

echo "Password rotation completed; secret was not printed."
