# Active Context

## Current focus

- **Bootstrap 5 migration COMPLETE (2026-03-27)**
  - Tailwind CSS fully removed; Bootstrap 5.3 global via `_app.tsx`
  - `salon-theme.css` + `salon-shell.css` provide all custom styles
  - CSS variables: `--salonbw-*` → `--salon-*`; components/salonbw/ → components/salon/
- **Faza E — Versum visual parity sprint** (started 2026-03-28)
  - Services module: sidenav icons, table class fixes, URL-based tabs, ServiceDetailNav — DONE (`d9e72660`)
  - Statistics dashboard: Versum-native class names (`.description`, `.price_summary`, `.data_table.compact_cells`, `.row`/`.col-lg-5/7`, `.info_tip`, `br.c`) — DONE (`1b47831c`)
  - Remaining open: Magazyn (11.3%), Klienci (7.4%), Łączność (80% structural)
- **Faza D — Panel UI Kit Sprint 1 — COMPLETE** (2026-03-18)
  - PanelTable + PanelSection built; all `/settings/*` pages migrated
  - `data_protection.tsx` deliberately skipped (form element, not div)
- P1/P2 backlog: CLOSED as of 2026-03-18

## In-progress work

- Branch: master (latest commit `1b47831c`)
- Panel production: `d9e72660` | Next.js 15.5.10 — DEPLOYED (2026-03-28, 16 commits pushed)
- API production: `e56e39ff` | 2026-03-24 — unchanged
- Landing production: `e74331ee` | Next.js 15.5.10 | 2026-02-26 — unchanged
- Versum parity sprint: in progress (Services + Statistics done; Magazyn/Klienci/Łączność next)

## Recent decisions

- Versum parity: using Versum dump HTML + CSS as single source of truth for class names. Custom `statistics-*` aliases eliminated in favour of native `.description`, `.price_summary`, `.data_table.compact_cells`, `.info_tip`, etc.
  Evidence: "kontynuujemy plan" after deploy — user confirmed parity sprint approach
- Sprint 1 migration 2026-03-18: 15 `/settings/*` pages + 2 components migrated to `PanelTable`/`PanelSection`.
- `PanelTable` API: `columns[]` (label?, ariaLabel?, className?), `isEmpty?`, `emptyMessage?`, `children` (tbody rows).
- `PanelSection` API: `title?` (renders h2), `action?` (renders actions div), `children`, `className?`.
  - Use `title` prop only when h2 is at direct top level of section (not inside loading conditional or form).
  - Use `action` prop only when actions div is at direct top level (not inside a conditional render).
  - For form-wrapping pages: replace outer div with PanelSection, leave h2 inside form children — do NOT use `title` prop.
    Evidence: "employees/new.tsx, categories/new.tsx, [id]/edit.tsx all use this pattern"
- Repo cleanup 2026-03-17: deleted 50+ files (12 outdated docs, 16 tracked root PNGs, ~23 untracked root PNGs, 3 root stale plans, monitor_deployment.sh, 7 scripts/, panel-verification/). Commit `60b0966e`.
  Evidence: "sprawdz jeszcze czy mozemy wyczyscic katalog repo z nieuzywanych starych plikow" — user confirmed scope
- VERSUM_CLONE_COMPLETE_GUIDE.md deleted — obsolete Sprint 1 doc; superseded by CLONING_STANDARD + HANDOFF + DUMP_ALIGNMENT.
  Evidence: "Guide described per-page VersumShell (anti-pattern), sprint 1 scope, zero mention of offline dump"
- Offline dump is canonical Versum source. New docs hierarchy: HANDOFF → DUMP_ALIGNMENT → IMPLEMENTATION_MATRIX → INVENTED_BEHAVIOR → CLONING_STANDARD → AGENT_EXECUTION_PLAYBOOK → ROUTE_INDEX.json → UI_PATTERN_CATALOG → DOMAIN_SCHEMA_INVENTORY.
  Evidence: "User added 9-step required reading order in HANDOFF_PANEL_AGENT.md all pointing at dump bundle artifacts"
- New user-created docs committed: AGENT_EXECUTION_PLAYBOOK.md, ROUTE_INDEX.json, UI_PATTERN_CATALOG.md, DOMAIN_SCHEMA_INVENTORY.md.
  Evidence: "zaakceptuj wszystko i zrob commit" — user explicitly requested all staged
- Security audit 2026-03-04: 29/35 vulnerabilities resolved — `@sentry/node` + `profiling-node` upgraded ^8→^10 (commit `cacd861e`), `@types/node` upgraded ^24→^25 (commit `944d8d72`), `@suchipi/cypress-plugin-snapshots` removed from landing + panel, `xlsx` moved to devDeps. CI audit disabled in ci.yml.
  Evidence: "single pnpm install fixed 29 vulns after grouping; grep found no cy.snapshot() calls; patched: <0.0.0 for xlsx"
- pnpm install strategy: use `pnpm install --frozen-lockfile=false` for lockfile-only changes (49s); `rm -rf node_modules && pnpm install` for version pin changes.
  Evidence: "za dlugo to trwa, czy instalacja sie nie zawiesza?" — user interrupted after ~15min; 49s on second run
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern.
  Evidence: "Trwałe rozwiązanie: przenieść VersumShell do _app.tsx jako persistent layout. [...] tak"
- WarehouseLayout tab hrefs changed to point directly to final destinations.
  Evidence: "Fix: zmienić hrefs bezpośrednio na /sales/history etc." — user approved
