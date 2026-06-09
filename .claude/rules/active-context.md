# Active Context

## Agent workflow rules

- **MANDATORY:** After every significant change, immediately update this file with: what was done, what was found, what is next.
- **MANDATORY:** Add findings/blockers to the Backlog section below as soon as they are discovered.
- **MANDATORY:** Do NOT defer documentation to end-of-session — update incrementally after each commit.
- Every session should leave this file more accurate than it found it.
- When handing off: verify the "In-progress work" branch hash matches HEAD on master.

---

## Current focus

- **WAI-ARIA accessibility sprint — COMPLETE (2026-06-09)** (commits `2a6a7063`–`9c875628`, merged `40800b93`)
  - Pagination containers: `<div className="pagination_container">` → `<nav aria-label="Paginacja">` across all paginated pages
  - Non-interactive `<a className="pointer">` displaying page counts: replaced with `<span>`
  - Sidebar group `<a onClick>` (no href): added `role="button"` + `tabIndex={0}` + `onKeyDown` for keyboard nav
  - Advanced filters toggle: `<div onClick>` → `<button type="button" aria-expanded>` with `aria-hidden` on caret icon
  - Active nav items: `aria-current="page"` on all nav links (main nav, warehouse nav, clients nav, service detail nav, communication nav)
  - Search inputs: `aria-label` on all unlabelled search inputs across products, services, customers, sales, orders, deliveries, use history, inventory pages
  - Filter selects: `aria-label` on category/status/supplier filter selects
  - Settings tables: `aria-label` on contextual type-selects and required-checkboxes (`settings/customers.tsx`)
  - Timetable: `aria-label` on time range selects with day+index context (`settings/timetable/branch.tsx`)
  - Form table rows: `aria-label` with row index on product/unit selects in sales/new, deliveries/new, orders/new, use/new
  - Pagination `<form>` variants: added `aria-label="Paginacja"` (can't change form→nav; `TimetableTemplatesPage`, `ActivityLogRoute`)

- **Bootstrap 5 migration — COMPLETE (2026-03-27)**
- **Faza E — Versum visual parity sprint — COMPLETE (2026-05-24)**
- **Core booking/appointment flow — COMPLETE (2026-05-24)**
  - Client booking wizard `/booking` (3-step: service → slot → confirm) — implemented
  - `online_pending` + `rescheduled_pending` statuses — API + DB migration + UI
  - Available slots endpoint `GET /calendar/available-slots` — implemented
  - Formula service bug fixed (admin 403 + confirmed-status 400)
  - FinalizationModal: usageMaterials (from recipe) + usageItems (manual) + deduction — all wired
  - AppointmentDrawer: formula UI, internalNote, client contact (tel:/mailto:), visit history
  - Online pending badge in topbar — implemented
- **Dead code cleanup — COMPLETE (2026-05-25)** (PR #1352)

---

## In-progress work

- Branch: master (latest commit `40800b93` — a11y sprint merge)
- Panel production: needs redeploy for all PRs since `d9e72660`
- API production: `e56e39ff` | 2026-03-24 — **STALE**: missing online_pending migration, available-slots endpoint, formula fix
- Landing production: `e74331ee` | Next.js 15.5.10 | 2026-02-26 — unchanged

---

## Backlog — open findings / next tasks

### P1 — Blockers
- **API deploy needed** — production API stuck at 2026-03-24; new features won't work until deployed:
  - Migration `1760960000000-AddOnlinePendingAppointmentStatuses` must run
  - `GET /calendar/available-slots` endpoint needed for booking wizard
  - Formula service fix (admin 403 / confirmed 400)
  - Deploy command: MyDevil → `passenger-config restart-app`
- **Panel redeploy needed** — all commits since `d9e72660` not yet deployed to production

### P2 — Accessibility (remaining)
- Form labels: `<label>` elements without associated `htmlFor` still exist in some settings pages — not yet audited exhaustively
- Modal dialogs: `role="dialog"` + `aria-modal="true"` + focus trap — not audited; may be missing in older modals
- Table headers: `scope="col"` on `<th>` elements — not yet added systematically (WCAG 1.3.1)
- Image alt text: landing images — not audited
- Color contrast: no audit run (axe-core or Lighthouse)
- `aria-live` regions for dynamic content (toast messages, error banners) — not audited
- Keyboard focus indicators — not checked if CSS removes outline

### P3 — Code quality
- `data_protection.tsx`: `inner edit_branch_form` on a `<form>` — refactor deferred
- `DashboardLayout` exists but used by no page — dead code; safe to remove
- Push-triggered CI deploy runs failing (22595771187+) — workflow_dispatch works; root cause not investigated
- Dead CSS audit: `default.css` / `new-ui.css` chunks to remove — not yet started

---

## Recent decisions

- **a11y approach:** WAI-ARIA improvements done incrementally; `<form>` pagination wrappers get `aria-label` attribute rather than element change (can't convert form→nav without breaking form semantics).
  Evidence: TimetableTemplatesPage and ActivityLogRoute use `<form>` for page navigation
- salonbw-btn → Bootstrap 5 btn btn-* migration: all done; dead CSS removed.
- Formula service: accepts Role.Admin + Confirmed status (was bug: 403 for admin, 400 for confirmed)
- `PanelTable` API: `columns[]` (label?, ariaLabel?, className?), `isEmpty?`, `emptyMessage?`, `children` (tbody rows).
- `PanelSection` API: `title?` (renders h2), `action?` (renders actions div), `children`, `className?`.
  - Use `title` prop only when h2 is at direct top level of section.
  - For form-wrapping pages: replace outer div with PanelSection, leave h2 inside form children — do NOT use `title` prop.
- VersumShell made persistent in `_app.tsx` via nesting-detection pattern.
- Next.js upgraded to 15.5.10 on panel/landing + root pnpm.overrides updated.
- Codex (`gpt-5.3-codex`, `reasoning_effort=low`) known to skip pre-commit lint checks.
  Evidence: commit `0e93a771` had lint errors (no-misused-promises, prettier) — always audit Codex commits with tabular format: Problem | Naprawiony?

---

## Stack reminders

- Panel: Next.js 15.5.10, pnpm, TypeScript, Bootstrap 5.3 (no Tailwind)
- Backend: Node.js, pnpm
- Host: MyDevil (FreeBSD, Passenger)
- CI: GitHub Actions (.github/workflows/deploy.yml)

---

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

---

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

### Rules

- DO call `useSetSecondaryNav` before `if (!role) return null` (Rules of Hooks).
- DON'T pass `secondaryNav` prop to per-page `<VersumShell>` — use the context hook instead.
- DON'T add `/calendar` to persistent shell (document replacement incompatibility).
- `if (!role) return null` guards in pages are harmless but redundant — remove when refactoring.

### Key files

- Persistent shell + PersistentShellWrapper: `apps/panel/src/pages/_app.tsx`
- Shell component: `apps/panel/src/components/salon/SalonShell.tsx`
- Secondary nav context: `apps/panel/src/contexts/SecondaryNavContext.tsx`
- Secondary nav auto-resolution: `apps/panel/src/components/salon/SalonSecondaryNav.tsx`
- Module routing map: `apps/panel/src/components/salon/navigation.ts`
