# Versum Dump Alignment - 2026-03-17

## Context

Reference source:
- offline Versum research package: `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`
- target clone: `panel.salon-bw.pl`
- related but separate systems:
  - landing service
  - API service

This document compares the current `apps/panel` implementation in `salonbw` against the captured Versum dump and bundle.

## Executive Summary

Current panel state is materially advanced, but not yet route-complete against the Versum snapshot.

High-level comparison against the dump route inventory:
- exact route coverage: `20`
- functional/renamed route coverage: `23`
- missing route coverage: `39`

Interpretation:
- the project already covers the main modules and several important subflows
- route naming in `salonbw` intentionally diverges in some places (`reviews`, `invoices`, `inventory`, `orders`, `use`, etc.)
- the largest current gap is still in the `settings` area and several communication/detail subviews

## What Already Exists In `salonbw`

Confirmed from `apps/panel/src/pages`:
- main modules:
  - `/calendar`
  - `/customers`
  - `/products`
  - `/statistics`
  - `/communication`
  - `/services`
  - `/settings`
  - `/extension`
- customer core flows:
  - `/customers`
  - `/customers/:id`
  - `/customers/:id/edit`
  - `/customers/new`
- warehouse/inventory split into several routes:
  - `/products`
  - `/inventory`
  - `/orders`
  - `/deliveries`
  - `/use`
  - `/sales`
  - `/stock-alerts`
  - `/suppliers`
  - `/manufacturers`
- statistics routes:
  - `/statistics`
  - `/statistics/employees`
  - `/statistics/register`
  - `/statistics/services`
  - `/statistics/customers/origins`
  - `/statistics/customers/returning`
  - `/statistics/tips`
  - `/statistics/warehouse/changes`
  - `/statistics/warehouse/value`
  - `/statistics/worktime`
- communication/reviews variants:
  - `/communication`
  - `/communication/mass`
  - `/communication/reminders`
  - `/communication/templates`
  - `/reviews`
  - `/emails`
  - `/notifications`
- extensions:
  - `/extension`
  - `/extension/tools/:id`

Supporting clone infrastructure also already exists:
- `VersumShell`
- `VersumMainNav`
- `VersumSecondaryNav`
- `PajaxLoader`
- SVG/icon system
- vendor/calendar assets in `apps/panel/public/versum-calendar`

## Route Mapping

### Exact Matches

These Versum routes exist directly or nearly directly in `apps/panel/src/pages`:

- `/calendar`
- `/communication`
- `/customers`
- `/customers/:id`
- `/customers/:id/edit`
- `/customers/new`
- `/deliveries/new`
- `/extension`
- `/extension/tools/:id`
- `/orders/new`
- `/products`
- `/products/:id`
- `/products/new`
- `/services`
- `/services/:id`
- `/settings`
- `/statistics/employees`
- `/statistics/register`
- `/statistics/services`
- `/use/new`

### Covered Under Renamed / Split Routes

These Versum routes appear functionally represented, but not under identical route structure:

- `/` -> `/dashboard`
- `/invoicing/invoices` -> `/invoices`
- `/messages` -> `/emails` or `/communication`
- `/newsletters` -> `/communication`
- `/newsletters/new` -> `/communication/mass`
- `/opinions/communication` -> `/reviews`
- `/opinions/employees/:id` -> `/employees`
- `/opinions/settings` -> `/reviews` or `/settings`
- `/opinions/statistics` -> `/statistics/comments/moment`
- `/opinions/statistics_booksy` -> `/statistics/comments/booksy`
- `/product_orders` -> `/orders`
- `/products/price_statistics` -> `/statistics/warehouse/value`
- `/products/report` -> `/statistics/warehouse/changes`
- `/reports/commissions` -> `/statistics/commissions`
- `/settings/employees` -> `/employees`
- `/settings/employees/commissions/:id` -> `/products/commissions/:id`
- `/settings/timetable/summary` -> `/statistics/worktime`
- `/statistics/customer_origins` -> `/statistics/customers/origins`
- `/statistics/dashboard` -> `/statistics`
- `/statistics/employees/returning_customers` -> `/statistics/customers/returning`
- `/stocktakings` -> `/stock-alerts`
- `/tips/statistics` -> `/statistics/tips`
- `/products` family also partly split across `/inventory`, `/orders`, `/deliveries`, `/use`, `/sales`

