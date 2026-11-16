#!/usr/bin/env bash
# Read-only DEV checks over the existing owner's SSH session.
# No deploy, restart, DB login/mutation, secret print, or remote files created.
set -euo pipefail

if [[ $# -ne 0 || -z ${MYDEVIL_SSH_TARGET:-} ]]; then
  echo 'Usage: MYDEVIL_SSH_TARGET=vetternkraft@s0.mydevil.net bash scripts/qa/v18-ssh-dev-preflight.sh' >&2
  exit 2
fi
# Reject an unexpected account/hostname instead of running against PROD or
# another SSH target by accident. This repository documents the s0 account.
if [[ ! ${MYDEVIL_SSH_TARGET} =~ ^[A-Za-z0-9._-]+@s0\.mydevil\.net$ ]]; then
  echo 'SSH_DEV_PREFLIGHT=BLOCKED (unexpected SSH target)' >&2
  exit 2
fi
command -v ssh >/dev/null || {
  echo 'SSH_DEV_PREFLIGHT=BLOCKED (ssh unavailable)' >&2
  exit 2
}

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
  -o ConnectTimeout=12 -o NumberOfPasswordPrompts=0 \
  "$MYDEVIL_SSH_TARGET" /bin/sh -s <<'REMOTE'
set -eu

fail() {
  printf 'SSH_DEV_PREFLIGHT=BLOCKED (%s)\n' "$1" >&2
  exit 1
}

[ "$(uname -s)" = FreeBSD ] || fail 'server is not FreeBSD'
[ -n "${HOME:-}" ] || fail 'remote home is missing'

# Verify every DEV domain resolves to its intended DEV application directory.
# cd -P resolves the symlink and the /home vs /usr/home aliases without
# rewriting anything on the host.
check_link() (
  domain=$1
  app=$2
  link="$HOME/domains/$domain/public_nodejs"
  expected="$HOME/apps/nodejs/$app"
  [ -L "$link" ] || fail "missing DEV symlink: $domain"
  [ -d "$expected" ] || fail "missing DEV app: $app"
  actual_path=$(cd -P "$link" && pwd -P) || fail "unresolvable DEV symlink: $domain"
  expected_path=$(cd -P "$expected" && pwd -P) || fail "unresolvable DEV app: $app"
  [ "$actual_path" = "$expected_path" ] || fail "incorrect DEV target: $domain"
  printf 'DEV_PATH_%s=PASS\n' "$app"
)
check_link dev-api.salon-bw.pl api_salonbw_dev
check_link dev-panel.salon-bw.pl panelbw_dev
check_link dev.salon-bw.pl salonbw

# Extract a unique key without printing the .env file, credentials or values.
# Use command substitution only inside the SSH host; keys never cross stdout.
get_env() {
  file=$1
  wanted=$2
  [ -r "$file" ] || return 1
  awk -v wanted="$wanted" '
    /^[[:space:]]*(#|$)/ { next }
    {
      pos = index($0, "="); if (!pos) next
      name = substr($0, 1, pos - 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", name)
      if (name != wanted) next
      val = substr($0, pos + 1)
      sub(/\r$/, "", val)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
      q = substr(val, 1, 1)
      if ((q == "\"" || q == "\047") && substr(val, length(val), 1) == q) {
        val = substr(val, 2, length(val) - 2)
      }
      print val
      count++
    }
    END { if (count != 1) exit 1 }
  ' "$file"
}

require_env() (
  file=$1
  key=$2
  expected=$3
  actual=$(get_env "$file" "$key") || fail "missing/duplicate DEV key: $key"
  [ "$actual" = "$expected" ] || fail "invalid DEV configuration: $key"
  printf 'DEV_CONFIG_%s=PASS\n' "$key"
)

dev_env="$HOME/apps/nodejs/api_salonbw_dev/.env"
prod_env="$HOME/apps/nodejs/api_salonbw/.env"
[ -r "$dev_env" ] || fail 'DEV API env unreadable'
[ -r "$prod_env" ] || fail 'PROD API env unreadable for equality check'
require_env "$dev_env" APP_ENV development
require_env "$dev_env" AUTH_COOKIE_PREFIX dev_
require_env "$dev_env" DEV_DATABASE_NAME p11522_salonbw_d
require_env "$dev_env" OUTBOUND_DELIVERY_ENABLED false
require_env "$dev_env" SMSAPI_ENABLED false

# Compare values in-memory, without outputting the DSN or signing keys.
dev_db=$(get_env "$dev_env" DATABASE_URL) || fail 'missing DEV DATABASE_URL'
prod_db=$(get_env "$prod_env" DATABASE_URL) || fail 'missing PROD DATABASE_URL'
case "$dev_db" in
  postgres://*|postgresql://*) ;;
  *) fail 'invalid DEV database scheme' ;;
esac
case "$dev_db" in
  */p11522_salonbw_d|*/p11522_salonbw_d\?*) ;;
  *) fail 'unexpected DEV database name' ;;
esac
[ -n "$prod_db" ] && [ "$dev_db" != "$prod_db" ] || fail 'DEV/PROD database DSNs overlap'
printf 'DEV_DATABASE_IDENTITY=PASS (configuration only; no DB connection)\n'

for key in JWT_SECRET JWT_REFRESH_SECRET; do
  dev_key=$(get_env "$dev_env" "$key") || fail "missing DEV key: $key"
  prod_key=$(get_env "$prod_env" "$key") || fail "missing PROD key: $key"
  [ -n "$dev_key" ] && [ -n "$prod_key" ] && [ "$dev_key" != "$prod_key" ] || fail "DEV/PROD signing key overlap: $key"
done
[ "$dev_key" != "" ] || fail 'empty signing key'
printf 'DEV_SIGNING_KEYS_SEPARATE=PASS (values never printed)\n'

# df is the filesystem check only; provider account quota is a separate gate.
filesystem_free=$(df -Pk "$HOME" | awk 'NR == 2 { print $4 }') || fail 'filesystem report failed'
case "$filesystem_free" in ''|*[!0-9]*) fail 'filesystem free space unknown' ;; esac
[ "$filesystem_free" -ge 4194304 ] || fail 'filesystem below 4 GiB'
printf 'DEV_FILESYSTEM_FREE_4GIB=PASS\n'

# The authorized quota validator must separately parse devil info limits.
# This script deliberately does NOT claim quota, DB access, cookie-session,
# scheduler, delivery-path or recovery evidence.
printf 'MYDEVIL_ACCOUNT_QUOTA=NOT_VERIFIED\n'
printf 'DEV_DB_CONNECTION_AND_PERMISSIONS=NOT_VERIFIED\n'
printf 'DEV_SESSION_AND_SCHEDULERS=NOT_VERIFIED\n'
printf 'DEV_RECOVERY_REHEARSAL=NOT_VERIFIED\n'
printf 'SSH_DEV_PREFLIGHT=PASS_READ_ONLY_LIMITED\n'
REMOTE
