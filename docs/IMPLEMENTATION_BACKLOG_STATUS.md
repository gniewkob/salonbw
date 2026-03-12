# Implementation Backlog Status

_Last updated: 2026-03-12_

This file tracks the current status of the AI-ready implementation backlog against the repository state.

## Closed in Code

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

- Status: implemented locally, not deployed yet
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
- Deployment requirement:
  - requires running migration `1760105000000-AddWarehouseSaleReversalFlow.ts`
