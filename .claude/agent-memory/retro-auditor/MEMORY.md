# Retro Auditor Memory

## Project: salonbw

### Key conventions

- Evidence Gate: Explicit -> add directly. Inferred -> require Evidence: quote. Otherwise -> Assumption (confidence: high/med/low) or omit.
- Validation: always run `bash .claude/skills/retro-memory-enterprise/scripts/validate_rules.sh` from repo root after edits.
- Co-author tag in commit template: `Claude Sonnet 4.6` (updated 2026-02-20; was 4.5).
- MD linting: always add blank line between heading and first list item (`## Heading` then blank then `- item`).

### Confirmed stable patterns (multi-session)

- Codex (gpt-5.3-codex, reasoning_effort=low) skips pre-commit lint — always audit before accepting.
- VersumShell must be persistent in `_app.tsx`, not per-page. Per-page mount causes white screen.
- Tab hrefs must point to final destination, not redirect intermediates.
- All hooks must be called before any early return (Rules of Hooks).
- `useLayoutEffect` preferred over `useEffect` for secondary nav push (prevents first-render flicker).
- Parallel file reads reduce round-trips for audits.
- Audit output format preferred by user: tabular `Problem | Naprawiony?`.
- pnpm monorepo: always update `pnpm.overrides` in root package.json when upgrading workspace deps.
- After pnpm.overrides change: `pnpm store prune && rm -rf node_modules && pnpm install` (never incremental).
- next.config.mjs rewrites() must return `{beforeFiles, afterFiles, fallback}` object, not flat array.
- macOS EPERM on node_modules/.modules.yaml: fix with `xattr -d com.apple.provenance node_modules/.modules.yaml`.
- CI shared trigger: pushing package.json/pnpm-lock.yaml builds both landing and panel; use workflow_dispatch target=dashboard for panel-only deploy when landing is broken.
- Landing CI status: verify from BOTH CI run results AND active-context.md landing line — git log alone is insufficient.
- Versum clone status: read git log + VersumSecondaryNav.tsx simultaneously — VersumSecondaryNav.tsx is canonical for which navs are wired.
- CommunicationNav: still uses inline static `communicationSections` in VersumSecondaryNav.tsx:126-127 (no dedicated component). Confirmed 2026-02-26.
- AGENT_STATUS.md "Current Release" table goes stale — always cross-verify against git log when updating docs.

### Rules file ownership

- active-context.md: updated every retro session with current focus, decisions, open questions
- anti-patterns.md: process + code + architectural DON'Ts
- working-agreement.md: general conventions + commit hygiene + Codex audit protocol
- definition-of-done.md: checklists per commit/deploy/domain
- style-and-tone.md: response format + audit table format
- templates.md: reusable templates including Codex audit table

### Open items as of 2026-02-26T22

- Landing CI: RESOLVED — `e74331ee` vendor @next/env updated to 15.5.10; run `22456729340` DEPLOYED
- /settings and /extension white screen fix: smoke PASS — RESOLVED
- ~36 pages with redundant `if (!role) return null` guards — deferred cleanup
- DashboardLayout dead code — safe to remove eventually
- Next module priority (dashboard vs employees vs visual polish) — user decision pending
- CommunicationNav: static sections only — no dedicated nav component; upgrade deferred