- Next.js upgraded to 15.5.10 on panel/landing + root pnpm.overrides updated (commits `d56d2c26`, `0a1fde5f`).
  Evidence: "Root override `\"next\": \"14.2.32\"` blocked panel/landing upgrade to 15.5.10"

## Blockers / watch items

- Dead CSS audit (Sprint 1 step 4): `default.css` / `new-ui.css` chunks to remove post-migration — not yet started
- `data_protection.tsx`: `inner edit_branch_form` on a `<form>` — refactor deferred; revisit if `as` prop added to PanelSection
- `docs/VERSUM_CLONE_PROGRESS.md` REFERENCJE section references deleted files — cleanup deferred
  Evidence: "File cleaned of date header but REFERENCJE section left untouched per minimal-change principle"
- ROUTE_INDEX.json, AGENT_EXECUTION_PLAYBOOK.md, UI_PATTERN_CATALOG.md, DOMAIN_SCHEMA_INVENTORY.md — user-created; content not yet reviewed by agent
  Assumption (confidence: high). Verify: read each file to confirm they exist and contain actionable content consistent with HANDOFF reading order.
- Push-triggered CI deploy runs failing (22595771187, 22595035009, 22594629944) — workflow_dispatch works; root cause not investigated
  Assumption (confidence: high). Verify: check CI logs; compare trigger conditions vs workflow_dispatch.
- Dependabot: security tab expected to decrease after re-scan of new lockfile
  Assumption (confidence: high). Verify: GitHub security tab 24h after last push.
- `if (!role) return null` guards in ~36 pages: redundant (persistent shell handles auth) — cleanup deferred
- DashboardLayout exists but used by no page — dead code; safe to remove eventually
- Strict visual parity open: klienci (~7%), statystyki (~11%), magazyn (~9%) — deferred
- `SettingsDetailLayout` usage count: assumed only `branch.tsx` (no double-nesting of PanelSection)
  Assumption (confidence: high). Verify: `grep -r "SettingsDetailLayout" apps/panel/src/pages/`

## Stack reminders

- Panel: Next.js 15.5.10, pnpm, TypeScript, Bootstrap 5.3 (no Tailwind)
- Backend: Node.js, pnpm
- Host: MyDevil (FreeBSD, Passenger)
- CI: GitHub Actions (.github/workflows/deploy.yml)

## Versum source of truth

- Offline dump: `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`
- Required reading order (HANDOFF_PANEL_AGENT.md steps 1-9):
  1. HANDOFF_PANEL_AGENT.md
  2. VERSUM_DUMP_ALIGNMENT_2026-03-17.md
  3. IMPLEMENTATION_MATRIX.md
  4. INVENTED_BEHAVIOR.md
  5. VERSUM_CLONING_STANDARD.md
  6. AGENT_EXECUTION_PLAYBOOK.md
  7. ROUTE_INDEX.json
  8. UI_PATTERN_CATALOG.md
  9. DOMAIN_SCHEMA_INVENTORY.md
- DON'T use VERSUM_CLONE_COMPLETE_GUIDE.md — deleted (obsolete Sprint 1 doc)

## Panel layout architecture (VersumShell)

### Persistent shell pattern

`_app.tsx` → `PersistentShellWrapper` → `VersumShell` (mounted once, never unmounts for authenticated users).

- Topbar, main nav, secondary nav are persistent — only content and active elements change.
- Individual pages still call `<VersumShell>` internally — the nesting guard makes them transparent pass-throughs.
- `/calendar` is excluded from persistent shell (uses full document replacement via Calendar embed).

### Secondary nav

- **Auto-resolved** (default): `VersumSecondaryNav` reads `router.pathname` and renders the correct nav per module. No action needed in pages.
- **Custom nav** (3 customer pages only): call `useSetSecondaryNav(jsx)` hook **before any early return** in the page component. Do NOT pass `secondaryNav` prop to `<VersumShell>` — the persistent outer shell won't see it.
- Use `useLayoutEffect` (not `useEffect`) for secondary nav push to prevent first-render flicker.
  Evidence: "useLayoutEffect (not useEffect) for secondary nav push to prevent first-render flicker" — effective pattern confirmed

### Rules

- DO call `useSetSecondaryNav` before `if (!role) return null` (Rules of Hooks).
  Evidence: Rules of Hooks violations caught by lint; fix applied before commit
- DON'T pass `secondaryNav` prop to per-page `<VersumShell>` — use the context hook instead.
- DON'T add `/calendar` to persistent shell (document replacement incompatibility).
- `if (!role) return null` guards in pages are harmless but redundant — remove when refactoring.

### Key files

- Persistent shell + PersistentShellWrapper: `apps/panel/src/pages/_app.tsx`
- Shell component: `apps/panel/src/components/salon/SalonShell.tsx`
- Secondary nav context: `apps/panel/src/contexts/SecondaryNavContext.tsx`
- Secondary nav auto-resolution: `apps/panel/src/components/salon/SalonSecondaryNav.tsx`
- Module routing map: `apps/panel/src/components/salon/navigation.ts`

## Codex monitoring

- Codex (`gpt-5.3-codex`, `reasoning_effort=low`) known to skip pre-commit lint checks.
  Evidence: commit `0e93a771` had lint errors (no-misused-promises, prettier) — Codex skipped checks
- Always audit Codex commits with tabular format: Problem | Naprawiony? before accepting.
  Evidence: "monitoruj jego zmiany i dawaj krytyczne uwagi" — user session preference
