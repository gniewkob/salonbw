# V18 local container network probe

- **Date:** 2026-11-13
- **PR:** #1704, starting HEAD `2568cc770a182bdf85c18c156c683d6f77370f67`

## Finding

The earlier internal-network probe did not establish connectivity between separate application containers. The existing CI fixture requires a fixed localhost database and calls `dropSchema`; it is not a local fixture. The panel API proxy defaults to the production API when `API_PROXY_URL` is absent, so a future local harness must fail closed before starting the panel.

## Change

Add a local-only Node-to-PostgreSQL DNS/TCP smoke probe with pinned image digests, synthetic credentials, unique database and names, a labelled internal network, no published ports and cleanup of created resource IDs. This is a transport probe, not a seed or an application harness. It does not alter the existing CI fixture or workflow.

## Validation

- Shell syntax, local smoke and rejection with `CI=true`: PASS.
- Independently sent SIGINT and SIGTERM after both containers were created: exits 130 and 143 respectively; zero newly labelled containers or networks remained. An injected Docker start failure exited 42 and left no newly labelled resources.
- The older PostgreSQL probe separately passed SIGINT/SIGTERM after its container was created, with no newly labelled resources remaining.
- Signal handling during every creation and cleanup phase, forced termination, and independent egress enforcement were not tested. The TCP check does not exercise PostgreSQL authentication, Nest, Next, Playwright, migrations or persisted appointments.

## Rollout and follow-up

No deployment or manual CI rerun. Implement a separate local-only fixture and full application harness with fail-closed API origin and outbound controls, then run the requested cross-layer, keyboard and accessibility checks. Exact-head CI, visual acceptance and full accessibility review remain open; draft / NO-GO.
