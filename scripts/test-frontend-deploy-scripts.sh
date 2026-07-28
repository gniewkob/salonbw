#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

assert_output() {
  local file="$1"
  local expected="$2"
  if ! grep -Fxq "$expected" "$file"; then
    echo "Expected '$expected' in $file" >&2
    exit 1
  fi
}

test_multi_commit_change_detection() {
  local repo="$TMP_DIR/repo"
  local output="$TMP_DIR/github-output"
  mkdir -p "$repo"
  git -C "$repo" init -q
  git -C "$repo" config user.email "ci@example.invalid"
  git -C "$repo" config user.name "CI"

  mkdir -p "$repo/docs"
  printf 'base\n' > "$repo/docs/state.md"
  git -C "$repo" add docs/state.md
  git -C "$repo" commit -qm "base"
  local base
  base="$(git -C "$repo" rev-parse HEAD)"

  printf 'one\n' >> "$repo/docs/state.md"
  git -C "$repo" commit -qam "docs one"
  printf 'two\n' >> "$repo/docs/state.md"
  git -C "$repo" commit -qam "docs two"
  local head
  head="$(git -C "$repo" rev-parse HEAD)"

  (
    cd "$repo"
    GITHUB_OUTPUT="$output" "$ROOT_DIR/scripts/ci/detect-deploy-changes.sh" "$base" "$head"
  )

  assert_output "$output" "panel=false"
  assert_output "$output" "landing=false"
  assert_output "$output" "api=false"

  mkdir -p "$repo/scripts/mydevil"
  printf 'extractor\n' > "$repo/scripts/mydevil/extract-frontend-bundle.sh"
  git -C "$repo" add scripts/mydevil/extract-frontend-bundle.sh
  git -C "$repo" commit -qm "change frontend deploy helper"
  local deploy_head
  deploy_head="$(git -C "$repo" rev-parse HEAD)"
  : > "$output"

  (
    cd "$repo"
    GITHUB_OUTPUT="$output" \
      "$ROOT_DIR/scripts/ci/detect-deploy-changes.sh" "$head" "$deploy_head"
  )

  assert_output "$output" "panel=true"
  assert_output "$output" "landing=true"
  assert_output "$output" "api=false"
}

test_previous_static_assets_survive_extract() {
  local remote="$TMP_DIR/remote/app"
  local bundle="$TMP_DIR/bundle"
  mkdir -p "$remote/.next/static/css" "$remote/public" "$remote/node_modules"
  printf 'old-css\n' > "$remote/.next/static/css/old.css"
  printf 'ancient-css\n' > "$remote/.next/static/css/ancient.css"
  printf './css/old.css\n' > "$remote/.next/static/.deploy-current-files"
  printf 'old-app\n' > "$remote/app.cjs"

  mkdir -p "$bundle/.next/static/css" "$bundle/public"
  printf 'new-css\n' > "$bundle/.next/static/css/new.css"
  printf 'new-app\n' > "$bundle/app.cjs"
  tar -czf "$remote/deploy.tar.gz" -C "$bundle" .

  DEPLOY_ALLOWED_ROOT="$TMP_DIR/remote" \
    "$ROOT_DIR/scripts/mydevil/extract-frontend-bundle.sh" "$remote"

  test -f "$remote/.next/static/css/new.css"
  test -f "$remote/.next/static/css/old.css"
  test ! -e "$remote/.next/static/css/ancient.css"
  grep -Fxq './css/new.css' "$remote/.next/static/.deploy-current-files"
  test -f "$remote/app.cjs"
  test ! -e "$remote/deploy.tar.gz"
  if find "$remote" -maxdepth 1 -name '*.prev.*' -print -quit | grep -q .; then
    echo "Previous release directories were not cleaned" >&2
    exit 1
  fi

  if DEPLOY_ALLOWED_ROOT="$TMP_DIR/remote" \
    "$ROOT_DIR/scripts/mydevil/extract-frontend-bundle.sh" "$TMP_DIR/remote"; then
    echo "Extractor accepted the allowed root itself" >&2
    exit 1
  fi
}

test_multi_commit_change_detection
test_previous_static_assets_survive_extract
echo "frontend deploy script tests: OK"
