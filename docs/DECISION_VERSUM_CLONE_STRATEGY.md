# Decision: Versum Clone Strategy for `panel.salon-bw.pl`

Date: 2026-03-17
Status: accepted

## Decision

The clone of the Versum panel to `panel.salon-bw.pl` should be built from an offline reconstruction package, not from ongoing live access to Versum.

The reconstruction package lives here:

- `/Users/gniewkob/Repos/Scrapling/output/versum-dump-200`

The implementation agent should use these documents first:

- [`HANDOFF_PANEL_AGENT.md`](./HANDOFF_PANEL_AGENT.md)
- [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md)
- [`INVENTED_BEHAVIOR.md`](./INVENTED_BEHAVIOR.md)

## Why this is the right strategy

- We already have a broad offline package with HTML, screenshots, request/response captures, JS/CSS assets and export files.
- This gives the implementation agent a stable source of truth without needing new live sessions against Versum.
- A live-only reverse-engineering workflow would be slower, less reproducible and would still not expose all internal backend logic.
- The package cleanly separates:
  - what can be reconstructed from observation
  - what must be designed or implemented natively in `salonbw`

## Public documentation findings

Publicly available Versum materials exist, but they are mainly end-user help articles, not technical implementation docs for the salon panel.

Useful public sources found:

- Versum support knowledge base with product behavior and screen-level flows:
  - Signing in: https://support.versum.com/support/solutions/articles/9442-signing-in-to-versum
  - Creating custom appointment book views: https://support.versum.com/support/solutions/articles/6000029996-creating-custom-views-in-the-appointment-book
  - Customer groups: https://support.versum.com/support/solutions/articles/6000057843-creating-editing-and-deleting-customer-groups
  - Google Calendar integration: https://support.versum.com/support/solutions/articles/9487-integration-with-google-calendar
  - Data export note: https://support.versum.com/support/solutions/articles/9452-can-i-export-my-data-
  - Online booking setup: https://support.versum.com/support/solutions/articles/9488-setting-up-online-booking-step-by-step

## What was not found publicly

No credible public evidence was found for:

- a public developer portal for the salon-management Versum panel
- official public API documentation for the salon-management product
- public schema docs for GraphQL or REST endpoints used by `panel.versum.com`
- public technical architecture docs for the internal frontend/backend of the panel

Inference:
The public web helps us understand behavior and product rules, but it does not replace the offline dump or give enough material to reproduce the panel technically end-to-end.

## Practical rule for the implementation agent

For each module or route:

1. Use the dump and bundle as the primary source for UI, routes, observable requests and screen states.
2. Use the public help center only as a secondary source for product behavior and hidden flows.
3. If behavior is not observable in the dump and not clearly documented publicly, mark it as `invented`.
4. Build invented behavior using `salonbw` domain rules and standard product assumptions, not guesses about hidden Versum internals.

## Scope exclusions

These areas remain outside the clone scope:

- KSeF and accounting-specific invoice workflows
- Booksy integration and Booksy migration/conversion flows

## Consequences

- The chosen strategy is the most efficient available path without Versum source code.
- It is strong enough for high-fidelity UI and flow reconstruction across the core panel.
- It does not justify a claim of guaranteed 100% parity for every hidden business rule, permission edge case or backend-side side effect.
