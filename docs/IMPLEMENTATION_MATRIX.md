# IMPLEMENTATION MATRIX

## Purpose

This file translates the Versum dump into an implementation-oriented matrix for the `panel.salon-bw.pl` agent.

Primary dump location:
- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

Primary comparison source:
- `docs/VERSUM_DUMP_ALIGNMENT_2026-03-17.md`

## Status Legend

- `exact`: route is implemented and the main visible flow works without dead primary actions
- `aliased`: route is covered under a renamed canonical route or redirect
- `invent`: route exists, but some visible behavior is reconstructed without full backend parity
- `excluded`: route family is intentionally out of scope for this clone phase

## P1 Matrix

| Versum Route | Target In `salonbw` | Status | Dump Inputs | Agent Instruction |
|---|---|---|---|---|
| `/calendar/views` | `/calendar/views` | `invent` | screenshot + route bundle + live UX check | route-driven modal clone now uses persisted backend CRUD, and vendored `/calendar` now receives dedicated HTML partials for views/list/index/form; remaining delta is still the adapted SalonBW partial contract rather than a literal legacy copy |
| `/communication/:id` | `/communication/[id]` | `invent` | communication screenshots, route bundles, responses | detail route now opens deterministically with explicit SMS/email kind and builds SMS/email history threads from persisted recipient logs, but still lacks a dedicated conversation model matching legacy Versum 1:1 |
| `/services/new` | `/services/new` | `adapted` | services screenshots + HTML patterns from list/detail/new flows + live panel/network inspection | create route now covers photos upload, recipe save and extra-time persistence; upload now sends/accepts legacy `Filedata` + `gallery_id`, while remaining delta is visual polish plus salonbw-native storage/endpoint semantics |
| `/settings/branch` | `/settings/branch` | `exact` | settings screenshot + route bundle + responses | branch settings route and legacy alias are covered |
| `/settings/calendar` | `/settings/calendar` | `exact` | settings screenshot + route bundle + responses | calendar settings save through backend |
| `/settings/customer_groups` | `/settings/customer_groups` | `exact` | dump + existing customer group work in panel | list/reorder route implemented |
| `/settings/customer_groups/new` | `/settings/customer_groups/new` | `exact` | dump + modal patterns | create flow implemented |
| `/settings/employees/activity_logs` | `/settings/employees/activity-logs` | `exact` | route bundle + responses | canonical kebab-case route + legacy underscore aliases covered |
| `/settings/payment_configuration` | `/settings/payment-configuration` | `exact` | route bundle + responses | deactivated Moment Pay view matches dump and primary activation/prepayment settings now save through backend |
| `/settings/sms` | `/settings/sms` | `exact` | route bundle + existing sms components | SMS settings save through backend |
| `/settings/timetable/employees` | `/settings/timetable/employees` | `exact` | route bundle + worktime/timetable assets | weekly overview now routes into the per-employee month view and timetable editing/exception flows are covered |
| `/settings/timetable/templates` | `/settings/timetable/templates` | `exact` | route bundle + timetable patterns | template list + add/rename/delete now persist through dedicated backend resource |
| `/helps/new` | `/helps/new` | `exact` | route bundle + screenshot | support/help form implemented |

## P2 Matrix

