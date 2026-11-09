#!/usr/bin/env bash
# Private, reversible DEV application snapshots. Never targets production roots.
# Usage: bash staging-release-snapshot.sh <prepare|rollback|finalize> <absolute-dev-root> <run-token> <api|frontend>
#        bash staging-release-snapshot.sh prune <absolute-dev-root> <current-run-token> <api|frontend> [--execute]
#
# prune keeps the newest DEPLOY_SNAPSHOT_KEEP (default 3, minimum 2) run-token
# snapshots of ONE dev app and reports (dry-run) or deletes (--execute) older
# ones. It never touches: the current token or anything newer, names that are
# not <run_id>-<attempt> (manual/UAT snapshots), .pending-* directories,
# snapshots containing a KEEP marker, snapshots restored by rollback in the
# last 7 days (ROLLED_BACK marker), tokens listed in DEPLOY_SNAPSHOT_PROTECT,
# and anything whose identity markers do not match this exact app.
set -euo pipefail
mode="${1:-}"
dest="${2:-}"
token="${3:-}"
kind="${4:-}"
flag="${5:-}"
allowed_root="${DEPLOY_ALLOWED_ROOT:-/usr/home/vetternkraft}"
recovery_root="${DEPLOY_RECOVERY_ROOT:-$allowed_root/.deployment-private/staging-rollback}"
token_re='^[0-9]+-[0-9]+$'

[[ "$mode" == prepare || "$mode" == rollback || "$mode" == finalize || "$mode" == prune ]] || { echo "Invalid recovery operation" >&2; exit 2; }
[[ "$token" =~ ^[a-zA-Z0-9_-]{1,80}$ ]] || { echo "Invalid immutable release token" >&2; exit 2; }
[[ -z "$flag" || ( "$mode" == prune && "$flag" == --execute ) ]] || { echo "Unexpected argument" >&2; exit 2; }
[[ "$dest" == "$allowed_root/apps/nodejs/"* && "$dest" != *"/../"* && "$dest" != *"/./"* ]] || { echo "Unsafe dev app path" >&2; exit 2; }
[[ -d "$dest" && ! -L "$dest" ]] || { echo "Missing or linked app directory" >&2; exit 2; }
app="${dest##*/}"
case "$kind:$app" in
  api:api_salonbw_dev|frontend:panelbw_dev|frontend:salonbw) ;;
  *) echo "Production or unknown application forbidden" >&2; exit 2 ;;
esac
[[ "$dest" == "$allowed_root/apps/nodejs/$app" ]] || { echo "Nested destination forbidden" >&2; exit 2; }

# Include every known path written by deploy.yml (plus generated lockfiles).
# Persistent uploads, logs, and diagnostics are intentionally outside this set.
if [[ "$kind" == api ]]; then
  parts=(dist node_modules package.json package-lock.json npm-shrinkwrap.json app.js app.cjs .env .env.generated)
else
  parts=(app.js app.cjs node_modules .next public package.json next.config.mjs packages src scripts .env.runtime.json .env .env.production .env.local .env.production.local package-lock.json npm-shrinkwrap.json)
fi

app_recovery="$recovery_root/$app"
snapshot="$app_recovery/$token"

# One store-wide mutex shared by prepare, rollback, finalize and prune, so a
# manual rollback can never read a snapshot that prune is deleting. A lock
# whose owner process no longer exists (dropped SSH session) is reclaimed.
lock_dir="$recovery_root/.lock"
lock_owned=false
temp=""
release() {
  if [[ -n "$temp" ]]; then rm -rf "$temp"; fi
  if [[ "$lock_owned" == true ]]; then rm -rf "$lock_dir"; fi
}
trap release EXIT
acquire_lock() {
  local waited=0 holder
  local limit="${DEPLOY_SNAPSHOT_LOCK_WAIT:-300}"
  [[ ! -L "$recovery_root" ]] || { echo "Linked recovery root forbidden" >&2; exit 2; }
  mkdir -p "$recovery_root"
  chmod 700 "$recovery_root"
  while ! mkdir "$lock_dir" 2>/dev/null; do
    holder="$(cat "$lock_dir/pid" 2>/dev/null || true)"
    if [[ "$holder" =~ ^[0-9]+$ ]] && ! kill -0 "$holder" 2>/dev/null; then
      echo "Reclaiming stale snapshot lock (owner process gone)" >&2
      rm -rf "$lock_dir"
      continue
    fi
    if (( waited >= limit )); then
      echo "Snapshot store is locked by another operation; refusing to continue" >&2
      exit 1
    fi
    sleep 5
    waited=$((waited + 5))
  done
  lock_owned=true
  printf '%s\n' "$$" > "$lock_dir/pid"
}
acquire_lock

