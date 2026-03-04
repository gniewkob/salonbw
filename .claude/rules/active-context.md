# Active Context

## Current focus

- Versum clone: strict visual parity open na klienci/statystyki/magazyn/usługi — deferred do decyzji kolejności
- Next module priorytet: Dodatki (50%) lub strict visual polish na istniejących
- Session 2026-03-04: security audit — 29 of 35 vulnerabilities resolved via pnpm.overrides/upgrades/plugin removal; 6 remaining (2 high xlsx devDeps, 3 moderate dev tools, 1 low jimp chain)

## In-progress work

- Branch: master (commits `cacd861e`, `944d8d72` — security dep upgrades 2026-03-04)
- Panel production: `bdd3bbaf` | Next.js 15.5.10 | run `22584915038` | 2026-03-02 — DEPLOYED
  Settings secondaryNav+tile CSS + breadcrumb w 14 pages + versum-link/widget/extension CSS — DEPLOYED.
- Landing production: `e74331ee` | Next.js 15.5.10 | run `22456729340` | 2026-02-26 — DEPLOYED (vendor @next/env fix)
- API production: `9ec696ac` | 2026-02-24 19:28 — bez zmian od statistics normalization deploy.
- Push-triggered CI runs failing (22595771187, 22595035009, 22594629944) — cause not yet investigated; workflow_dispatch runs succeed.

## Recent decisions

- Security audit 2026-03-04: 29/35 vulnerabilities resolved — `@sentry/node` + `profiling-node` upgraded ^8→^10 (commit `cacd861e`), `@types/node` upgraded ^24→^25 (commit `944d8d72`), `@suchipi/cypress-plugin-snapshots` removed from landing + panel (zero usage), `xlsx` moved to devDeps (patched: <0.0.0). CI audit disabled in ci.yml — remaining 6 vulns do not block CI.
  Evidence: "single pnpm install fixed 29 vulns after grouping; grep found no cy.snapshot() calls; patched: <0.0.0 for xlsx"
- pnpm install strategy refined: `pnpm store prune` is too aggressive for lockfile-only changes; use `pnpm install --frozen-lockfile=false` instead (49s vs 15min)
  Evidence: "za dlugo to trwa, czy instalacja sie nie zawiesza?" — user interrupted after ~15min; 49s on second run without store prune
- Landing CI fixed: `ensure-local-deps.js` vendor `@next/env` was `14.2.32` (no dist/); version mismatch caused it to delete+replace pnpm store entry → dist/index.js gone. Fix: update vendor to `15.5.10` with proper dist/ (commit `e74331ee`)
  Evidence: `tryPackage` error with `path: package.json, requestPath: @next/env` proved package.json found but dist/index.js missing; vendor package.json confirmed `14.2.32` without dist/
- Landing CI status must be verified from BOTH CI run results AND active-context.md landing line — not just git log
  Evidence: "Initial doc update incorrectly stated 'landing CI broken' — active-context.md was corrected by retro-auditor to reflect actual state (landing DEPLOYED at e74331ee)"
- AGENT_STATUS.md "Current Release" table requires cross-verification against git log on every documentation pass — stale entries (2+ days) have been observed
  Evidence: "AGENT_STATUS.md showed `9ec696ac` from 2026-02-24 while actual panel production was `0a1fde5f` from 2026-02-26"
- Adopted enterprise retro-memory-enterprise skill with Evidence Gate
- Subagent isolation via .claude/agents/retro-auditor.md
- Rules stored in .claude/rules/*.md (versioned, team-shared)
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern (fix white screen on navigation)
  Evidence: "Trwałe rozwiązanie: przenieść VersumShell do _app.tsx jako persistent layout. [...] tak"
- WarehouseLayout tab hrefs changed to point directly to `/*/history` (fix double-navigation white screen)
  Evidence: "Fix: zmienić hrefs bezpośrednio na /sales/history etc." — user approved implicitly
- Codex audit fix (`fix(panel): address services comments/commissions audit issues`) reviewed and approved
  Evidence: "Fix commit poprawny" confirmed after audit
- Next.js upgraded to 15.5.10 on panel/landing + root pnpm.overrides updated (commit `d56d2c26` + fix `0a1fde5f`)
  Evidence: "Root override `\"next\": \"14.2.32\"` blocked panel/landing upgrade to 15.5.10 despite workspace package.json declaring 15.5.10"
- next.config.mjs rewrites() changed from flat array to `{beforeFiles, afterFiles, fallback}` object (commit `0a1fde5f`)
  Evidence: "Crash `routesManifest.rewrites.beforeFiles.filter(...)` — beforeFiles undefined when `return rules` (array) used"
