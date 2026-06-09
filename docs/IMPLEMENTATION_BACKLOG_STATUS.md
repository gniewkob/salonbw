# Implementation Backlog Status

_Last updated: 2026-06-09_

This file tracks the current status of the AI-ready implementation backlog against the repository state.

**Agent workflow rule:** Update this file after every commit. Add findings/blockers immediately, never at end-of-session.

## Closed in Code

### WAI-ARIA Accessibility Sprint (2026-06-09)

- Status: implemented, merged to master (`40800b93`)
- Scope: panel frontend — no API changes
- Files changed:
  - `apps/panel/src/pages/appointments.tsx`
  - `apps/panel/src/pages/customers/index.tsx`
  - `apps/panel/src/pages/deliveries/history.tsx`
  - `apps/panel/src/pages/deliveries/new.tsx`
  - `apps/panel/src/pages/inventory/index.tsx`
  - `apps/panel/src/pages/orders/history.tsx`
  - `apps/panel/src/pages/orders/new.tsx`
  - `apps/panel/src/pages/products/index.tsx`
  - `apps/panel/src/pages/sales/history/index.tsx`
  - `apps/panel/src/pages/sales/new.tsx`
  - `apps/panel/src/pages/services/index.tsx`
  - `apps/panel/src/pages/use/history/index.tsx`
  - `apps/panel/src/pages/use/new.tsx`
  - `apps/panel/src/pages/use/planned.tsx`
  - `apps/panel/src/pages/settings/customers.tsx`
  - `apps/panel/src/pages/settings/timetable/branch.tsx`
  - `apps/panel/src/components/customers/CustomerSidebar.tsx`
  - `apps/panel/src/components/salon/SalonMainNav.tsx`
  - `apps/panel/src/components/salon/navs/ClientsNav.tsx`
  - `apps/panel/src/components/salon/navs/CommunicationNav.tsx`
  - `apps/panel/src/components/salon/navs/ServiceDetailNav.tsx`
  - `apps/panel/src/components/salon/navs/SalonGroupedNav.tsx`
  - `apps/panel/src/components/salon/navs/WarehouseNav.tsx`
  - `apps/panel/src/components/settings/ActivityLogRoute.tsx`
  - `apps/panel/src/components/settings/TimetableTemplatesPage.tsx`
- What was done:
  - Pagination `<div className="pagination_container">` → `<nav aria-label="Paginacja">` on all paginated pages; form-based pagination got `aria-label` attribute only (element cannot change)
  - Non-interactive `<a className="pointer">` showing page totals: replaced with `<span>`
  - Sidebar `<a onClick>` without href: added `role="button"` + `tabIndex={0}` + `onKeyDown Enter handler`
  - Advanced filters toggle: `<div onClick>` → `<button type="button" aria-expanded={bool}>` + `aria-hidden` on caret icon
  - `aria-current="page"` added to all active nav links: main nav, warehouse nav, clients nav, service detail tabs, communication nav, SalonGroupedNav
  - `aria-label` on all unlabelled search inputs, category/status filter selects, supplier selects
  - `aria-label` with row index on product/unit selects inside `<tr>` mapped rows (no visible label exists)
  - `aria-label` on timetable time-range selects with day+range-index context
  - `aria-label`/`title` on settings customer extra-field type selects and required checkboxes
- Remaining a11y gaps (not done in this sprint — see full sprint below for what IS done):
  - `aria-live` regions for dynamically injected toast messages (role=alert added to static error banners; live region on toast container not verified)
  - Color contrast audit (axe-core / Lighthouse) — no tool run yet
  - Image alt text on landing pages — not audited
  - Keyboard focus-ring CSS audit — not verified if outline is suppressed in theme CSS

### Full-Session Sprint (2026-06-08 — 2026-06-09) — Feature hardening + a11y

All commits from `ea63309b` to `9c875628` (master `3b1d03f5`). Grouped by phase:

#### Phase 0 — Initial feature hardening (panel + landing)

- `ea63309b` — hide gift-cards/karnety from extension sidebar nav (feature gate)
- `4f864fc6` — add 4 missing settings pages to fix dead links on settings dashboard
- `32059527` — add `/settings/customer-origins` and `/settings/data-protection` pages
- `b8af7a60`, `15992a60`, `7c5afd88` — **remove `'use client'` from 73 panel components/hooks** (Pages Router files must NOT have this directive; it was causing SSR issues)
- `e3e780f6` — replace all `alert()` calls with toast notifications (15 sites in panel)
- `33f1bab7` — fix 262 failing tests: mock useAuth, guard formulas array
- `3116bc67` — fix admin nav dead link, missing permissions, Polish reviews UI
- `6f1b160e` — add company settings link to SettingsNav (was orphaned)
- `913b5264` — migrate admin/loyalty page to SalonShell + RouteGuard
- `e88ecc48` — migrate company settings page; fix appointments early return
- `93ad0b93` — improve invoices page: date + status columns, empty state
- `6ea73a4c` — error handling, empty states, spinners on key pages
- `3bf51846`, `38a1b1a6` — bulk delete with checkboxes for services and products
- `d150b0fe` — TimeBlockModal for creating/editing calendar time blocks
- `bbec46fe` — reviews: replace raw employee ID input with employee dropdown
- `fdf3ffec`, `d477806d`, `e47e6968` — replace silent `console.error` with toast feedback; remove broken/redundant console calls
- `2a786fb7` — fix all ESLint errors: unused vars, prettier, no-misused-promises
- Error handling rollout (many commits: `64b6c3b4`, `4a8b9959`, `818cd6c5`, `2fedffa3`, `e262bd49`, `f14fb70b`, `11bc4b49`, `cbcfb9c5`, `ebdfc1e8`, `6818e852`, `ac387b81`, `d41eba95`, `7c8c72b3`, `35d66677`, `a8bf300a`, `41f8204b`):
  - Every mutation in panel now has `onError` handler with toast notification
  - No silent failures: warehouse, employee, settings, stocktaking, extra-fields, data-protection, deliveries, trades
- `f14fb70b` — new API endpoint: `POST /appointments/:id/reschedule-request`
- `cf8ec5df`, `63f88510`, `ba761358` — commission base rate editor; commission base rate display in list; delivery row-level receive/cancel
- `73663284` — delete button on product detail page
- `ffd0432f` — recipe tab on service detail page
- `d754739e` — online booking save button fix; services category filter fix
- `321830cc` — stub pages for `/admin/branches` and `/admin/settings/company`
- `8e089f02` — account page: add profile section; remove English internal toasts from API modules
- `97aa9099`, `16c13e79`, `696527d3` — remove English internal toasts from products/API modules; Polish toasts for employees pages
- `e167f30c` — fix double-toast on customer create failure
- `2163e037` — translate remaining English UI strings to Polish
- `362ba331` — landing: translate aria-labels, fix /about link, add ContactForm loading state
- `0ed62e35` — translate ClientForm to Polish; update tests for Polish strings
- `c6f76354` — fix employees breadcrumb (incorrect Settings parent item removed)

**Established pattern — error handling:** every `mutation.mutate()` / `mutation.mutateAsync()` call in panel must have `onError: (err) => toast(...)`. Never log to console silently.

**Established pattern — Polish-only UI:** All user-visible strings in panel/landing must be in Polish. No English text in buttons, labels, toasts, errors.

**Established pattern — `'use client'` prohibition:** Pages Router pages and components must NOT have `'use client'` directive. Remove it everywhere. Only App Router components need it.

#### Phase 1 — a11y: Interactive element semantics