# True when a snapshot directory belongs to exactly this app and is complete.
identity_ok() {
  local dir="$1"
  [[ -d "$dir" && ! -L "$dir" && -f "$dir/READY" && ! -L "$dir/READY" ]] || return 1
  [[ -f "$dir/destination" && ! -L "$dir/destination" && -f "$dir/kind" && ! -L "$dir/kind" ]] || return 1
  [[ "$(cat "$dir/destination")" == "$dest" && "$(cat "$dir/kind")" == "$kind" ]]
}

if [[ "$mode" == prepare ]]; then
  [[ ! -e "$snapshot" && ! -L "$snapshot" ]] || { echo "Snapshot already exists: refusing overwrite" >&2; exit 1; }
  mkdir -p "$app_recovery"
  chmod 700 "$recovery_root" "$app_recovery"
  temp="$app_recovery/.pending-$token-$$"
  mkdir -p "$temp/files"
  chmod 700 "$temp" "$temp/files"
  printf '%s\n' "$dest" > "$temp/destination"
  printf '%s\n' "$kind" > "$temp/kind"
  : > "$temp/present"
  for part in "${parts[@]}"; do
    if [[ -e "$dest/$part" || -L "$dest/$part" ]]; then
      cp -Rp "$dest/$part" "$temp/files/$part"
      printf '%s\n' "$part" >> "$temp/present"
    fi
  done
  # READY is the commit marker: no runtime mutation may precede this point.
  touch "$temp/READY"
  mv "$temp" "$snapshot"
  temp=""
  echo "Staging rollback snapshot READY for $app (private, no secrets logged)"
  exit 0
fi

if [[ "$mode" == prune ]]; then
  [[ "$token" =~ $token_re ]] || { echo "prune requires the current <run_id>-<attempt> token" >&2; exit 2; }
  keep="${DEPLOY_SNAPSHOT_KEEP:-3}"
  [[ "$keep" =~ ^[0-9]+$ ]] && (( keep >= 2 )) || { echo "DEPLOY_SNAPSHOT_KEEP must be an integer >= 2" >&2; exit 2; }
  protect="${DEPLOY_SNAPSHOT_PROTECT:-}"
  read -r -a protect_list <<< "$protect"
  for p in "${protect_list[@]+"${protect_list[@]}"}"; do
    [[ "$p" =~ ^[a-zA-Z0-9_-]{1,80}$ ]] || { echo "Invalid token in DEPLOY_SNAPSHOT_PROTECT" >&2; exit 2; }
  done
  [[ -d "$app_recovery" && ! -L "$app_recovery" ]] || { echo "Missing or linked snapshot directory for $app" >&2; exit 1; }
  identity_ok "$snapshot" || { echo "Current snapshot missing or invalid: refusing to prune $app" >&2; exit 1; }
  execute=false
  [[ "$flag" == --execute ]] && execute=true
  label="WOULD-DELETE"
  [[ "$execute" == true ]] && label="DELETE"

  current_run="$((10#${token%-*}))"
  current_attempt="$((10#${token#*-}))"
  tokens=()
  for entry in "$app_recovery"/*; do
    [[ -e "$entry" || -L "$entry" ]] || continue
    name="${entry##*/}"
    if [[ "$name" =~ $token_re ]]; then
      tokens+=("$name")
    else
      echo "KEEP $name (not a run token)"
    fi
  done
  pending=0
  for entry in "$app_recovery"/.pending-*; do
    [[ -e "$entry" || -L "$entry" ]] && pending=$((pending + 1))
  done
  (( pending == 0 )) || echo "NOTICE $pending .pending-* entr(y/ies) left untouched for manual review"

  kept=0 candidates=0 reclaim_kib=0 skipped=0
  # Newest first: numeric run_id, then numeric attempt.
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    dir="$app_recovery/$name"
    run="$((10#${name%-*}))"
    attempt="$((10#${name#*-}))"
    if (( run > current_run || (run == current_run && attempt > current_attempt) )); then
      echo "KEEP $name (newer than current run)"; continue
    fi
    if (( kept < keep )); then
      kept=$((kept + 1)); echo "KEEP $name (newest $keep)"; continue
    fi
    if [[ " $protect " == *" $name "* ]]; then
      echo "KEEP $name (DEPLOY_SNAPSHOT_PROTECT)"; continue
    fi
    if [[ -e "$dir/KEEP" || -L "$dir/KEEP" ]]; then
      echo "KEEP $name (KEEP marker)"; continue
    fi
    if [[ -f "$dir/ROLLED_BACK" && -n "$(find "$dir/ROLLED_BACK" -mtime -7 2>/dev/null)" ]]; then
      echo "KEEP $name (used by rollback in last 7 days)"; continue
    fi
    if ! identity_ok "$dir"; then
      echo "SKIP $name (identity markers invalid; left for manual review)"
      skipped=$((skipped + 1)); continue
    fi
    size_kib="$(du -sk "$dir" | awk '{print $1}')"
    echo "$label $name ${size_kib}KiB"
    candidates=$((candidates + 1))
    reclaim_kib=$((reclaim_kib + size_kib))
    if [[ "$execute" == true ]]; then
      rm -rf -- "$dir"
      printf '%s app=%s token=%s kib=%s by_run=%s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$app" "$name" "$size_kib" "$token" >> "$recovery_root/prune.log"
    fi
  done < <(printf '%s\n' "${tokens[@]+"${tokens[@]}"}" | sort -t- -k1,1nr -k2,2nr)

  echo "PRUNE app=$app mode=$([[ "$execute" == true ]] && echo execute || echo dry-run) keep=$keep kept=$kept candidates=$candidates skipped=$skipped reclaim_kib=$reclaim_kib"
  exit 0
