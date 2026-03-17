# HANDOFF FOR PANEL AGENT

## Purpose

This handoff is for the agent building the Versum clone target:
- target panel: `panel.salon-bw.pl`
- source reference: offline Versum dump and research bundle

The panel clone is only one part of the product.
Separate systems also exist:
- landing service
- API service

## Source Of Truth

Use this dump as the primary offline reference:

- dump root:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

- most important files:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/README.md`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/ia-summary.md`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/report.json`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/bundle-manifest.json`

- most important directories:
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/routes`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/screens`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/assets`
  - `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200/bundle/downloads`

## Required Reading Order

Before implementing anything:

1. Read:
   - `docs/VERSUM_DUMP_ALIGNMENT_2026-03-17.md` ← route coverage map + P1/P2/P3 gap list
2. Read:
   - `docs/IMPLEMENTATION_MATRIX.md` ← route-level backlog (exact / aliased / missing)
3. Read:
   - `docs/INVENTED_BEHAVIOR.md` ← what is reconstructed vs invented
4. Read:
   - `docs/VERSUM_CLONING_STANDARD.md` ← mandatory SOP (copy-first → integration → parity)
5. Read:
   - `docs/AGENT_EXECUTION_PLAYBOOK.md` ← how the implementation agent should optimize its work
6. Read:
   - `docs/ROUTE_INDEX.json` ← route families, priorities and direct dump artifact pointers
7. Read:
   - `docs/UI_PATTERN_CATALOG.md` ← reusable UI patterns to build before screens
8. Read:
   - `docs/DOMAIN_SCHEMA_INVENTORY.md` ← entity, field and relation inventory guidance
9. Then open the Versum dump:
   - `.../ia-summary.md`
   - `.../bundle/bundle-manifest.json`

Do not start coding from memory or from assumptions when route-level evidence already exists in the dump.

## How To Use The Dump

For each route/module:

1. Find the route in `docs/IMPLEMENTATION_MATRIX.md`.
2. Check whether the route is:
   - `exact`
   - `aliased`
   - `missing`
3. Open the matching screenshot in:
   - `.../bundle/screens`
4. Open the matching route bundle in:
   - `.../bundle/routes/<slug>/`
5. Use:
   - `page.html` for DOM/layout structure
   - `network.json` for request/response inventory
   - `responses/` for JSON payload examples
6. Only if necessary, inspect:
   - `.../bundle/assets`

## Rules For The Agent

- Prefer reconstructing behavior from:
  - screenshots
  - page HTML
  - route-level network captures
  - saved response payloads
- Prefer implementing according to current `salonbw` architecture, not by mimicking Versum internals line-by-line.
- When a route exists in `salonbw` under a renamed path, treat it as an alias, not as a missing module.
- When behavior cannot be confidently extracted from the dump, mark it as `invented` and follow `docs/INVENTED_BEHAVIOR.md`.

## What Not To Do

- Do not reconnect to Versum unless explicitly requested.
- Do not treat KSeF or Booksy flows as required implementation scope.
- Do not infer hidden backend logic from UI alone when the dump does not prove it.
- Do not block progress on missing parity if the missing piece is explicitly classified as `invented`.

## Excluded Scope

Out of scope:
- KSeF-specific accounting flows
- Booksy integration
- Booksy migration / conversion flows

## Deliverable Standard

For each implemented route or module, the agent should be able to answer:

- Which Versum route is this based on?
- Which dump artifacts were used?
- Is this route:
  - reconstructed from evidence
  - aliased from an existing route
  - invented because the source does not expose enough behavior?

If that answer is unclear, the implementation is not yet ready.
