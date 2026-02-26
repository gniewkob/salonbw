# Active Context

## Current focus

- Landing CI broken: `@next/env/dist/index.js` missing in pnpm virtual store — not yet resolved
  Assumption (confidence: med): caused by incremental lockfile commit before clean install. Verify: re-run push-triggered CI after verifying clean lockfile produces landing build success.
- Post-deploy verification: persistent VersumShell white-screen fix for `/settings` and `/extension` — still pending full smoke test

## In-progress work

- Branch: master (commit `0a1fde5f` — panel deploy succeeded, CI run 22436718672, 2m51s)
- Panel production: Next.js 15.5.10 (panel.salon-bw.pl returns 307)
  Assumption (confidence: high). Verify: check `startup_probe.txt` or panel diagnostic endpoint.
- Landing production: still running prior build (Next 14 or earlier Next 15 attempt)
  Assumption (confidence: high). Verify: check `dev.salon-bw.pl` or landing Passenger logs.

## Recent decisions
- Adopted enterprise retro-memory-enterprise skill with Evidence Gate
- Subagent isolation via .claude/agents/retro-auditor.md
- Rules stored in .claude/rules/*.md (versioned, team-shared)
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern (fix white screen on navigation)
  Evidence: "Trwałe rozwiązanie: przenieść VersumShell do _app.tsx jako persistent layout. [...] tak"
- WarehouseLayout tab hrefs changed to point directly to `/*/history` (fix double-navigation white screen)
  Evidence: "Fix: zmienić hrefs bezpośrednio na /sales/history etc." — user approved implicitly
- Codex audit fix (`fix(panel): address services comments/commissions audit issues`) reviewed and approved
  Evidence: "Fix commit poprawny" confirmed after audit
- Next.js upgraded to 15.5.10 on panel/landing + root pnpm.overrides updated (commit `d56d2c26` + fix `dc89aae8`)
  Evidence: "Root override `\"next\": \"14.2.32\"` blocked panel/landing upgrade to 15.5.10 despite workspace package.json declaring 15.5.10"
- next.config.mjs rewrites() changed from flat array to `{beforeFiles, afterFiles, fallback}` object (commit `dc89aae8`)
  Evidence: "Crash `routesManifest.rewrites.beforeFiles.filter(...)` — beforeFiles undefined when `return rules` (array) used"
- Panel deployed via `gh workflow run ... -F target=dashboard` (bypassed broken landing CI)
  Evidence: "Landing build failed CI run 22436249501; panel never deployed; fix was manual `gh workflow run ... -F target=dashboard`"

## Blockers / watch items

- Landing CI failure (`@next/env/dist/index.js` missing in next virtual store) — root cause unconfirmed
  Assumption (confidence: med). Verify: trigger `target=public` deploy and observe landing build in CI after clean lockfile.
- Verify `/settings` and `/extension` white screen fix in production after deploy
  Assumption (confidence: high). Verify: smoke test after deploy.
- `if (!role) return null` guards in ~36 pages: now redundant (persistent shell handles auth) — cleanup deferred
- DashboardLayout exists but is used by no page — dead code; safe to remove eventually

## Stack reminders
- Panel: Next.js 15, pnpm, TypeScript
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
