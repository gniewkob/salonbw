#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/bin"
cat > "$TMP_DIR/bin/ssh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
shift
bash -c "$1"
SH
chmod 700 "$TMP_DIR/bin/ssh"

ENV_FILE="$TMP_DIR/api.env"
printf 'TEST_SECRET="old-value"\n' > "$ENV_FILE"
chmod 600 "$ENV_FILE"

(
  umask 022
  printf '%s' 'new-value' |
    PATH="$TMP_DIR/bin:$PATH" \
      "$ROOT_DIR/scripts/safe-update-api-env.sh" \
      --key TEST_SECRET \
      --read-stdin \
      --ssh-user test \
      --ssh-host test \
      --remote-env "$ENV_FILE" \
      --no-restart \
      --no-verify >/dev/null
)

BACKUP_FILE="$(find "$TMP_DIR" -maxdepth 1 -type f \
  -name 'api.env.bak.safe-update.*' -print -quit)"
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Expected a safe-update backup" >&2
  exit 1
fi

file_mode() {
  if stat -c '%a' "$1" >/dev/null 2>&1; then
    stat -c '%a' "$1"
  else
    stat -f '%Lp' "$1"
  fi
}

if [[ "$(file_mode "$ENV_FILE")" != "600" ]]; then
  echo "Updated env must have mode 600" >&2
  exit 1
fi

if [[ "$(file_mode "$BACKUP_FILE")" != "600" ]]; then
  echo "Backup env must have mode 600" >&2
  exit 1
fi

grep -Fxq 'TEST_SECRET="new-value"' "$ENV_FILE"
grep -Fxq 'TEST_SECRET="old-value"' "$BACKUP_FILE"
echo "safe-update API env permission test: OK"
