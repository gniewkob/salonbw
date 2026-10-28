# SalonBW — HTTP auth UAT: real Nest routing without hosted writes

The opt-in CI-only HTTP authorization test at
\`backend/salonbw-backend/src/appointments/appointments-http-authorization.spec.ts\`
executes the **actual** Nest controller, Passport JWT strategy, role guard,
request body validation, and HTTP status mapping. It uses synthetic in-memory
account state and a mock AppointmentsService; **it does not connect to a
database or send real appointment POST requests to MyDevil**.

## Covered

- Missing JWT, mismatched role or stale authVersion: HTTP 401
- Client, employee, receptionist \`forceOverlap:true\`: HTTP 403 with
  zero booking service invocations
- Employee attempting another employee's calendar: HTTP 403
- Non-boolean override: HTTP 400
- Admin deliberate override: HTTP 201 from mocked service, correct Warsaw
  2026-11-04 09:00 → \`2026-11-04T08:00:00.000Z\`, force flag passed
- Ordinary admin booking: \`forceOverlap:false\`

The existing PR #1546 real PostgreSQL suite independently verifies transaction
conflicts and that a denied override leaves **zero appointment rows**. It
runs against a disposable CI database (never MyDevil), and already covers
races, day-off/time-block changes, and Warsaw DST.

## Exclusions / outstanding acceptance

This isolated HTTP test does **not** exercise the full application's CSRF
middleware, actual HTTP authentication against the deployed API, real
notification providers or database commits. It does not test whether a
hosted client or reception session can reach the endpoint, nor prove that
concurrent **hosted** requests result in a 409. These require separate bounded
DEV-only UAT with synthetic identities, controlled data, and outbound-disabled
verification before any write.

The operational DEV remains pinned to
\`c4399429a7f9a7804161847f79d6d70a64a025d1\`.
No deployment, merge, production/Booksy changes, or credential rotation from
this PR. Keep production NO-GO until acceptance.

### Run locally without MyDevil

\`\`\`sh
pnpm --filter salonbw-backend exec jest --runInBand \
  src/appointments/appointments-http-authorization.spec.ts
\`\`\`
