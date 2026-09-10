#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

SHA="0123456789abcdef0123456789abcdef01234567"
cat >"$TMP_DIR/gh" <<'EOF'
#!/usr/bin/env bash
cat "$GH_MOCK_RESPONSE"
EOF
chmod +x "$TMP_DIR/gh"

cat >"$TMP_DIR/success.json" <<EOF
[{"databaseId":101,"headSha":"$SHA","status":"completed","conclusion":"success","url":"https://example.invalid/success"}]
EOF
GH_MOCK_RESPONSE="$TMP_DIR/success.json" \
PATH="$TMP_DIR:$PATH" \
GITHUB_REPOSITORY="example/salonbw" \
"$ROOT_DIR/scripts/ci/wait-for-ci-success.sh" "$SHA" >/dev/null

cat >"$TMP_DIR/failure.json" <<EOF
[{"databaseId":102,"headSha":"$SHA","status":"completed","conclusion":"failure","url":"https://example.invalid/failure"}]
EOF
if GH_MOCK_RESPONSE="$TMP_DIR/failure.json" \
    PATH="$TMP_DIR:$PATH" \
    GITHUB_REPOSITORY="example/salonbw" \
    "$ROOT_DIR/scripts/ci/wait-for-ci-success.sh" "$SHA" >/dev/null 2>&1; then
  echo "ERROR: failed CI was accepted" >&2
  exit 1
fi

if GH_MOCK_RESPONSE="$TMP_DIR/success.json" \
    PATH="$TMP_DIR:$PATH" \
    GITHUB_REPOSITORY="example/salonbw" \
    "$ROOT_DIR/scripts/ci/wait-for-ci-success.sh" deadbeef >/dev/null 2>&1; then
  echo "ERROR: abbreviated SHA was accepted" >&2
  exit 1
fi

echo "OK: deploy CI gate accepts success and rejects failure or ambiguous SHA"
