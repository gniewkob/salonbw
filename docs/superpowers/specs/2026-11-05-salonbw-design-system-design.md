# SalonBW V18 Design System — Design Specification

**Date:** 2026-11-05  
**Decision:** Approved incremental/adaptive approach (no full UI rewrite)  
**Status:** implementation spec for stages 00–03; other modules require their own delivery plans

## Intent and users

Turn the isolated /studio-v18 concept into a cohesive, functional admin experience for the Salon Black & White team. Prioritize reliability and speed of real work for admins, receptionists, and employees while keeping an expressive, restrained modern visual language. The client-facing account/booking routes are a separate product surface and are not implicitly migrated.

## Existing evidence (verified against source at b2a89502)

- Next.js 15 Pages Router, React 18, Bootstrap 5, React Query, Playwright/Jest. The V18 dashboard is currently one admin-only, DEV-only preview in apps/panel/src/pages/studio-v18.tsx.
- Existing SalonShell and navigation.ts own role-scoped routing/navigation; RouteGuard and useAuth guard pages. Do not reimplement authorization or treat hiding controls as permission checks.
- Existing ui/PanelButton, ui/PanelTable, ui/PanelModal, ui/EmptyState, DataTable, Modal are independent, imperfect reusable controls. Reuse and improve them selectively; do not blanket-replace or silently alter the legacy UI.
- /customers is a complex, working operational view (~979 lines): server-provided search/sort/page from useCustomers, custom group/tag/service/employee filters, mobile accumulated pages, group drag/drop, CSV export, bulk group and newsletter, create/edit/delete modals. Preserve each capability before and after migration.
- /calendar contains appointment scheduling, reception-specific modes and many subordinate components: no calendar engine rewrite in this project.
- StudioV18.module.css contains scoped tokens/colors and layout; do not apply them to global body or Bootstrap selectors.

## Design choices

### Approach chosen: adaptive + parallel preview

Alternatives considered: (A) big-bang shadcn/Tailwind rewrite (rejected: regressions and CSS collisions); (B) all-custom primitives (rejected: component maintenance); (C) existing components and domain logic with V18-themed scoped wrappers, adding vetted primitives only where accessibility/complex behavior justifies it (chosen).

- Scope CSS under a V18 boundary, not global :root, body, button, input, .table or h1 selectors.
- Canonical baseline token palette inherited from reference: canvas #f5f3f8, paper #fff, ink #292733, border #eeeaf1, lavender #d9cdf7, accent #8069cf; secondary text needs measured contrast, so prefer #6b6471 over white.
- Headings in the preview are sans; landing/branding outside this panel retains its existing serif identity. No logo or public site restyling.
- Distinguish operational list, detail, wizard, calendar, and analysis patterns; never paste dashboard card arrangements into every workflow.
- Motion is subtle, interruptible, transforms/opacity where appropriate, and disabled by prefers-reduced-motion. No decorative WebGL or new fonts in initial scope.
- Phase 01 uses existing installed dependencies only. Evaluate Radix Dialog separately if existing Modal fails keyboard/focus tests; evaluate TanStack Table only if native wrapper cannot satisfy server sorting/filtering/selection. The app already has React Query but not @tanstack/react-table; do not automatically install it or Tailwind.

## Architecture

1. **V18Foundation**: scoped CSS module defining CSS custom properties and presentation utilities, consumed by new preview routes and then extracted/shared after acceptance.
2. **Component catalog**: DEV-and-admin-only /studio-v18/components, displaying real reusable PanelButton, PanelTable and status/empty-state components with **explicitly synthetic** fixture data; accessible labels, keyboard focus and responsive surfaces; no calls to salon/client endpoints.
3. **V18Shell**: reusable preview shell consuming existing role-aware navigation metadata; no second independent role map. Admin-only first. Future staff mode requires exact parity with existing SalonShell navigation permissions.
4. **Customers vertical slice**: /studio-v18/customers uses useCustomers() and existing customer modals, keeps *server-side* sorting and pagination (never sort just the returned page). Desktop table and mobile card/list are distinct views of the same server data. Real create/edit/booking links and existing backend validations; no parallel API, no new database tables.

## Security/privacy boundaries

- Separate DEV-only pages must fail closed on any non-DEV host. Match existing getServerSideProps restriction with exact host allowlist plus RouteGuard for roles and permissions.
- Do not extend temporary Basic Auth bypass or its expiration. Login, cookies, CSRF and backend permission checks remain authoritative.
- Component catalog uses made-up, non-identifying fixtures. No screenshot artifacts from a real account with customer personal data.
- Preserve all current API routes, groups/consents and business validation. No production change; no merge to master without owner approval.
- A preview is not production authorization. Operational mutations must use existing authenticated hooks and error handling.

## UX behavior

- Search/filter/sort changes reset page to 1; initial page=1, page size=20. Server response controls displayed total/page count.
- Empty search vs server error vs loading are clearly different, with retry where appropriate.
- Action buttons and sorting are keyboard-operable; header buttons use aria-sort on th with meaningful button names.
- Mobile starts at 390 px and includes 320px reflow acceptance; do not degrade customer call, booking and edit actions.
- Destructive actions always require the existing explicit confirmation.
- Data export and bulk flows must be accounted for in migration checklist, not omitted merely because the preview table looks cleaner.

## Phased delivery

- Stage 00: evidence and baseline; spec, implementation plan, route inventory, explicit preserved-behavior list.
- Stage 01: scoped V18 foundation and real component catalog (first release checkpoint).
- Stage 02: reusable, server-driven list/table/filter and accessible modal work only where needed; retain preexisting component public APIs.
- Stage 03: full Customers vertical slice; route-guarded, real useCustomers, correct server semantics, legacy feature parity before any replacement.
- Stages 04+: Services, Warehouse, Statistics, Calendar, Settings, Communications in separate plans after pilot acceptance.

## Acceptance gates

- RED -> GREEN -> REFACTOR per task; Jest/Testing Library coverage for new behavior and failures.
- Full project lint, typecheck, test, build and the exact-SHA CI. Browser QA at 390, 768, 1366/1440, keyboard/focus, empty/error/loading and no horizontal overflow; a screenshot alone is not functional proof.
- Accessibility **target** WCAG 2.2 AA (not certification); review applicable keyboard, focus, color contrast and reflow criteria against actual rendered UI.
- Deploy exact green SHA only to panel/staging after workflow gating. Verify APP_RELEASE exact SHA, HTTP 200, anonymous Basic-gateway probe, and logged-in DEV routes. No production deploy or master merge.
- Owner approves visuals and business workflows on DEV before replacing existing routes.

## Evidence and references

- Existing code: apps/panel/src/pages/studio-v18.tsx, apps/panel/src/styles/StudioV18.module.css, apps/panel/src/components/{DataTable,Modal}.tsx, apps/panel/src/components/ui/, apps/panel/src/components/salon/, apps/panel/src/pages/customers/index.tsx.
- TanStack Table official [server pagination](https://tanstack.com/table/latest/docs/framework/react/guide/pagination) and [server sorting](https://tanstack.com/table/latest/docs/framework/react/guide/sorting): server owns operations when supplying only a page.
- Radix [Dialog](https://www.radix-ui.com/primitives/docs/components/dialog): a possible implementation primitive for focus trap/keyboard behavior; not a mandate to install.
- W3C [WCAG 2.2](https://www.w3.org/TR/WCAG22/) is a reference target; our application-specific requirements above are policy/design choices, not asserted legal obligations.
