#!/usr/bin/env bash
# Handoff protocol guard — docs/HANDOFF_PROTOCOL.md
#
# Verifies that work being pushed leaves the project resumable by ANY agent:
#   1. a new journal entry exists for this change set
#   2. docs/PROJECT_STATE.md was refreshed
#   3. nobody appended to the archived logs (they cause merge conflicts)
#
# Usage:  scripts/handoff-check.sh [base-ref]     (default: origin/master)
set -uo pipefail

BASE="${1:-origin/master}"
git rev-parse --verify --quiet "$BASE" >/dev/null || { echo "handoff-check: brak ref '$BASE' — pomijam."; exit 0; }

CHANGED="$(git diff --name-only "$BASE"...HEAD)"
[ -z "$CHANGED" ] && { echo "handoff-check: brak zmian wobec $BASE."; exit 0; }

fail=0
note() { printf '  %s\n' "$1"; }

# 1. Journal entry (one file per task -> never conflicts)
if ! grep -qE '^docs/journal/[0-9]{4}-[0-9]{2}-[0-9]{2}-.+\.md$' <<<"$CHANGED"; then
    echo "BRAK: wpis w docs/journal/"
    note "Utwórz docs/journal/\$(date +%F)-<slug>.md wg szablonu HANDOFF_PROTOCOL.md §5."
    fail=1
fi

# 2. Current-state file refreshed
if ! grep -qx 'docs/PROJECT_STATE.md' <<<"$CHANGED"; then
    echo "BRAK: aktualizacja docs/PROJECT_STATE.md"
    note "Odśwież: Ostatnio zrobione / Następny krok / Zablokowane na ownerze / Fakty."
    fail=1
fi

# 3. Archived logs must not grow (append-at-top = merge conflicts)
for archived in docs/AGENT_STATUS.md .claude/rules/active-context.md; do
    if grep -qx "$archived" <<<"$CHANGED"; then
        if [ "${HANDOFF_ALLOW_ARCHIVED:-0}" = "1" ]; then
            note "OK (HANDOFF_ALLOW_ARCHIVED=1): świadoma zmiana w $archived"
        else
            echo "UWAGA: modyfikujesz archiwalny log $archived"
            note "Nowe wpisy idą do docs/journal/. Archiwum jest tylko do czytania."
            note "Jeśli zmiana jest uzasadniona (np. baner): HANDOFF_ALLOW_ARCHIVED=1 $0"
            fail=1
        fi
    fi
done

if [ "$fail" -eq 0 ]; then
    echo "handoff-check: OK — praca jest przekazywalna."
else
    echo ""
    echo "Zadanie NIE jest ukończone wg docs/HANDOFF_PROTOCOL.md §3."
fi
exit "$fail"
