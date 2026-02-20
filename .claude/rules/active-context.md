# Active Context

## Current focus
- (updated by retro-auditor after each session)

## In-progress work
- Branch: claude/infallible-brown
- Last known state: initial setup of enterprise retro-memory system

## Recent decisions
- Adopted enterprise retro-memory-enterprise skill with Evidence Gate
- Subagent isolation via .claude/agents/retro-auditor.md
- Rules stored in .claude/rules/*.md (versioned, team-shared)
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern (fix white screen on navigation)
- WarehouseLayout tab hrefs changed to point directly to `/*/history` (fix double-navigation white screen)

## Blockers / watch items
- (none)

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

### Secondary nav
- **Auto-resolved** (default): `VersumSecondaryNav` reads `router.pathname` and renders the correct nav per module. No action needed in pages.
- **Custom nav** (3 customer pages only): call `useSetSecondaryNav(jsx)` hook **before any early return** in the page component. Do NOT pass `secondaryNav` prop to `<VersumShell>` — the persistent outer shell won't see it.

### Rules
- DO call `useSetSecondaryNav` before `if (!role) return null` (Rules of Hooks).
- DON'T pass `secondaryNav` prop to per-page `<VersumShell>` — use the context hook instead.
- DON'T add `/calendar` to persistent shell (document.write incompatibility).
- `if (!role) return null` guards in pages are harmless (persistent shell already handles this) but redundant — remove when refactoring.

### Key files
- Persistent shell + PersistentShellWrapper: `apps/panel/src/pages/_app.tsx`
- Nesting detection: `apps/panel/src/components/versum/VersumShell.tsx`
- Secondary nav context: `apps/panel/src/contexts/SecondaryNavContext.tsx`
- Secondary nav auto-resolution: `apps/panel/src/components/versum/VersumSecondaryNav.tsx`
- Module routing map: `apps/panel/src/components/versum/navigation.ts`
