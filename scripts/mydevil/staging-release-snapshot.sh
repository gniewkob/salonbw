#!/usr/bin/env bash
# Private, reversible DEV application snapshots. Never targets production roots.
# Usage: bash staging-release-snapshot.sh <prepare|rollback|finalize> <absolute-dev-root> <run-token> <api|frontend>
set -euo pipefail
mode="${1:-}"
dest="${2:-}"
token="${3:-}"
kind="${4:-}"
allowed_root="${DEPLOY_ALLOWED_ROOT:-/usr/home/vetternkraft}"
recovery_root="${DEPLOY_RECOVERY_ROOT:-$allowed_root/.deployment-private/staging-rollback}"

[[ "$mode" == prepare || "$mode" == rollback || "$mode" == finalize ]] || { echo "Invalid recovery operation" >&2; exit 2; }
[[ "$token" =~ ^[a-zA-Z0-9_-]{1,80}$ ]] || { echo "Invalid immutable release token" >&2; exit 2; }
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
if [[ "$mode" == prepare ]]; then
  [[ ! -e "$snapshot" && ! -L "$snapshot" ]] || { echo "Snapshot already exists: refusing overwrite" >&2; exit 1; }
  mkdir -p "$app_recovery"
  chmod 700 "$recovery_root" "$app_recovery"
  temp="$app_recovery/.pending-$token-$$"
  trap 'rm -rf "$temp"' EXIT
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
  trap - EXIT
  echo "Staging rollback snapshot READY for $app (private, no secrets logged)"
  exit 0
fi

[[ -d "$snapshot" && ! -L "$snapshot" && -f "$snapshot/READY" ]] || { echo "No complete snapshot: refusing rollback/finalize" >&2; exit 1; }
[[ "$(cat "$snapshot/destination")" == "$dest" && "$(cat "$snapshot/kind")" == "$kind" ]] || { echo "Snapshot identity mismatch" >&2; exit 1; }
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
# Retain the private backup after rollback for diagnosis/retry.
for part in "${parts[@]}"; do
  rm -rf "$dest/$part"
  if [[ -e "$snapshot/files/$part" || -L "$snapshot/files/$part" ]]; then
    cp -Rp "$snapshot/files/$part" "$dest/$part"
  fi
done
if [[ "$kind" == frontend ]]; then
  rm -f "$dest/deploy.tar.gz"
fi
echo "Staging runtime rollback complete for $app; Passenger restart and smoke check required"