fi

identity_ok "$snapshot" || { echo "No complete snapshot: refusing rollback/finalize" >&2; exit 1; }
if [[ "$mode" == finalize ]]; then
  rm -rf "$snapshot"
  echo "Explicitly finalized dev rollback snapshot for $app"
  exit 0
fi

# The READY marker is insufficient if snapshot files have been lost.
# Validate all declared elements BEFORE the first destructive operation.
if [[ ! -d "$snapshot/files" || -L "$snapshot/files" ||
      ! -f "$snapshot/present" || -L "$snapshot/present" ]]; then
  echo 'Incomplete staging snapshot: missing files directory or manifest' >&2
  exit 1
fi
declare -A recorded=()
while IFS= read -r entry || [[ -n "$entry" ]]; do
  allowed=false
  for part in "${parts[@]}"; do
    if [[ "$entry" == "$part" ]]; then allowed=true; break; fi
  done
  if [[ "$allowed" != true ]]; then
    echo 'Invalid staging snapshot manifest entry' >&2
    exit 1
  fi
  if [[ -n "${recorded[$entry]+present}" ]]; then
    echo 'Duplicate staging snapshot manifest entry' >&2
    exit 1
  fi
  if [[ ! -e "$snapshot/files/$entry" && ! -L "$snapshot/files/$entry" ]]; then
    echo 'Incomplete staging snapshot: declared element missing' >&2
    exit 1
  fi
  recorded["$entry"]=1
done < "$snapshot/present"
if [[ "${#recorded[@]}" -eq 0 ]]; then
  echo 'Empty staging snapshot manifest' >&2
  exit 1
fi
for part in "${parts[@]}"; do
  if [[ -e "$snapshot/files/$part" || -L "$snapshot/files/$part" ]] &&
     [[ -z "${recorded[$part]+present}" ]]; then
    echo 'Unlisted staging snapshot element' >&2
    exit 1
  fi
done
# Restore files and directories as one verified, whitelisted set.
# Retain the private backup after rollback for diagnosis/retry, and mark it
# so prune protects it for 7 days.
for part in "${parts[@]}"; do
  rm -rf "$dest/$part"
  if [[ -e "$snapshot/files/$part" || -L "$snapshot/files/$part" ]]; then
    cp -Rp "$snapshot/files/$part" "$dest/$part"
  fi
done
if [[ "$kind" == frontend ]]; then
  rm -f "$dest/deploy.tar.gz"
fi
touch "$snapshot/ROLLED_BACK"
echo "Staging runtime rollback complete for $app; Passenger restart and smoke check required"