| Versum Route | Target In `salonbw` | Status | Dump Inputs | Agent Instruction |
|---|---|---|---|---|
| `/event_reminders` | `/event-reminders` | `exact` | route bundle + responses | canonical route restored; edit flow saves through reminder settings backend |
| `/settings/categories` | `/settings/categories` | `exact` | route bundle + modal/category dump | list-level CRUD now covers edit/delete/add-subcategory and persisted reorder/save-order through backend |
| `/settings/categories/new` | `/settings/categories/new` | `exact` | dump + category modal patterns | new category form posts to backend |
| `/settings/customer_origins` | `/settings/customer-origins` | `exact` | route bundle + responses | list, add, edit, and delete flows are covered; system origins stay read-only as in the dump |
| `/settings/customer_panel/settings` | `/settings/customer-panel` | `aliased` | route bundle + screenshot | covered by redirect to customer-panel/online-booking surface |
| `/settings/data_protection` | `/settings/data-protection` | `exact` | route bundle + responses | global paranoia settings persist via BranchSettings, per-employee limit overrides persist on users, and the logs route now has its own customer-settings activity screen instead of a raw employee-log re-export |
| `/settings/employees/:id` | `/settings/employees/[id]` | `exact` | employee route bundles | employee profile screens implemented |
| `/settings/employees/:id/edit` | `/settings/employees/[id]/edit` | `exact` | employee route bundles | employee edit screens implemented |
| `/settings/employees/:id/events_history` | `/settings/employees/[id]/events-history` | `exact` | route bundle + responses | event history implemented under canonical kebab-case |
| `/settings/employees/commissions` | `/settings/employees/commissions` | `exact` | dump + statistics/worktime/commission references | commissions routes implemented |
| `/settings/employees/new` | `/settings/employees/new` | `exact` | dump + employee form conventions | new employee form posts to backend |
| `/settings/extra_fields` | `/settings/extra-fields` | `exact` | route bundle + responses | backend CRUD now includes select-field options and the panel exposes full field-type editing |
| `/settings/timetable/branch` | `/settings/timetable/branch` | `exact` | timetable route bundle + existing `branches.workingHours` model | weekly branch opening-hours form now persists through the active branch backend, including multi-range day editing with backward-compatible JSON storage |
| `/settings/timetable/employees/:id` | `/settings/timetable/employees/[id]` | `exact` | route bundle | per-employee timetable implemented |
| `/settings/timetable/employees/copy` | `/settings/timetable/employees/copy` | `exact` | route bundle | copy flow now creates real target timetables by cloning the source employee's active weekly schedule for the selected date range |
| `/settings/trades/new` | `/settings/trades/new` | `exact` | route bundle + existing `service-categories` backend | route now creates real service categories/branches and redirects into the services area instead of remaining a disabled stub |

## P3 / Edge Matrix

| Versum Route | Target In `salonbw` | Status | Dump Inputs | Agent Instruction |
|---|---|---|---|---|
| `/credential/accounts/edit` | unknown | `invent` | only error page observed | do not chase parity unless product requires it |
| `/customer_magnets/:id` | unknown marketing feature | `invent` | sparse dump evidence | define only if product scope includes it |
| `/settings/card_numbering` | dedicated settings route | `missing` | route bundle | low priority, implement later |
| `/settings/moment_premium/dashboard/configuration` | premium integration area | `invent` | sparse evidence | likely out of immediate MVP scope |
| `/settings/partner/messages` | 404 in dump | `invent` | invalid route evidence only | do not implement from dump as-is |
| `/social/facebook` | social integration | `missing` | route bundle | implement only if social module remains in scope |
| `/social/twitter` | social integration | `missing` | route bundle | same as above |
| `/social_posts` | social content route | `missing` | route bundle | implement only if product needs it |
| `/test_groups` | segmentation/testing | `missing` | route bundle | low-value route unless marketing module depends on it |

## Existing Strong Areas

These modules already have a strong base and should usually be extended, not reinvented:

- customers
- products / inventory
- statistics
- communication base module
- services base module
- extension base module
- Versum shell / nav / topbar / SVG system

## Required Agent Workflow

For every row marked `missing`:

1. Open the dump path:
   - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`
2. Read:
   - `ia-summary.md`
   - `bundle/bundle-manifest.json`
3. Find matching screenshot(s).
4. Find matching route bundle(s).
5. Use `network.json` and `responses/` to infer:
   - required data
   - form fields
   - table columns
   - filters
   - empty states
6. If the dump does not provide enough proof, consult `docs/INVENTED_BEHAVIOR.md`.

## Required Output From The Agent

For every implementation PR or patch, the agent should explicitly note:

- source Versum route
- target `salonbw` route
- dump artifacts used
- whether any part was invented