### Missing Against The Captured Dump

These routes are visible in the Versum dump but do not currently appear as panel routes in `apps/panel/src/pages`:

- `/calendar/views`
- `/communication/:id`
- `/credential/accounts/edit`
- `/customer_magnets/:id`
- `/event_reminders`
- `/helps/new`
- `/services/new`
- `/settings/branch`
- `/settings/calendar`
- `/settings/card_numbering`
- `/settings/categories`
- `/settings/categories/new`
- `/settings/customer_groups`
- `/settings/customer_groups/new`
- `/settings/customer_origins`
- `/settings/customer_panel/settings`
- `/settings/data_protection`
- `/settings/employees/:id`
- `/settings/employees/:id/edit`
- `/settings/employees/:id/events_history`
- `/settings/employees/activity_logs`
- `/settings/employees/commissions`
- `/settings/employees/commissions/:id/edit`
- `/settings/employees/new`
- `/settings/extra_fields`
- `/settings/moment_premium/dashboard/configuration`
- `/settings/partner/messages`
- `/settings/payment_configuration`
- `/settings/sms`
- `/settings/timetable/branch`
- `/settings/timetable/employees`
- `/settings/timetable/employees/:id`
- `/settings/timetable/employees/copy`
- `/settings/timetable/templates`
- `/settings/trades/new`
- `/social/facebook`
- `/social/twitter`
- `/social_posts`
- `/test_groups`

## Most Important Gaps By Priority

### P1

These are the highest-value missing routes relative to the dump:

- `/calendar/views`
- `/communication/:id`
- `/services/new`
- `/settings/branch`
- `/settings/calendar`
- `/settings/customer_groups`
- `/settings/customer_groups/new`
- `/settings/employees/activity_logs`
- `/settings/payment_configuration`
- `/settings/sms`
- `/settings/timetable/employees`
- `/settings/timetable/templates`
- `/helps/new`

### P2

- `/event_reminders`
- `/settings/categories`
- `/settings/categories/new`
- `/settings/customer_origins`
- `/settings/customer_panel/settings`
- `/settings/data_protection`
- `/settings/employees/:id`
- `/settings/employees/:id/edit`
- `/settings/employees/:id/events_history`
- `/settings/employees/commissions`
- `/settings/employees/new`
- `/settings/extra_fields`
- `/settings/timetable/branch`
- `/settings/timetable/employees/:id`
- `/settings/timetable/employees/copy`
- `/settings/trades/new`

### P3 / Edge

- `/credential/accounts/edit`
- `/customer_magnets/:id`
- `/settings/card_numbering`
- `/settings/moment_premium/dashboard/configuration`
- `/settings/partner/messages`
- `/social/facebook`
- `/social/twitter`
- `/social_posts`
- `/test_groups`

## How The Dump Should Be Used In `salonbw`

Use the Versum bundle directly as an offline implementation reference:

- IA and scope:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/ia-summary.md`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/report.json`

- visual reconstruction:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/screens`

- route-level HTML and network:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/routes`

- JS/CSS/assets:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/assets`

- exported reporting artifacts:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/downloads`

## Recommended Next Actions In `salonbw`

1. Create a route parity backlog from the P1 list above.
2. For each P1 route, attach the matching `bundle/screens/*` screenshot and `bundle/routes/*/page.html`.
3. Use `bundle/routes/*/network.json` and `responses/` to reconstruct missing frontend data flows before inventing new API shapes.
4. Keep route naming consistent where possible; when not possible, explicitly document aliases in architecture docs.
5. Treat `KSeF` and `Booksy` as excluded project scope even if the dump contains those artifacts.

## Scope Reminder

Out of scope for the clone project:
- KSeF-specific accounting flows
- Booksy integration and migration/conversion flows

The panel clone target remains:
- `panel.salon-bw.pl`

The broader product still includes separate services:
- landing
- API