- `a2c0d570`, `c8ada0ab`, `5be5de9f`, `cdb49b2a`, `9b8668fe`, `11b97ee7` — **replace all `window.confirm()` and `window.prompt()` with `ConfirmModal`** (accessible modal dialog instead of native browser dialog)
- `7abe5a7f`, `6c0d2004`, `0f9b8795` — ConfirmModal: accessibility improvements, test suite, focus trapping + focus restoration on close
- `b47bb19f` — replace `javascript:;` href links with `<button>` + add tab ARIA roles
- `cd404564`, `05252762`, `86bf151d`, `9a5d94fa`, `fb850632` — replace `href="#"` anchors with `<button type="button">` in customers, topbar, sidebar navs, statistics, CSV download
- `bee96870` — add `type="button"` to 56 buttons missing it in panel (prevents accidental form submission)
- `2411d48e`, `340d9122`, `47678cf5`, `b8e6df95`, `76bb2804`, `33bfa22d`, `5aa2bebf` — `type="button"` on CTA buttons in landing service pages, BookingCta, Navbar, BookingModal, AppointmentDetailsModal, contact section
- `c2b4147a` — `type="button"` + `aria-label` on unlabeled inputs/buttons
- `cf0565a6` — remove dead components; fix remaining missing button types

**Established pattern — `type="button"`:** ALL `<button>` elements that are not submit buttons MUST have `type="button"`. No exceptions. Forms submit on Enter by default; untyped buttons become submit buttons.

**Established pattern — no `href="#"` or `javascript:;`:** Interactive elements that are not navigation links must be `<button>`. Never use anchors without real href for interactive purposes.

**Established pattern — ConfirmModal over `window.confirm()`:** Native `window.confirm()` is not accessible, can't be styled. Always use `ConfirmModal` component for destructive action confirmations.

#### Phase 2 — a11y + SEO: Page titles + meta tags

- `f0379ce4` — default page title fallback in `_app.tsx` (`<title>SalonBW</title>`)
- `6bf01ef6` — page-specific titles for core panel pages + sitemap fix
- `8e750ec9` — page-specific titles for remaining 37 panel pages
- `d4c4946b` — page titles + aria-label on close buttons
- `9ab08614` — aria-modal + page titles on dynamic pages (customer detail, employee detail, etc.)
- `55159316` — custom 404 page for panel
- `ccbfe159` — JSON-LD structured data (Organization schema on services, gallery, contact pages)
- `c7e8d0f4` — `theme-color` + Twitter card meta tags on landing `_document.tsx`
- `7dbae64c` — `absUrl()` helper for canonical + `og:url`/`og:image` — canonical URLs now use full domain, not relative paths
- `4cb53777` — `og:url` + `og:image` dimensions on all landing pages
- `3e31dd1c` — `og:locale=pl_PL` on all landing pages
- `14686826` — fix missing `<meta name="viewport">` in landing `_document.tsx`
- `3e87fa82` — `rel="noopener noreferrer"` on ALL `target="_blank"` links (security + performance)

**Established pattern — SEO:** Every public landing page must have: `<title>`, `og:title`, `og:description`, `og:url` (absolute), `og:image` (absolute with width/height), `og:locale=pl_PL`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `canonical` link. Services/contact/gallery additionally get JSON-LD Organization schema.

**Established pattern — security:** Any `target="_blank"` link must have `rel="noopener noreferrer"`.

#### Phase 3 — a11y: Form label semantics + icon buttons

