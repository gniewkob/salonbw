# SalonBW V18 Foundation & Customers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Ship a safe, reusable V18 foundation and then a fully functional customer-management pilot on DEV, preserving operational behavior and permissions.

**Architecture:** Start with a style-scoped V18 component showcase reusing existing PanelButton, PanelTable, StatusBadge and EmptyState, protected by the same DEV-only + role requirements as the existing /studio-v18 route. Subsequently extract shared primitives and implement Customers as a real API-backed vertical slice; retain original pages until explicit approval. No global CSS reset and no new API.

**Tech Stack:** Next.js 15 Pages Router, React 18, TypeScript, Bootstrap 5, CSS Modules, React Query, Jest + Testing Library, Playwright; add Radix/TanStack Table only after a verified gap and dependency compatibility review.

**Spec:** docs/superpowers/specs/2026-11-05-salonbw-design-system-design.md

## Global Constraints

- Exact baseline: b2a89502fbcf626c59eae5da581e096df66fdf4b, Studio V18 already available in DEV /studio-v18.
- Only isolated feature branch, Draft PR, and DEV panel/staging deployments of exact green SHAs. Never merge to master or deploy production without owner approval.
- DEV-only routes must retain SSR exact-host/environment guard, RouteGuard role and permission gates, existing app session and bounded Basic Auth rules.
- No live client data in fixture screenshot artifacts. Do not alter customer API, business validations, consent handling or backend policies.
- Reuse existing components/services before adding packages. Never apply V18 tokens to body, :root, Bootstrap or legacy routes.
- Copy and labels in Polish; document when a preview feature is unavailable and offer a working legacy link instead.
- TDD: reproduce RED, GREEN, refactor; independent review and full exact-SHA verification. No claims of tests until logs prove them.

## Review Focus (failure classes that need tests)

1. A non-admin or logged-out user attempts /studio-v18/components or /studio-v18/customers: reject without displaying client data (Task 2/Task 5).
2. V18 CSS unintentionally restyles the original /customers or /calendar: scoped CSS/visual regression before/after (Task 2/Task 6).
3. Customer search+server sort changes while viewing page N: reset page=1, request sorted complete dataset via API, never sort just loaded page (Task 4).
4. New customer modal detects a duplicate, validation fails, or API save fails: preserve existing flow and show error, no duplicate mutation (Task 5).
5. Browser with 320–390px width or keyboard-only navigation: no horizontal overflow, visible focus, operable table controls/action menus, dialogs trap focus (Task 3/Task 6).

---

## Delivery 1: Foundation and showcase (independently deployable)

### Task 1: Baseline inventory and design decision record

**Files:**
- Create: docs/superpowers/specs/2026-11-05-salonbw-design-system-design.md
- Create: docs/superpowers/plans/2026-11-05-salonbw-v18-foundation-customers.md
- Create: docs/design-system/V18_COMPONENT_INVENTORY.md

**Interfaces:**
- Consumes: current customers, calendar, component and navigation files.
- Produces: provenance, exact acceptance matrix and a list of existing controls to reuse.

- [ ] Step 1: Record existing SalonShell, PanelButton, PanelTable, Modal, customer CRUD and list API semantics (including filter and group operations) with file pointers.
- [ ] Step 2: Record V18 colors, typography, protected routes, and current Playwright screenshot baseline.
- [ ] Step 3: Mark dependencies as **adopt / adapt / revisit**; avoid adding new packages in Delivery 1.
- [ ] Step 4: Commit docs and check that only feature branch changed.

### Task 2: Scoped V18 foundation + route protection

**Files:**
- Create: apps/panel/src/styles/V18Foundation.module.css
- Create: apps/panel/src/pages/studio-v18/components.tsx
- Test: apps/panel/src/__tests__/studioV18Components.test.tsx

**Interfaces:**
- Consumes: PanelButton, PanelTable, StatusBadge, EmptyState, existing RouteGuard.
- Produces: a DEV-only, admin-only components preview, with zero customer API reads.

- [ ] Step 1: Write a failing Jest/Testing Library test rendering the catalog and asserting **"Biblioteka komponentów V18"**, two functional buttons, a labeled demo table and empty/error/loading states. Assert only synthetic fixture rows.
- [ ] Step 2: Run exact Jest test in isolated feature CI and record the expected failure (missing page/labels).
- [ ] Step 3: Implement page with <RouteGuard roles={['admin']}>, a getServerSideProps guard copying the existing strict /studio-v18 host/env allowlist, and scoped CSS tokens. No shortcuts around authentication.
- [ ] Step 4: Rerun Jest; ensure 0 failed. Verify no client data fetch in catalog.
- [ ] Step 5: Commit and validate lint + typecheck + build.

### Task 3: Catalog interaction and responsive evidence

**Files:**
- Modify: apps/panel/src/pages/studio-v18/components.tsx
- Modify: apps/panel/src/styles/V18Foundation.module.css
- Test: apps/panel/tests/visual/studio-v18-components.spec.ts
- Review: apps/panel/playwright.config.ts (do not weaken its real-host security checks).

**Interfaces:**
- Consumes: catalog route from Task 2.
- Produces: browser-tested accessible component examples, screenshots using synthetic data.

