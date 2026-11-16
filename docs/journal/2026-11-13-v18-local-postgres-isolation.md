# V18 local PostgreSQL isolation probe

- Date: 2026-11-13; PR #1704; starting HEAD `1d39d6880709ac751587b0e49ad4b21ece21285a`.

## Finding
The protected CI fixture `backend/salonbw-backend/scripts/qa-owner-browser-postgres.ts` requires GitHub Actions and a fixed database and uses `dropSchema`; it cannot be reused locally. The real-stack tests also require CI. They were not altered or bypassed.

## Change
Added a local-only PostgreSQL lifecycle probe. It creates a uniquely named database and container on a uniquely named internal Docker network, checks container label/network and database identity, writes and reads a synthetic row, and removes only the IDs it created in a trap. It accepts no database URL or SQL and performs no DROP. It exposes no host port. It is an isolation smoke test, not a browser harness or an application fixture.

## Validation
- Docker Desktop linux/arm64: lifecycle probe PASS; CI invocation rejected; bash syntax PASS; no labelled container or network remained after the success and an earlier failure.
- Attempted Docker internal network with dynamically published loopback port: inspect returned an empty published-port list despite a requested binding. Hence a host-based API cannot use that topology. This establishes an integration blocker for the attempted design, not that another safe design is impossible.
- Local graph rebuilt for the starting HEAD and queried; 205 files yielded no symbols and SQL extraction was unavailable. Inspected actual fixture and workflow to supplement it.
- No browser/API/database application E2E, full accessibility audit, exact-head CI, deployment or visual acceptance was performed. Prior synthetic and service-level results do not establish these claims.

## Follow-up
Design and review a safe local-only connectivity topology (for example, run all application services on the internal network), independent synthetic seed and browser tests; verify cleanup on failure/signals. Then test persistence, true concurrent requests, roles, conflicts, stale reschedule, links, mobile and accessibility. Resolve GitHub billing before exact-head CI; obtain Ola's visual acceptance. Draft / NO-GO remains.