- Panel deployed via `gh workflow run ... -F target=dashboard` (bypassed broken landing CI)
  Evidence: "Landing build failed CI run 22436249501; panel never deployed; fix was manual `gh workflow run ... -F target=dashboard`"
- WarehouseNav: pełny secondary nav dla wszystkich submodułów produkty/sprzedaż/zużycie/dostawy/zamówienia/inwentaryzacja (commits `28b0d53a`, `fe72d2d2`)
  Evidence: "Steps 2 & 3 warehouse navigation integration — merged to master"
- Versum clone postęp: ~60% — wszystkie moduły mają secondary nav; smoki PASS na settings/communication/services/extension/warehouse
  Evidence: VERSUM_CLONE_PROGRESS.md 2026-02-26

## Blockers / watch items

- Push-triggered CI deploy runs failing (22595771187, 22595035009, 22594629944) — cause not investigated; workflow_dispatch works fine
  Assumption (confidence: high). Verify: check CI logs for these runs; compare trigger conditions vs workflow_dispatch.
- Dependabot: 37 vulnerabilities shown — expected to decrease after re-scan of new lockfile
  Assumption (confidence: high). Verify: check GitHub security tab in 24h after last push.
- `/settings` i `/extension` white screen fix: smoke PASS (`a2fba7dd`, `049ba6fa`) — RESOLVED
- `if (!role) return null` guards in ~36 pages: now redundant (persistent shell handles auth) — cleanup deferred
- DashboardLayout exists but is used by no page — dead code; safe to remove eventually
- Strict visual parity open: klienci (~7%), statystyki (~11%), magazyn (~9%), usługi (niezmierzone) — deferred

## Stack reminders
- Panel: Next.js 15.5.10, pnpm, TypeScript
- Backend: Node.js, pnpm
- Host: MyDevil (FreeBSD, Passenger)
- CI: GitHub Actions (.github/workflows/deploy.yml)

## Panel layout architecture (VersumShell)

### Persistent shell pattern
`_app.tsx` → `PersistentShellWrapper` → `VersumShell` (mounted once, never unmounts for authenticated users).
- Topbar, main nav, secondary nav are persistent — only content and active elements change.
- Individual pages still call `<VersumShell>` internally — the nesting guard in VersumShell makes them transparent pass-throughs.
- `/calendar` is excluded from persistent shell (replaces entire document via `document.write()`).
  Evidence: CalendarPage code uses `document.open(); document.write(html); document.close();`

### Secondary nav
- **Auto-resolved** (default): `VersumSecondaryNav` reads `router.pathname` and renders the correct nav per module. No action needed in pages.
- **Custom nav** (3 customer pages only): call `useSetSecondaryNav(jsx)` hook **before any early return** in the page component. Do NOT pass `secondaryNav` prop to `<VersumShell>` — the persistent outer shell won't see it.
- Use `useLayoutEffect` (not `useEffect`) for secondary nav push to prevent first-render flicker.
  Evidence: "useLayoutEffect (not useEffect) for secondary nav push to prevent first-render flicker" — effective pattern confirmed

### Rules
- DO call `useSetSecondaryNav` before `if (!role) return null` (Rules of Hooks).
  Evidence: Rules of Hooks violations caught by lint; fix applied before commit
- DON'T pass `secondaryNav` prop to per-page `<VersumShell>` — use the context hook instead.
- DON'T add `/calendar` to persistent shell (document.write incompatibility).
- `if (!role) return null` guards in pages are harmless (persistent shell already handles this) but redundant — remove when refactoring.

### Key files
- Persistent shell + PersistentShellWrapper: `apps/panel/src/pages/_app.tsx`
- Nesting detection: `apps/panel/src/components/versum/VersumShell.tsx`
- Secondary nav context: `apps/panel/src/contexts/SecondaryNavContext.tsx`
- Secondary nav auto-resolution: `apps/panel/src/components/versum/VersumSecondaryNav.tsx`
- Module routing map: `apps/panel/src/components/versum/navigation.ts`

## Codex monitoring
- Codex (`gpt-5.3-codex`, `reasoning_effort=low`) known to skip pre-commit lint checks.
  Evidence: commit `0e93a771` had lint errors (no-misused-promises, prettier) — Codex skipped checks
- Always audit Codex commits with tabular format: Problem | Naprawiony? before accepting.
  Evidence: "monitoruj jego zmiany i dawaj krytyczne uwagi" — user session preference