- [ ] Step 1: Write Playwright tests for keyboard focus, button actions, 390/768/1366/1440px no horizontal overflow, and form labels.
- [ ] Step 2: Run RED locally against the unfinished state; fix only relevant failures.
- [ ] Step 3: Add missing states of controls, meaningful interactions and mobile layout without new backend calls.
- [ ] Step 4: Run tests and inspect screenshots for both overflow and hierarchy. Mark Safari as NOT TESTED if WebKit is unavailable.
- [ ] Step 5: Commit, review exact diff, full CI.

### Gate A: DEV foundation review

- [ ] Exact-SHA CI PASS; no leaked secrets, no dependency installation, no master merge.
- [ ] Exact SHA deployed to panel staging using existing workflow and approved process.
- [ ] HTTP 200 and release SHA verification; anonymous /auth/login and /studio-v18/components gateway tests; admin authenticated checks.
- [ ] Owner visually reviews /studio-v18/components (desktop and mobile). Preserve existing /studio-v18 and /customers unchanged.

## Delivery 2: Data list primitives (separate checkpoint)

### Task 4: Server-driven V18 customer list control

**Files:**
- Create: apps/panel/src/components/v18/V18CustomerTable.tsx
- Create: apps/panel/src/components/v18/V18CustomerToolbar.tsx
- Create: apps/panel/src/utils/v18CustomerQuery.ts
- Test: apps/panel/src/__tests__/v18CustomerQuery.test.ts
- Test: apps/panel/src/__tests__/V18CustomerTable.test.tsx

**Interfaces:**
- Consumes: Customer and CustomerFilterParams from existing @/types, useCustomers() from @/hooks/useCustomers and paginated response.
- Produces: controlled sortBy/sortOrder/page/pageSize/search callback contract; row actions and accessible headers; no client-side sort of a server page.

- [ ] Step 1: Write failing tests for page reset when search/sort/group changes, invalid page clamping, aria-sort and disabled Previous/Next at boundaries.
- [ ] Step 2: Run RED and record expected failures.
- [ ] Step 3: Implement a controlled presentation component and query-state helper; delegate all filtering/sorting/pagination to useCustomers API query.
- [ ] Step 4: Run GREEN; check empty (no rows) vs error vs loading vs server total; no accidental sorted-subset behavior.
- [ ] Step 5: Commit with TypeScript + Jest proof. No TanStack Table dependency by default. Evaluate it only if verified control complexity justifies change.

## Delivery 3: Customers vertical slice (separate checkpoint)

### Task 5: Functional /studio-v18/customers

**Files:**
- Create: apps/panel/src/pages/studio-v18/customers.tsx
- Create: apps/panel/src/styles/V18Customers.module.css
- Test: apps/panel/src/__tests__/studioV18Customers.test.tsx

**Interfaces:**
- Consumes: RouteGuard, useCustomers, useCustomerGroups, useAddGroupMembers, NewCustomerModal, EditCustomerModal, V18CustomerTable/Toolbar.
- Produces: role-safe, DEV-only, API-backed V18 list and create/edit/booking flows.

- [ ] Step 1: Write failing tests for admin-only access, real hook pagination+search, edit/create modal triggers, disabled mutation state and error handling.
- [ ] Step 2: Run RED, then reuse original hook/actions and existing modal components; preserve booking href, group membership, consents and validation.
- [ ] Step 3: Verify CSV/bulk group/newsletter/drag-and-drop feature parity. Until each passes, visibly link to original /customers instead of silently dropping the function.
- [ ] Step 4: Run full Jest, lint, typecheck/build, review privacy and authorization.
- [ ] Step 5: Commit; ensure the route never renders data without the existing backend-provided identity/roles.

### Task 6: Realistic browser acceptance for customer flows

**Files:**
- Test: apps/panel/tests/visual/studio-v18-customers.spec.ts
- Update: docs/design-system/V18_COMPONENT_INVENTORY.md (parity checklist)

**Interfaces:**
- Consumes: Deliveries 1–3.
- Produces: desktop/mobile/keyboard acceptance; production unaffected.

- [ ] Step 1: Test generated synthetic customers, server paged search and sorting across multiple pages (not single-page mock only).
- [ ] Step 2: Test create/edit (isolated synthetic DEV dataset only), error, duplicate warning, empty and retry, and authorized vs unauthorized accounts.
- [ ] Step 3: Test group operations, CSV and booking links against original behavior; confirm mobile list fit.
- [ ] Step 4: Run Playwright, inspect 390 and 1366 screenshots; verify zero horizontal overflow, no undisclosed personally identifiable screenshots.
- [ ] Step 5: Full exact-SHA CI and draft PR review; staging deployment only; owner approves Customers pilot before replacing /customers.

## Follow-on plans (not included in this implementation batch)

- Services + Warehouse: category/type filters, variants, stock actions and group/bulk operations.
- Statistics + Dashboard: reporting metrics with real date ranges and validated totals.
- Calendar + reception: preserve FullCalendar scheduling, modals, conflict resolution and mobile roles.
- Settings + Communication + secondary routes: shared components and role-safe navigation; clean duplication only after parity acceptance.
- Final rollout: dark launches where appropriate, routes migrated only upon explicit owner sign-off; archive experimental assets separately.

## Final checkpoints

- DONE means verified tests and exact SHA deployed to DEV **plus** owner acceptance for that module; successful CI alone means **READY FOR DEV**, not production-ready.
- Keep each release reversible. PR remains Draft until feature parity and browser acceptance are complete.
