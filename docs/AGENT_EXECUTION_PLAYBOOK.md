# Agent Execution Playbook for the Versum Clone

This document defines the most efficient working mode for the agent building `panel.salon-bw.pl` from the offline Versum reconstruction package.

## Primary sources

Use these sources in this order:

1. [`HANDOFF_PANEL_AGENT.md`](./HANDOFF_PANEL_AGENT.md)
2. [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md)
3. [`INVENTED_BEHAVIOR.md`](./INVENTED_BEHAVIOR.md)
4. [`DECISION_VERSUM_CLONE_STRATEGY.md`](./DECISION_VERSUM_CLONE_STRATEGY.md)
5. Offline dump package: `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

Inside the dump package, use:

- `bundle/routes/` for route-level HTML, requests, responses and inline config
- `bundle/screens/` for visual parity
- `bundle/assets/` for JS/CSS/images/fonts references
- `bundle/downloads/` for export artifacts
- `ia-summary.md` for IA and route importance
- `report.json` for popup and pattern analysis

## Golden rule

Work `route-pack first`, not `repo first`.

Do not start from broad exploration of the whole `salonbw` codebase.
Start from one target route, load the corresponding dump artifacts, then implement that route in the correct place in `apps/panel`.

## Execution loop per route

For every route, follow this sequence:

1. Pick the next route from [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md).
2. Identify its priority: `P1`, `P2`, `P3`, `excluded`, `invent`.
3. Open the matching route pack in the dump.
4. Review:
   - screenshot
   - `page.html`
   - `network.json`
   - saved responses
   - inline config if present
5. Map the route to the existing `salonbw` location in `apps/panel`.
6. Implement the UI and navigation parity first.
7. Implement data contracts based on observed requests and responses.
8. Add standard states:
   - loading
   - empty
   - error
9. Mark the route explicitly as:
   - `reconstructed`
   - `invented`
   - `excluded`
10. Only then move to the next route.

## Recommended module order

Build by modules, not by random screens.

Recommended sequence:

1. shell, layout, topbar, main nav, secondary nav
2. calendar
3. customers
4. services
5. products and inventory
6. communication
7. statistics
8. settings
9. extensions and lower-priority utilities

This reduces context switching and allows reusable patterns to pay off quickly.

## Build patterns before screens

Do not build every screen from scratch.
First build reusable panel primitives and page templates:

- topbar pattern
- sidebar pattern
- module secondary navigation
- data table pattern
- detail header pattern
- create/edit form pattern
- modal pattern
- filters/search bar
- notification/alert bar
- empty/loading/error states

Then compose screens from those patterns.

## Use the dump correctly

Use each artifact for a specific purpose:

- screenshot: spacing, density, action placement, hierarchy, parity check
- `page.html`: DOM structure, labels, sections, actions, field ordering
- `network.json`: route behavior, payload direction, request timing, dependencies
- saved responses: field names, enums, relation shape, table columns, detail payloads
- assets: icon names, CSS class clues, screen-level bundles

Do not use minified JS bundles as the main implementation source.
They are fallback evidence only.

## Reconstructed vs invented

Use `reconstructed` when the behavior is observable in:

- dump HTML
- screenshots
- request/response captures
- public help center behavior descriptions

Use `invented` when the behavior is not reliably observable.

Typical `invented` areas:

- hidden backend rules
- permissions matrix
- background jobs
- rare edge cases
- complete validation rules
- async side effects after save
- areas outside captured flows

When something is invented, do not guess hidden Versum internals.
Use `salonbw` domain rules and standard product assumptions.

## What not to do

Avoid these inefficient patterns:

- reverse-engineering minified bundles for long periods
- trying to reproduce Versum architecture 1:1
- implementing scattered routes across many modules at once
- delaying core work because of missing edge cases
- inventing backend logic before UI and contracts are stabilized
- treating screenshots as inspiration instead of verification

## Definition of done per route

A route is done only when all of the following are true:

- layout parity is present
- navigation parity is present
- primary actions are present
- key data bindings are implemented
- loading, empty and error states exist
- route status is marked as `reconstructed`, `invented`, or `excluded`
- scope exclusions are respected

## Scope exclusions

These are out of scope and should not be cloned:

- KSeF and accounting invoice workflows
- Booksy integration
- Booksy migration and conversion flows

## Practical optimization rule

If a route is blocked by missing hidden behavior:

1. finish the visible UI
2. finish the observable data contract
3. mark the missing logic as `invented`
4. move forward

Do not block core module delivery on hidden behavior that cannot be extracted from Versum.
