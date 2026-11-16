#!/usr/bin/env bash
# Read-only quota verification on MyDevil/FreeBSD over SSH.
# Uses the source-locked, already unit-tested parser from this exact commit.
# Never prints the provider report, creates remote files or modifies apps/DB.
set -euo pipefail
umask 077

if [[ $# -ne 0 ||
      ${MYDEVIL_SSH_TARGET:-} != vetternkraft@s0.mydevil.net ||
      ! ${V18_SOURCE_SHA:-} =~ ^[a-f0-9]{40}$ ]]; then
  echo 'V18_SSH_QUOTA=BLOCKED (fixed SSH target and 40-char V18_SOURCE_SHA required)' >&2
  exit 2
fi
for program in ssh git mktemp; do
  command -v "$program" >/dev/null || {
    echo "V18_SSH_QUOTA=BLOCKED (missing $program)" >&2
    exit 2
  }
done

if ! git cat-file -e "${V18_SOURCE_SHA}^{commit}" 2>/dev/null; then
  echo 'V18_SSH_QUOTA=BLOCKED (source SHA not fetched)' >&2
  exit 2
fi

temp_dir=$(mktemp -d "${TMPDIR:-/tmp}/salonbw-v18-quota.XXXXXXXX")
cleanup() { rm -f "$temp_dir/limits.txt" "$temp_dir/validator.cjs"; rmdir "$temp_dir"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if ! git show "${V18_SOURCE_SHA}:scripts/ci/check-mydevil-dev-quota.cjs" > "$temp_dir/validator.cjs"; then
  echo 'V18_SSH_QUOTA=BLOCKED (source-locked validator unavailable)' >&2
  exit 2
fi

# Both read-only host commands run in ONE authenticated SSH session.
# The marker carries only filesystem free space; no secret/env is transmitted.
if ! ssh -o BatchMode=yes -o StrictHostKeyChecking=yes \
  -o ConnectTimeout=12 -o NumberOfPasswordPrompts=0 \
  "$MYDEVIL_SSH_TARGET" /bin/sh -s > "$temp_dir/limits.txt" <<'REMOTE'
set -eu
free_kib=$(df -Pk "$HOME" | awk 'NR == 2 { print $4 }')
case "$free_kib" in
  ''|*[!0-9]*) exit 31 ;;
esac
printf 'V18_FILESYSTEM_FREE_KIB=%s\n' "$free_kib"
command -v devil >/dev/null || exit 32
devil info limits
REMOTE
then
  echo 'V18_SSH_QUOTA=BLOCKED (SSH/provider command failed)' >&2
  exit 1
fi

IFS= read -r marker < "$temp_dir/limits.txt" || {
  echo 'V18_SSH_QUOTA=BLOCKED (no filesystem marker)' >&2
  exit 1
}
case "$marker" in
  V18_FILESYSTEM_FREE_KIB=*) ;;
  *) echo 'V18_SSH_QUOTA=BLOCKED (invalid filesystem marker)' >&2; exit 1 ;;
esac
filesystem_free=${marker#V18_FILESYSTEM_FREE_KIB=}
case "$filesystem_free" in
  ''|*[!0-9]*) echo 'V18_SSH_QUOTA=BLOCKED (invalid filesystem value)' >&2; exit 1 ;;
esac

if command -v node22 >/dev/null 2>&1; then
  node_bin=node22
elif command -v node >/dev/null 2>&1; then
  node_bin=node
else
  echo 'V18_SSH_QUOTA=BLOCKED (Node.js not on local PATH)' >&2
  exit 2
fi

# Drop the filesystem marker. The canonical validator parses the rest and
# checks both account and filesystem independently for at least 4 GiB.
if ! tail -n +2 "$temp_dir/limits.txt" |
  MYDEVIL_FILESYSTEM_FREE_KIB="$filesystem_free" \
    "$node_bin" "$temp_dir/validator.cjs" >/dev/null; then
  echo 'V18_SSH_QUOTA=BLOCKED (account or filesystem gate failed)' >&2
  exit 1
fi
printf 'DEV_MYDEVIL_ACCOUNT_QUOTA_4GIB=PASS\n'
printf 'DEV_FILESYSTEM_FREE_4GIB=PASS\n'
printf 'DEV_QUOTA_EVIDENCE=READ_ONLY_SSH\n'
printf 'DEV_DATABASE_AND_RECOVERY=NOT_VERIFIED\n'
