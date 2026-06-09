# Implementation Backlog Status

_Last updated: 2026-06-09_

This file tracks the current status of the AI-ready implementation backlog against the repository state.

## Closed in Code

### 2026-06-09. Route integrity + calendar time-block hardening

- Status: implemented locally, pending push/deploy
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
