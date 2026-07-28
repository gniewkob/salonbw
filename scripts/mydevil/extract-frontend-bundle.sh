#!/usr/bin/env bash
set -euo pipefail

REMOTE_DEST="${1:-}"
ALLOWED_ROOT="${DEPLOY_ALLOWED_ROOT:-/usr/home/vetternkraft}"

if [[ -z "$REMOTE_DEST" || "$REMOTE_DEST" == "$ALLOWED_ROOT" || "$REMOTE_DEST" != "$ALLOWED_ROOT/"* ]]; then
  echo "Refusing unsafe frontend deploy destination" >&2
  exit 1
fi

if [[ ! -d "$REMOTE_DEST" || ! -f "$REMOTE_DEST/deploy.tar.gz" ]]; then
  echo "Missing frontend destination or deploy archive" >&2
  exit 1
fi

timestamp="$(date +%s).$$"
parts=(app.js app.cjs node_modules .next public)
success=false

rollback() {
  local status=$?
  if [[ "$success" != true ]]; then
    for part in "${parts[@]}"; do
      local previous="$REMOTE_DEST/$part.prev.$timestamp"
      if [[ -e "$previous" ]]; then
        rm -rf "$REMOTE_DEST/$part"
        mv "$previous" "$REMOTE_DEST/$part"
      fi
    done
  fi
  exit "$status"
}
trap rollback EXIT

for part in "${parts[@]}"; do
  if [[ -e "$REMOTE_DEST/$part" ]]; then
    mv "$REMOTE_DEST/$part" "$REMOTE_DEST/$part.prev.$timestamp"
  fi
done

tar -xzf "$REMOTE_DEST/deploy.tar.gz" -C "$REMOTE_DEST"
rm -f "$REMOTE_DEST/deploy.tar.gz"

test -d "$REMOTE_DEST/.next"
test -d "$REMOTE_DEST/.next/static"
test -d "$REMOTE_DEST/public"
test -f "$REMOTE_DEST/app.js" || test -f "$REMOTE_DEST/app.cjs"

current_manifest="$REMOTE_DEST/.next/.deploy-current-static-files"
(
  cd "$REMOTE_DEST/.next/static"
  find . -type f ! -name '.deploy-current-files' -print \
    | LC_ALL=C sort > "$current_manifest"
)

previous_static="$REMOTE_DEST/.next.prev.$timestamp/static"
if [[ -d "$previous_static" ]]; then
  previous_manifest="$previous_static/.deploy-current-files"
  if [[ -f "$previous_manifest" ]]; then
    while IFS= read -r relative_path; do
      if [[ "$relative_path" != ./* || "$relative_path" == *".."* ]]; then
        echo "Unsafe path in previous static manifest" >&2
        exit 1
      fi
      source_path="$previous_static/${relative_path#./}"
      target_path="$REMOTE_DEST/.next/static/${relative_path#./}"
      test -f "$source_path"
      mkdir -p "$(dirname "$target_path")"
      cp -p "$source_path" "$target_path"
    done < "$previous_manifest"
  else
    cp -R "$previous_static/." "$REMOTE_DEST/.next/static/"
    rm -f "$REMOTE_DEST/.next/static/.deploy-current-files"
  fi
fi
mv "$current_manifest" "$REMOTE_DEST/.next/static/.deploy-current-files"

success=true
trap - EXIT
for part in "${parts[@]}"; do
  rm -rf "$REMOTE_DEST/$part.prev.$timestamp"
done
