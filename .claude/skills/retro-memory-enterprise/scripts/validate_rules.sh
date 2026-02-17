#!/usr/bin/env bash
set -euo pipefail

RULES_DIR="./.claude/rules"
RETRO_DIR="./.claude/retro"
SKILL_DIR="./.claude/skills/retro-memory-enterprise"

REQ_RULES=(
  "working-agreement.md"
  "style-and-tone.md"
  "definition-of-done.md"
  "anti-patterns.md"
  "templates.md"
  "active-context.md"
)

echo "[retro-enterprise] Validate directories..."
test -d "$RULES_DIR" || { echo "ERROR: missing $RULES_DIR"; exit 1; }
test -d "$RETRO_DIR" || { echo "ERROR: missing $RETRO_DIR"; exit 1; }
test -d "$SKILL_DIR" || { echo "ERROR: missing $SKILL_DIR"; exit 1; }

echo "[retro-enterprise] Validate required rules..."
for f in "${REQ_RULES[@]}"; do
  path="${RULES_DIR}/${f}"
  test -f "$path" || { echo "ERROR: missing $path"; exit 1; }
  test -s "$path" || { echo "ERROR: empty $path"; exit 1; }
done

echo "[retro-enterprise] Size guardrails (keep rules lean)..."
for f in "${REQ_RULES[@]}"; do
  path="${RULES_DIR}/${f}"
  lines=$(wc -l < "$path" | tr -d ' ')
  if [[ "$lines" -gt 500 ]]; then
    echo "WARN: $path is large ($lines lines). Consider compressing."
  fi
done

echo "[retro-enterprise] Secrets scan (best-effort)..."
PATTERNS=(
  "AKIA[0-9A-Z]{16}"
  "-----BEGIN[[:space:]]+.*PRIVATE KEY-----"
  "Bearer[[:space:]]+[A-Za-z0-9._-]+"
  "token[[:space:]]*[:=][[:space:]]*[A-Za-z0-9._-]{10,}"
  "api[_-]?key[[:space:]]*[:=]"
  "password[[:space:]]*[:=][[:space:]]*[^$\[{]"
)
for p in "${PATTERNS[@]}"; do
  if grep -RInE "$p" "$RULES_DIR" "$RETRO_DIR" >/dev/null 2>&1; then
    echo "ERROR: Possible secret detected by pattern: $p"
    echo "Action: redact and re-run."
    exit 1
  fi
done

echo "[retro-enterprise] Evidence Gate hint (soft check)..."
if grep -RIn "Inferred" "${RULES_DIR}/working-agreement.md" 2>/dev/null | grep -v "Evidence:" >/dev/null 2>&1; then
  echo "WARN: Found 'Inferred' without 'Evidence:' in working-agreement.md (manual review)."
fi

echo "[retro-enterprise] OK."
