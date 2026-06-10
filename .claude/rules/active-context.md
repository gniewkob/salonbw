# Active Context

## Agent workflow rules

- **MANDATORY:** After every significant change, immediately update this file with: what was done, what was found, what is next.
- **MANDATORY:** Add findings/blockers to the Backlog section below as soon as they are discovered.
- **MANDATORY:** Do NOT defer documentation to end-of-session — update incrementally after each commit.
- Every session should leave this file more accurate than it found it.
- When handing off: verify the "In-progress work" branch hash matches HEAD on master.

---

## Current focus

- **Full-session sprint — COMPLETE (2026-06-08/09)** (commits `ea63309b`–`9c875628`, master `3b1d03f5`)
  See `docs/IMPLEMENTATION_BACKLOG_STATUS.md` for full per-phase details. Summary:

  **Phase 0 — Feature hardening:**
  - `'use client'` removed from all 73 Pages Router components (was causing SSR issues; Pages Router doesn't use this directive)
  - All `window.alert()` → toast notifications (15 sites)
  - All `window.confirm()` / `window.prompt()` → `ConfirmModal` + custom modal
  - Error handling rollout: every mutation in panel has `onError` toast handler — no silent failures
  - Polish-only UI: all English strings translated across panel and landing
  - Bulk delete for services and products (with checkboxes)
  - TimeBlockModal for calendar time blocks
  - Commission base rate editor + display
  - Delivery row-level receive/cancel actions
  - Recipe tab on service detail; delete button on product detail
  - `/settings/customer-origins`, `/settings/data-protection` pages added
  - Account page: profile section added; API module English toasts removed
  - `rel="noopener noreferrer"` on all `target="_blank"` links

  **Phase 1 — a11y: Interactive elements:**
  - `href="#"` / `javascript:;` → `<button type="button">` everywhere
  - `type="button"` added to 56+ buttons missing it (prevents form submission)
  - SalonBreadcrumbs: `<nav aria-label="Nawigacja">` + `aria-current="page"`

  **Phase 2 — a11y + SEO: Titles + meta:**
  - Page-specific `<title>` on ALL 44+ panel pages; default fallback in `_app.tsx`
  - Custom 404 page for panel
  - Full OG/Twitter/JSON-LD meta on all landing pages; `og:locale=pl_PL`, dimensions, canonical with `absUrl()`
  - `theme-color` + Twitter card; JSON-LD Organization schema (services, gallery, contact)
  - Missing `<meta name="viewport">` fix in landing

  **Phase 3 — a11y: Form semantics:**
  - `htmlFor`/`id` linkage on ALL labels across all modals and forms
  - `aria-label` on all icon-only buttons and controls without visible labels
  - `aria-hidden="true"` on 25+ decorative icons (FontAwesome + SVGs)
  - `role="alert"` / `role="status"` on error/warning/success messages
  - `aria-describedby` on hint-associated inputs
  - `autoComplete` attributes on customer form inputs

  **Phase 4 — a11y: Modal dialogs + nav:**
  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on ALL modals (3 batches)
  - Focus trap + ESC handler + focus restoration on close

  **Phase 5 — a11y: Tables + pagination + nav:**
  - `scope="col"` on ALL `<th>` in panel
  - Pagination: `<nav aria-label="Paginacja">` on all paginated pages
  - `aria-current="page"` on active nav items in ALL navigation components
  - Non-interactive `<a>` → `<span>`; `<a onClick>` → `role="button"` + keyboard nav

  **Phase 6 — Route integrity + calendar:**
  - Legacy rewrites fixed; time-block validation hardened; calendar overlap queries fixed

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

- Branch: master (latest commit `21efc2459`)
- Panel production: `21efc2459` — DEPLOYED 2026-06-10 (push-triggered run `27266421553`, success; verified: strict CSP without unsafe-eval, login 200)
- Landing production: `21efc2459` — DEPLOYED 2026-06-10 (same run; verified: silver-ink CSS + absolute canonical live)
- API production: `e56e39ff` | 2026-03-24 — **STALE**: missing online_pending migration, available-slots endpoint, formula fix (push didn't touch backend, so API was not deployed)

---

## Backlog — open findings / next tasks

### P1 — Blockers
- **API deploy needed** — production API stuck at 2026-03-24; new features won't work until deployed:
  - Migration `1760960000000-AddOnlinePendingAppointmentStatuses` must run
  - `GET /calendar/available-slots` endpoint needed for booking wizard
  - Formula service fix (admin 403 / confirmed 400)
  - Deploy command: MyDevil → `passenger-config restart-app`
- ~~Panel redeploy needed~~ — DONE 2026-06-10: push deploy `27266421553` shipped panel + landing at `21efc2459`

### P2 — Accessibility (remaining — all other a11y DONE in full-session sprint)
- ~~Color contrast audit~~ — DONE 2026-06-10 (`2b57d0c12`, `64abb87ad`): Lighthouse run on landing (/, /services, /contact, /gallery, /services/balayage) + panel /auth/login — all now score a11y 100. Fixed: white-on-silver CTA → dark-on-silver; new `--brand-silver-ink` (#6e7278) for silver text on light bg; `--brand-warm-label` darkened; low-alpha white text on dark raised to 0.55; slider dots got 24px touch targets; login got `<main>` landmark. Panel authenticated pages NOT audited (needs logged-in Lighthouse run — follow-up if desired)
- ~~Toast aria-live~~ — DONE 2026-06-10 (`4d016e554`): error toasts now `role=alert` + `aria-live=assertive`; success keeps react-hot-toast default polite status
- ~~Landing image alt text~~ — AUDITED 2026-06-10, no gaps: all content images have descriptive Polish alts in `content.ts`; decorative bg images (BookingCta, ServicesTeaser) correctly use `alt=""` + `aria-hidden`
- ~~Focus-ring CSS audit~~ — AUDITED 2026-06-10, no gaps: every `outline: none` in salon-shell.css pairs with border-color + box-shadow focus style; global `:focus-visible` rule (line ~8247) gives 2px accent outline to buttons/links/tabindex

### P3 — Code quality
- `data_protection.tsx`: `inner edit_branch_form` on a `<form>` — refactor deferred
- `DashboardLayout` exists but used by no page — dead code; safe to remove
- ~~Push-triggered CI deploy runs failing~~ — stale: push deploy `27266421553` (2026-06-10) succeeded end-to-end
- Dead CSS audit: `default.css` / `new-ui.css` chunks to remove — not yet started

---

## Recent decisions

- **`'use client'` prohibition (Pages Router):** Remove from ALL panel components/hooks. Pages Router components are server-renderable by default; `'use client'` is App Router only. Removed from 73 files in this session.
- **Error handling contract:** Every `mutation.mutate()` / `mutation.mutateAsync()` call must have `onError: (err) => toast(...)`. Never log silently. Rolled out across all panel pages in this session.
- **Polish-only UI:** All user-visible strings must be in Polish. No English in buttons, labels, toasts, errors, placeholders. Translated all remaining English strings in this session.
- **`type="button"` required:** All `<button>` elements that are not `type="submit"` must explicitly declare `type="button"`. Untyped buttons inside forms default to submit.
- **No `href="#"` / `javascript:;`:** Use `<button type="button">` for interactive elements that aren't real navigation links.
- **`window.confirm()` / `window.alert()` → ConfirmModal / toast:** Native dialogs inaccessible and unstyled. All replaced in this session.
- **Modal semantics:** All modals require `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (title id) + ESC closes + focus trap + focus restore on close.
- **SEO meta pattern:** Every public landing page needs title, og:title/description/url/image/locale/type, twitter:card, canonical. Services/gallery/contact also get JSON-LD Organization schema. `og:url` and canonical must use absolute URLs via `absUrl()`.
- **Form labels:** Every `<input>`/`<select>`/`<textarea>` must be linked to a `<label>` via `htmlFor`/`id` OR have `aria-label`/`aria-labelledby`. `aria-label` used when no visible label (icon buttons, table row selects).
- **Decorative icons:** `aria-hidden="true"` on all decorative FontAwesome `<i>` and inline SVGs. Icon-only buttons get `aria-label`.
- **Pagination landmark:** Wrap with `<nav aria-label="Paginacja">`. Active page: `aria-current="page"`. Form-based pagination: add `aria-label="Paginacja"` to `<form>`.
- **Nav `aria-current`:** All active nav items across ALL navigation components must have `aria-current="page"` (links) or `aria-current="true"` (filter/group buttons).
- **a11y form toggle:** Clickable `<div>` that shows/hides content → `<button type="button" aria-expanded={bool}>`. Caret icon gets `aria-hidden="true"`.
- **`rel="noopener noreferrer"`:** Required on ALL `target="_blank"` links. Security + performance.
- **a11y — `<form>` pagination:** Can't convert to `<nav>` without breaking form semantics. Add `aria-label="Paginacja"` to the `<form>` instead.
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
