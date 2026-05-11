#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

OPS_DIR=".github/workflows"
OPS_PATTERN='ops_[a-z0-9_]+\.yml'
OPS_DOC="docs/AGENT_OPERATIONS.md"
STATUS_DOC="docs/AGENT_STATUS.md"

require_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    echo "ERROR: missing file: $file" >&2
    exit 1
  fi
}

require_file "$OPS_DOC"
require_file "$STATUS_DOC"

mapfile -t WORKFLOW_FILES < <(find "$OPS_DIR" -maxdepth 1 -type f -name 'ops_*.yml' -print | sed 's#^./##' | sort)
if [[ ${#WORKFLOW_FILES[@]} -eq 0 ]]; then
  echo "ERROR: no ops workflows found under $OPS_DIR" >&2
  exit 1
fi

extract_doc_workflows() {
  local doc="$1"
  grep -Eo "$OPS_PATTERN" "$doc" | sort -u || true
}

mapfile -t DOC_OPS < <(extract_doc_workflows "$OPS_DOC")
mapfile -t DOC_STATUS < <(extract_doc_workflows "$STATUS_DOC")

normalize_basename() {
  sed 's#^.*/##'
}

mapfile -t FILE_BASENAMES < <(printf '%s\n' "${WORKFLOW_FILES[@]}" | normalize_basename | sort -u)

compare_sets() {
  local label="$1"
  local -n from_files_ref=$2
  local -n from_docs_ref=$3

  local tmp_files tmp_docs
  tmp_files="$(mktemp)"
  tmp_docs="$(mktemp)"

  printf '%s\n' "${from_files_ref[@]}" | sed '/^$/d' | sort -u > "$tmp_files"
  printf '%s\n' "${from_docs_ref[@]}" | sed '/^$/d' | sort -u > "$tmp_docs"

  local missing_in_docs extra_in_docs
  missing_in_docs="$(comm -23 "$tmp_files" "$tmp_docs" || true)"
  extra_in_docs="$(comm -13 "$tmp_files" "$tmp_docs" || true)"

  if [[ -n "$missing_in_docs" ]]; then
    echo "ERROR: $label missing workflow references:" >&2
    echo "$missing_in_docs" | sed 's/^/  - /' >&2
    rm -f "$tmp_files" "$tmp_docs"
    return 1
  fi

  if [[ -n "$extra_in_docs" ]]; then
    echo "ERROR: $label contains stale workflow references:" >&2
    echo "$extra_in_docs" | sed 's/^/  - /' >&2
    rm -f "$tmp_files" "$tmp_docs"
    return 1
  fi

  rm -f "$tmp_files" "$tmp_docs"
  return 0
}

compare_sets "docs/AGENT_OPERATIONS.md" FILE_BASENAMES DOC_OPS
compare_sets "docs/AGENT_STATUS.md" FILE_BASENAMES DOC_STATUS

echo "OK: ops workflow docs consistency checks passed"
