# V18 local egress and configuration probes

- **Date:** 2026-11-13
- **PR:** #1704; starting HEAD `23b02d7e4a416fc0f43d180e525718716a56a8ee`

## Finding

The panel API client and two Next server paths can default to the production API. The previous network probe established Node-to-PostgreSQL TCP but did not test isolation against a reachable target on another network. No full-stack local harness or independent application fixture exists.

## Change

Add a local-only controlled cross-network TCP probe and a standalone strict configuration validator with negative tests. These are building blocks, not an application runner: the validator is not wired to any startup, migration or seed. The target and control run in a second isolated Docker network; there are no published ports and no DEV/PROD calls.

## Validation

- Node configuration tests: 13/13 pass, including missing/foreign API origin and database, and CI rejection.
- Controlled Docker probe: target reachable from control network; connection from separate internal network denied or timed out. This tests only the observed TCP path, not all protocols, host access, DNS, or application egress.
- Shell syntax and CI rejection pass; no labelled containers or networks remained after successful run. Signal and startup-failure cleanup for this new probe are not independently tested.
- No panel, API, migrations, seed, browser, real-stack scenario, screenshot or accessibility review was run.

## Rollout and follow-up

No deploy or manual CI rerun. Before launching the application, build a runner that validates actual process environments before every start and database mutation, enforces outbound isolation and browser request allowlists, and supplies a disposable independent fixture. Then execute real-stack scenarios and the requested accessibility and screenshot reviews. Exact-head CI, owner visual acceptance and release remain NO-GO.
