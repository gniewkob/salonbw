# IMPLEMENTATION MATRIX

## Purpose

This file translates the Versum dump into an implementation-oriented matrix for the `panel.salon-bw.pl` agent.

Primary dump location:
- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

Primary comparison source:
- `docs/VERSUM_DUMP_ALIGNMENT_2026-03-17.md`

## Status Legend

- `exact`: route exists directly in `apps/panel/src/pages`
- `aliased`: route appears covered under a renamed or split route
- `missing`: route is visible in the dump but has no direct panel implementation yet
- `invent`: no reliable extraction path; build from agreed assumptions

## P1 Matrix

| Versum Route | Target In `salonbw` | Status | Dump Inputs | Agent Instruction |
|---|---|---|---|---|
| `/calendar/views` | new route under panel | `missing` | screenshot + route bundle if available from dump path family | implement as missing calendar management view |
| `/communication/:id` | likely `communication/:id` | `missing` | communication screenshots, route bundles, responses | create detail view for communication records |
| `/services/new` | likely `services/new` | `missing` | services screenshots + HTML patterns from list/detail/new flows | build create form from existing service patterns |
| `/settings/branch` | likely `settings/branch` | `missing` | settings screenshot + route bundle + responses | create branch settings view |
| `/settings/calendar` | likely `settings/calendar` | `missing` | settings screenshot + route bundle + responses | create calendar settings view |
| `/settings/customer_groups` | likely `settings/customer_groups` | `missing` | dump + existing customer group work in panel | connect existing logic into dedicated settings route |
| `/settings/customer_groups/new` | likely modal or route | `missing` | dump + modal patterns | build create flow from dump and existing customer-group UI |
| `/settings/employees/activity_logs` | likely `settings/employees/activity_logs` | `missing` | route bundle + responses | implement employee activity logs |
| `/settings/payment_configuration` | likely `settings/payment_configuration` | `missing` | route bundle + responses | implement payment settings UI |
| `/settings/sms` | likely `settings/sms` | `missing` | route bundle + existing sms components | expose SMS settings route |
| `/settings/timetable/employees` | likely `settings/timetable/employees` | `missing` | route bundle + worktime/timetable assets | implement employee timetable management |
| `/settings/timetable/templates` | likely `settings/timetable/templates` | `missing` | route bundle + timetable patterns | implement timetable templates |
| `/helps/new` | likely help/contact entry inside panel | `missing` | route bundle + screenshot | implement support/help form |

## P2 Matrix

| Versum Route | Target In `salonbw` | Status | Dump Inputs | Agent Instruction |
|---|---|---|---|---|
| `/event_reminders` | likely reminders module | `missing` | route bundle + responses | implement reminder management if product scope requires it |
| `/settings/categories` | likely dedicated settings categories route | `missing` | route bundle + modal/category dump | build from existing category modal logic |
| `/settings/categories/new` | route or modal | `missing` | dump + category modal patterns | prefer modal if consistent with current architecture |
| `/settings/customer_origins` | likely dedicated route | `missing` | route bundle + responses | implement customer origins config |
| `/settings/customer_panel/settings` | likely dedicated route | `missing` | route bundle + screenshot | implement customer panel settings |
| `/settings/data_protection` | likely dedicated route | `missing` | route bundle + responses | implement compliance/data protection settings |
| `/settings/employees/:id` | route family | `missing` | employee route bundles | create employee profile screens |
| `/settings/employees/:id/edit` | route family | `missing` | employee route bundles | create employee edit screens |
| `/settings/employees/:id/events_history` | route family | `missing` | route bundle + responses | create employee event history view |
| `/settings/employees/commissions` | route family | `missing` | dump + statistics/worktime/commission references | define proper commission settings surface |
| `/settings/employees/new` | route family | `missing` | dump + employee form conventions | create new employee flow |
| `/settings/extra_fields` | route | `missing` | route bundle + responses | implement custom fields settings |
| `/settings/timetable/branch` | route | `missing` | timetable route bundle | implement branch timetable settings |
| `/settings/timetable/employees/:id` | route family | `missing` | route bundle | implement per-employee timetable |
| `/settings/timetable/employees/copy` | route | `missing` | route bundle | implement copy timetable utility |
| `/settings/trades/new` | route | `missing` | route bundle | implement if still domain-relevant |

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