- `ddd01e03`, `4f5aa4ba`, `f33175a1`, `13552cf6`, `a4b3df06`, `d8c2e901`, `0aa6e2e5`, `8dcfd1d2`, `09bf7b05`, `f9870244`, `490ed244` — `htmlFor`/`id` linkage across all modals and forms: customers, SmsComposer, timetable copy, warehouse supplier/stocktaking forms, CustomerSummaryTab, ServiceVariantsModal, CreateCustomerModal, modals, tabs, settings, SMS template modal, appointment filters, mass communication, reply form, privacy settings, newsletter editor, gift-cards, loyalty, FinalizationModal, gift-card search filter, timetable exception modal
- `87dc9399`, `933e09ef`, `e2b0a760` — `aria-label` on form controls without visible labels; `aria-label` on icon close buttons
- `28c30b9f`, `2742ffc9`, `d5cfb2c6` — `aria-label` + `aria-hidden` on SVG/icon-only action buttons; icon buttons and close buttons
- `49b5b63d`, `00859ddc` — `aria-label`/`aria-expanded` on icon-only buttons; `aria-label` on nav elements and × close/remove buttons
- `04d30951`, `ccb33627`, `bf0ac412` — `aria-hidden="true"` on 25+ decorative icons (FontAwesome, inline SVGs, mobile lang buttons)
- `09bf7b05` — `autoComplete` attribute on help email input; `aria-label` on price type select
- `68bdb602` — `type` + `autoComplete` on customer form inputs; fix consent group label
- `8b7d1c31` — `aria-label` on timetable time inputs with day-of-week context (e.g. "Godzina (poniedziałek, zakres 1)")
- `6e57797e`, `ed63894a` — `role="alert"` / `role="status"` on error/warning/success messages; fix × link aria-label
- `e905af01` — `aria-describedby` on help page email input pointing to hint text
- `4293c9ef` — Prettier formatting pass on all a11y-modified files (CI lint)

**Established pattern — form labels:** Every `<input>`, `<select>`, `<textarea>` must be associated with a `<label>` via `htmlFor`/`id` OR have an `aria-label`/`aria-labelledby`. No unlabelled controls.

**Established pattern — decorative icons:** Every decorative icon (FontAwesome `<i>`, inline `<svg>` used as decoration) must have `aria-hidden="true"`. Icon-only buttons must have `aria-label` describing the action.

**Established pattern — status/error messages:** Dynamically appearing error messages should have `role="alert"` (assertive); status updates `role="status"` (polite). This allows screen readers to announce them without requiring focus.

#### Phase 4 — a11y: Modal dialogs + navigation

