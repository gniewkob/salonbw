# Retro Auditor Memory

## Project: salonbw

### Key conventions
- Evidence Gate: Explicit -> add directly. Inferred -> require Evidence: quote. Otherwise -> Assumption (confidence: high/med/low) or omit.
- Validation: always run `bash .claude/skills/retro-memory-enterprise/scripts/validate_rules.sh` from repo root after edits.
- Co-author tag in commit template: `Claude Sonnet 4.6` (updated 2026-02-20; was 4.5).

### Confirmed stable patterns (multi-session)
- Codex (gpt-5.3-codex, reasoning_effort=low) skips pre-commit lint — always audit before accepting.
- VersumShell must be persistent in `_app.tsx`, not per-page. Per-page mount causes white screen.
- Tab hrefs must point to final destination, not redirect intermediates.
- All hooks must be called before any early return (Rules of Hooks).
- `useLayoutEffect` preferred over `useEffect` for secondary nav push (prevents first-render flicker).
- Parallel file reads reduce round-trips for audits.
- Audit output format preferred by user: tabular `Problem | Naprawiony?`.

### Rules file ownership
- active-context.md: updated every retro session with current focus, decisions, open questions
- anti-patterns.md: process + code + architectural DON'Ts
- working-agreement.md: general conventions + commit hygiene + Codex audit protocol
- definition-of-done.md: checklists per commit/deploy/domain
- style-and-tone.md: response format + audit table format
- templates.md: reusable templates including Codex audit table

### Open items as of 2026-02-20
- Verify /settings and /extension white screen fix in production (Assumption confidence: high)
- WarehouseLayout sub-tab navigation regression check post-deploy (Assumption confidence: high)
- ~36 pages with redundant `if (!role) return null` guards — deferred cleanup
- DashboardLayout dead code — safe to remove eventually
