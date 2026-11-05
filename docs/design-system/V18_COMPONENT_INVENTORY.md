# V18 Component Inventory and Preservation Matrix

**Source baseline:** b2a89502fbcf626c59eae5da581e096df66fdf4b  
**Purpose:** avoid building a second, disconnected UI kit and establish behavioral regression obligations.  
**State:** source inspection only; screenshots and browser acceptance are tracked separately.

## Component decisions

| Existing component | Path | V18 decision | Rationale and check |
|---|---|---|---|
| SalonShell / SalonShellMobile | components/salon/ | Adapt after admin pilot | Main navigation, secondary routes, role-dependent framing; preserve native mobile paths. |
| navigation.ts | components/salon/ | Reuse | Authoritative module registry and permission metadata; no parallel permission map. |
| RouteGuard | components/RouteGuard.tsx | Reuse, do not bypass | Authenticated, roles and granular permission decisions. Backend still authoritative. |
| PanelButton | components/ui/PanelButton.tsx | Reuse with scoped V18 surface styling | Already accepts variant/size, icon, href or button and safe type default. |
| PanelTable | components/ui/PanelTable.tsx | Reuse semantic skeleton only | Basic thead/tbody and empty state, no controlled server sort/filter/pagination; avoid inventing them. |
| DataTable | components/DataTable.tsx | Not for Customers server table | Internal search and client sorting/pagination over loaded data; incorrect for server pages. |
| StatusBadge | components/ui/StatusBadge.tsx | Reuse | Existing tones success/info/neutral/attention/danger; V18 may restyle under boundary. |
| EmptyState | components/ui/EmptyState.tsx | Reuse | Already supports icon, text, action; ensure empty vs error distinctions in consumers. |
| Modal and PanelModal | components/{Modal.tsx,ui/PanelModal.tsx} | Reuse existing flows; revisit focus management | Current modal is closable by Escape but code does not implement a demonstrated focus trap or focus return. Radix only after verified gap. |
| NewCustomerModal, EditCustomerModal | components/customers/ | Reuse | Existing duplicate checking, hooks, validation, edit/delete confirmation. |
| useCustomers | hooks/useCustomers.ts | Reuse | Query key and API request include filters; paged API owns search/sort/pagination. |
| CalendarView and reception components | components/calendar/ | Preserve unchanged in pilot | Scheduling is a complex independent workflow, not a themed table. |
| Recharts | package installed | Reuse | Already powers Studio V18 and statistics; no new chart dependency. |

## Customer route preservation checklist

Original: apps/panel/src/pages/customers/index.tsx

- Search debounced 250ms; useCustomers({search,limit,page,sortBy,sortOrder}) applies server-side.
- Filters: group, tag, service, employee, upcoming visit, no visit since, newly added, communication consents.
- Multi-select with group bulk addition; newsletter handoff and CSV export.
- Drag/drop customer into groups using existing dnd-kit.
- Desktop table and mobile accumulated/infinite-scroll presentation.
- Client navigation /customers/:id, booking /calendar?newClient=..., edit in modal, new customer modal.
- Page changes and filter changes clear/reset selection appropriately. Group/consent modifications use existing APIs.
- RouteGuard roles employee/receptionist/admin and permission nav:customers.

**Pilot strategy:** use original page as feature-parity fallback until every item is validated. Never claim a full replacement while one capability still requires the old page.

## Initial V18 token snapshot

| Semantic role | Reference | Usage |
|---|---|---|
| canvas | #f5f3f8 | V18 preview background only |
| paper | #ffffff | cards, table surfaces |
| ink | #292733 | body/headings |
| secondary | #6b6471 | normal-size secondary text (calculate actual contrast in browser) |
| border | #eeeaf1 | cards/dividers |
| lavender | #d9cdf7 | accents/welcome |
| accent | #8069cf | interactive emphasis; focus outline |
| font | Inter/system sans stack | panel preview only; no global font override |

## Release/QA evidence

- DEV V18 baseline deployed and release SHA verified by GitHub Actions 41992481669 on 2026-11-05.
- Prior synthetic V18 browser QA 41935852581: 6/6 PASS on desktop 1366, 1920 and Chromium mobile 390. This is not a new design-system test.
- For every new component or route: capture current behavior, RED/GREEN test results, exact SHA, CI and authorized DEV evidence. No customer PII in recorded images.

## Adoption rule

Dependency introduction is a separate review: use the smallest accessible primitive that fills a confirmed gap; validate React 18/Next 15 SSR, CSS isolation, keyboard, focus return, peer dependencies and bundle. @tanstack/react-table is not assumed installed. Tailwind and full shadcn styling are **not** blanket requirements.