- `c64de19c`, `57d53216`, `88c18377` — `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on ALL inline modal components (3 batches covering all salon modals)
- `c64de19c` — ESC key handler + focus trap on salon modals; focus restored to trigger on close
- `6cd52cf8` — SalonBreadcrumbs: wrapped in `<nav aria-label="Nawigacja">` + `aria-current="page"` on last item
- `5d9ce1c2` — SalonBreadcrumbs tests extended for nav landmark and aria-current

**Established pattern — modals:** All modal dialogs must have: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to modal title `id`, ESC key closes, focus trapped inside while open, focus restored to trigger element on close.

#### Phase 5 — a11y: Tables + pagination + nav (final phase)

- `1431aeb9` — `scope="col"` on ALL `<th>` elements across all tables in panel + DataTable component empty state
- `80284a7c` — appointments page: pagination `<nav aria-label="Paginacja">`, `aria-current="page"`, `aria-label` on search
- `2a6a7063` — pagination `<nav aria-label="Paginacja">` across ALL remaining paginated pages (8 pages)
- `3c1ae733` — `aria-label` on all unlabelled search inputs and category/status/supplier filter selects
- `9a95e528` — non-interactive `<a className="pointer">` replaced with `<span>`; sidebar `<a onClick>` → `role="button"` + `tabIndex={0}` + `onKeyDown Enter handler`
- `4825b804` — `aria-current="page"` on active items in ClientsNav, ServiceDetailNav, CommunicationNav, SalonGroupedNav
- `417f6f3e` — `aria-current="page"` on active items in SalonMainNav, WarehouseNav; `aria-current="true"` on active category/filter buttons
- `9c875628` — CustomerSidebar advanced filters toggle: `<div onClick>` → `<button type="button" aria-expanded={bool}>` + `aria-hidden` on caret icon

**Established pattern — pagination:** All paginated lists must wrap pagination controls in `<nav aria-label="Paginacja">`. Active page button gets `aria-current="page"`. Form-based pagination (can't change element): add `aria-label="Paginacja"` to the `<form>`.

**Established pattern — nav items:** All navigation components must mark the active item with `aria-current="page"` on links, or `aria-current="true"` on active filter/group buttons. Use `aria-current` not CSS class alone.

**Established pattern — non-interactive anchors:** `<a>` without `href` that just displays info must be replaced with `<span>`. `<a onClick>` without `href` must get `role="button"` + `tabIndex={0}` + `onKeyDown Enter handler`.

#### Phase 6 — Route integrity + calendar hardening (same session)

(Documented in detail in the entry below)

### 2026-06-09. Route integrity + calendar time-block hardening

- Status: implemented, merged to master (`afd0ece0`)
- Why this was done:
  - the post-merge review found legacy rewrites pointing to removed pages,
  - the settings navigation exposed pages that were only informational stubs,
  - panel registration and calendar settings had static links that could land on missing routes,
  - calendar time blocks accepted invalid ranges and overlapping blocks without backend enforcement,
  - calendar range queries only matched events whose `startTime` was inside the range, so events starting before the range and ending inside it could be omitted.
- Files:
  - `apps/panel/next.config.mjs`
  - `apps/panel/src/components/calendar/TimeBlockModal.tsx`
  - `apps/panel/src/components/salon/navs/SettingsNav.tsx`
  - `apps/panel/src/components/settings/CalendarSettingsForm.tsx`
  - `apps/panel/src/pages/auth/register.tsx`
  - `apps/panel/src/__tests__/routeIntegrity.test.ts`
  - `backend/salonbw-backend/src/calendar/calendar.service.ts`
  - `backend/salonbw-backend/src/calendar/calendar.service.spec.ts`
- Current behavior:
  - legacy `/salonblackandwhite/settings/customer_groups*` now maps to canonical customer settings routes,
  - legacy event reminder paths now map to `/communication/automatic`,
  - legacy customer panel settings now map to `/settings/online-booking`,
  - `/settings/reminders` redirects directly to `/communication/automatic`,
  - `/admin/branches` and `/admin/settings/company` are compatibility redirects to `/settings/branch` instead of real stub pages,
  - settings navigation no longer surfaces unavailable `admin/*` stub pages,
  - registration privacy link points to the public landing privacy page,
  - calendar settings tag link points to the existing customer extra-fields tab,
  - time-block creation/update rejects invalid date ranges, non-employee targets, appointment overlaps, and time-block overlaps,
  - calendar event/time-block reads use overlap semantics (`start < rangeEnd AND end > rangeStart`) instead of start-time-only filtering.
- Regression coverage:
  - `apps/panel/src/__tests__/routeIntegrity.test.ts` guards static internal links and rewrite/redirect destinations against missing pages,
  - `backend/salonbw-backend/src/calendar/calendar.service.spec.ts` guards core time-block validation rules.
- Validation snapshot:
  - `apps/panel`: route integrity test, `pnpm eslint src --fix`, `pnpm tsc --noEmit`,
  - `backend/salonbw-backend`: calendar service test, `pnpm lint --fix`, `pnpm tsc --noEmit`,
  - backend lint still reports existing `@typescript-eslint/no-unsafe-*` warnings in unrelated files but exits with `0` errors.
- Guidance for future changes:
  - do not add visible navigation to stub/TODO pages; hide it or redirect to a canonical implemented page,
  - every new static route/link/legacy rewrite should be covered by route integrity checks,
  - preserve canonical panel routes from `AGENTS.md` and treat legacy `/admin/*`, snake_case, and `/salonblackandwhite/*` routes as compatibility aliases only,
  - validate calendar scheduling invariants in the backend first, then mirror the fast UX validation in the panel,
  - for calendar range reads, prefer overlap queries over `Between(startTime)` unless the business rule explicitly requires start-time-only matching.

### Remaining follow-ups from the same review

- Bulk delete for services/products still runs frontend-side as per-item deletion. Recommended next step: add backend bulk endpoints with transaction boundaries and explicit partial-failure semantics.
- Next config still contains `eslint.ignoreDuringBuilds` / panel `typescript.ignoreBuildErrors`; CI currently catches lint/typecheck, but build config should eventually stop ignoring these once the warning backlog is under control.
- Backend has a broad existing `@typescript-eslint/no-unsafe-*` warning backlog. Treat it as technical debt, not as part of this route/time-block fix.
- After this commit is pushed, monitor `CI` and `Deploy (MyDevil)` for the commit SHA and run a manual panel smoke for:
  - `/settings`,
  - `/communication/automatic`,
  - `/calendar`,
  - registration privacy link,
  - creating/editing a valid time block and attempting an overlap.

### 0. Booking role gating for `reservedOnline`

- Status: implemented
- Files:
  - `apps/panel/src/pages/booking.tsx`
  - `apps/panel/src/__tests__/bookingPage.test.tsx`
  - `backend/salonbw-backend/src/appointments/appointments.service.spec.ts`
  - `backend/salonbw-backend/src/appointments/test-context.ts`
- Current behavior:
  - panel booking wizard sends `reservedOnline=true` only for role `client`
  - staff roles (`admin`, `employee`, `receptionist`) send `reservedOnline=false`
  - backend service coverage confirms:
    - `reservedOnline=true` => `AppointmentStatus.OnlinePending`
    - `reservedOnline=false` => `AppointmentStatus.Scheduled`

### 0a. Privacy consents load guard (prevent accidental overwrite)

- Status: implemented
- File:
  - `apps/panel/src/pages/settings/privacy.tsx`
- Current behavior:
  - failed `/users/profile` load now shows explicit error state with retry button,
  - consent save action is blocked when profile load fails,
  - page no longer silently falls back to default `false` consent toggles on load failure.

### 1. Employee ranking N+1

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/statistics/statistics.service.ts`
  - `backend/salonbw-backend/src/statistics/statistics.service.spec.ts`
- Current behavior:
  - employees are loaded once
  - completed appointments in range are loaded once
  - review aggregates are loaded once and grouped by `appointment.employeeId`
  - employees with zero appointments remain in the output

### 2. Employee activity N+1

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/statistics/statistics.service.ts`
  - `backend/salonbw-backend/src/statistics/statistics.service.spec.ts`
- Current behavior:
  - activity uses one appointment query for the day
  - only `Completed` appointments are counted
  - employees without appointments remain in the output with zero values

### 3. Retail sale batching + duplicate-line normalization

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/retail/retail.service.ts`
  - `backend/salonbw-backend/src/retail/retail.service.spec.ts`
- Current behavior:
  - duplicate effective sale quantities are aggregated before stock validation
  - stock validation runs on transaction-scoped locked product rows
  - stock mutation still happens inside the transaction

### 4. Retail usage batching + duplicate-line normalization

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/retail/retail.service.ts`
  - `backend/salonbw-backend/src/retail/retail.service.spec.ts`
- Current behavior:
  - duplicate effective usage quantities are aggregated before stock validation
  - validation runs against transaction-scoped locked product rows
  - planned vs completed usage semantics are unchanged

### 5. Customer reviews tab wiring

- Status: implemented with normalized frontend mapping
- Files:
  - `apps/panel/src/components/customers/CustomerReviewsTab.tsx`
  - `apps/panel/src/types.ts`
- Current behavior:
  - `CustomerReviewsTab` uses `useReviews({ clientId })`
  - API review payload is normalized into the tab-specific view model
  - missing fields such as `source` and `reply` are not assumed to exist on the backend and are synthesized or omitted safely

### 6. Calendar embed PJAX cleanup

- Status: implemented
- Files:
  - `apps/panel/src/pages/api/calendar-embed.ts`
  - `docs/CALENDAR_FLOW_SPEC.md`
- Current behavior:
  - `calendar-embed` now serves one response mode: full HTML document
  - legacy `x-pjax` branch was removed after live Versum verification showed no confirmed calendar HTML PJAX caller

### 7. Landing contact data

- Status: implemented
- Files:
  - `apps/landing/src/config/content.ts`
- Current behavior:
  - public phone uses the first-party production number `+48 723 588 868`
  - public email is set to `kontakt@salon-bw.pl`

### 8. Product sales in revenue charts

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/statistics/statistics.service.ts`
- Current behavior:
  - revenue chart still reports service revenue from completed appointments
  - product revenue is now included separately in `products`
  - product bucketing uses transaction date `product_sales.soldAt`
  - existing `range/from/to/groupBy/employeeId` parameters remain unchanged

### 9. Product sales in commission reports

- Status: implemented
- Files:
  - `backend/salonbw-backend/src/statistics/statistics.service.ts`
  - `backend/salonbw-backend/src/retail/retail.service.ts`
  - `backend/salonbw-backend/src/commissions/commission.entity.ts`
  - `apps/panel/src/pages/statistics/commissions.tsx`
- Current behavior:
  - report keeps separate service and product columns
  - product revenue is grouped by `product_sales.soldAt`
  - product commission is grouped by `product_sales.soldAt` via `commissions.productSaleId`
  - sales without `employeeId` are reported under `Recepcja`
  - the panel commissions page now requests a real custom day range instead of sending an ignored `date` param

## Verified from Repository

### Customer reviews API contract

- Endpoint: `GET /customers/:id/reviews`
- Backend currently returns paginated `Review` entities from `ReviewsService.findForClient()`
- Repository facts:
  - `Review` entity includes eager `client`, `employee`, and nullable `appointment`
  - backend controller does not expose a dedicated flattened DTO for customer reviews
- Practical frontend consequence:
  - consumers must handle `appointment?.id` and relation objects instead of assuming a guaranteed flat `appointmentId`

## New Approved Scope

### Refund / void / reversal suite

- Status: implemented and deployed
- Files:
  - `backend/salonbw-backend/src/migrations/1760105000000-AddWarehouseSaleReversalFlow.ts`
  - `backend/salonbw-backend/src/retail/dto/reverse-sale.dto.ts`
  - `backend/salonbw-backend/src/retail/retail.service.ts`
  - `backend/salonbw-backend/src/retail/sales.controller.ts`
  - `backend/salonbw-backend/src/warehouse/entities/warehouse-sale.entity.ts`
  - `backend/salonbw-backend/src/warehouse/entities/warehouse-sale-item.entity.ts`
  - `apps/panel/src/hooks/useWarehouseViews.ts`
  - `apps/panel/src/pages/sales/history/index.tsx`
  - `apps/panel/src/pages/sales/history/[id].tsx`
  - `apps/panel/src/types.ts`
- Implemented behavior:
  - supports `void` by creating a full reversal entry
  - supports `refund` by creating a reversal entry for selected line quantities
  - supports `correction` by creating a reversal entry for selected line quantities
  - reversal can restore stock
  - reversal can reverse product commission
  - source sale keeps a status (`active` / `adjusted` / `voided` / `refunded`)
  - reversal rows are ledger-style records (`void` / `refund` / `correction`) instead of destructive overwrites
- Test coverage:
  - `retail.service.spec.ts` covers reversal selection defaults, duplicate reversal guards, refund ledger semantics, restock behavior, source-sale status updates, and partial-void rejection
  - `sales.controller.spec.ts` covers controller delegation and route metadata for `POST /sales/:id/void`, `POST /sales/:id/refund`, and `POST /sales/:id/correction`
- Production rollout:
  - dashboard deploy `23001341385` (`success`)
  - api deploy `23001488052` (`success`)
  - public deploy `23001578864` (`success`)
  - migration `1760105000000-AddWarehouseSaleReversalFlow.ts` applied during API deploy
