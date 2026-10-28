# SalonBW — HTTP auth UAT: real Nest routing without hosted writes

The opt-in CI-only HTTP authorization test at
`backend/salonbw-backend/src/appointments/appointments-http-authorization.spec.ts`
executes the **actual** Nest controller, Passport JWT strategy, role guard,
request body validation, and HTTP status mapping. It uses synthetic in-memory
account state and a mock AppointmentsService; **it does not connect to a
database or send real appointment POST requests to MyDevil**.

## Covered

- Missing JWT, mismatched role or stale authVersion: HTTP 401
- Client, employee, receptionist `forceOverlap:true`: HTTP 403 with
  zero booking service invocations
- Employee attempting another employee's calendar: HTTP 403
- Non-boolean override: HTTP 400
- Admin deliberate override: HTTP 201 from mocked service, correct Warsaw
  2026-11-04 09:00 → `2026-11-04T08:00:00.000Z`, force flag passed
- Ordinary admin booking: `forceOverlap:false`

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
`c4399429a7f9a7804161847f79d6d70a64a025d1`.
No deployment, merge, production/Booksy changes, or credential rotation from
this PR. Keep production NO-GO until acceptance.

### Run locally without MyDevil

```sh
pnpm --filter salonbw-backend exec jest --runInBand \
  src/appointments/appointments-http-authorization.spec.ts
```

## Isolated DEV Basic + namespaced JWT regression

The in-process Nest HTTP test
`backend/salonbw-backend/src/appointments/appointments-http-authorization.spec.ts`
also applies the same `cookie-parser` middleware as the real backend. Its
synthetic regression sends `Authorization: Basic` together with three
different JWT-cookie states: **401** without a cookie, **401** with an
unprefixed cookie, and **403** with a valid `uat_accessToken` cookie belonging
to a client who cannot override appointment conflicts. The mocked
AppointmentsService must receive **zero** calls in all three cases.

This specifically checks the Passport JWT extraction fallback: the independent
Basic gateway header must not be misinterpreted as Bearer authentication, and
JWT cookies must obey `AUTH_COOKIE_PREFIX`. No real DEV gateway credential,
persisted database or booking endpoint is used by this isolated test.

To validate it in the repository's trusted test environment:

```sh
pnpm --dir backend/salonbw-backend exec jest \
  --runInBand src/appointments/appointments-http-authorization.spec.ts
```

This isolated test is **not** hosted DEV proof. In the stacked Draft PR, normal
CI is not automatically dispatched on subsequent commits because the main
`ci.yml` only targets PRs against `main`/`master`, whereas PR #1548 is
stacked on another feature branch. Report new test results as **NOT_RUN** until
actually executed, even if GitGuardian or automated code review succeeds.

## Hosted mobile follow-up (opt-in, no booking writes)

A second independent Playwright test at
`apps/panel/uat/hosted-dev-mobile-read.pw.ts` verifies the already deployed
release and a 390px mobile calendar drawer, including editable Warsaw local
time. Login uses the synthetic DEV salon-admin credentials already available
in the operator's terminal; **after login, all non-GET/HEAD/OPTIONS requests
are intercepted and blocked**. It never submits an appointment or changes a
customer. No raw trace, screenshot, video or tokens are uploaded.

Run it only in the same trusted Mac shell with existing credentials and the
exact `PLAYWRIGHT_BASE_URL` after fetching its PR SHA. It is not run by CI;
CI only typechecks the optional suite and enumerates its test cases offline.
This smoke is **not** a complete mobile customer/checkout journey and cannot
replace hosted DEV 403/409, CSRF or database acceptance.

## Hosted real HTTP: read-only authorization proof (PR #1548)

The new opt-in Playwright test
`apps/panel/uat/hosted-dev-http-auth-read.pw.ts` accesses only
`https://dev-api.salon-bw.pl` and the existing DEV panel. Before login it
asserts the exact immutable panel/API release, DEV health, and an **actual
HTTP 401** on `GET /users/profile` when only the DEV Basic Auth gateway
credential is supplied (no JWT cookie).

It logs in with the known **synthetic salon administrator**
`stylist@salonbw.example.test`. The backend deliberately sets
`COOKIE_DOMAIN=dev-panel.salon-bw.pl`; this JWT cannot accompany a direct
browser GET on sibling host `dev-api.salon-bw.pl`. The authenticated test
therefore uses **the real same-origin Next.js proxy** at
`https://dev-panel.salon-bw.pl/api/users/profile` (HTTP 200, role=admin,
`isSystemAdmin=false`) and `/api/system/status` (real Nest HTTP 403).
The Next proxy forwards the panel cookie and Basic gateway header to the
independent Nest API. Anonymous GET 401 probes still go directly to
`dev-api.salon-bw.pl` without an application session.

The test verifies exactly one namespaced HttpOnly/Secure JWT cookie on the
panel origin and that none is sent by the browser to the sibling API host.
After authentication all browser mutation requests are blocked. API probes
are GET only. The only intentional remote write is creation of a synthetic
authentication session during login; **zero booking write requests** are
made. Credentials remain local.

This is **not** a real `POST /appointments` 403 test or any
conflict `409` test. Those require purpose-built synthetic role fixtures and
guarded request-level checks; don't run potentially booking-creating POSTs
against the deployed API on existing user/employee records.

The test must be run only in the trusted local Mac's existing terminal with
all four variables `DEV_ACCESS_USER`, `DEV_ACCESS_PASSWORD`,
`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` still set. The latter email
must match the synthetic salon administrator exactly.

Example from the previously prepared isolated Git worktree, after checking
out the exact reviewed PR revision:

```bash
export PLAYWRIGHT_BASE_URL="https://dev-panel.salon-bw.pl"
pnpm --dir apps/panel exec playwright test   hosted-dev-http-auth-read.pw.ts   --config=playwright.hosted-dev.config.ts   --project=hosted-dev-uat   --workers=1 --reporter=list
```

Only CI **typechecks/lists** this opt-in test; it never runs a browser on
MyDevil through GitHub Actions. Avoid raw trace/screenshots/cookie dumps.
Do not reset credentials, re-seed or redeploy due to a test failure.


### Interpreting the hosted login/cookie assertion

The 2026-10-28 Mac execution reached the post-login assertion but did not
find a cookie named literally `dev_accessToken`. This alone does not prove
whether the deployed API login succeeded: the backend computes
`AUTH_COOKIE_PREFIX + accessToken` and the required DEV prefix is not
assumed by the test.

The corrected test verifies the authenticated Nest profile as real HTTP
200 **through the panel `/api` proxy** before inspecting the panel-scoped
access cookie with `HttpOnly` and `Secure` attributes. A cookie scoped to
`dev-panel.salon-bw.pl` is **not** expected to appear on
`dev-api.salon-bw.pl`; the test checks that browser isolation explicitly.
If the proxied profile request is 401, diagnose the synthetic DEV login,
cookie forwarding and gateway configuration in the trusted environment;
**do not** treat panel navigation as proof of API authentication. A cookie
scope mismatch remains a failed check, never a waiver. No cookie names,
values, headers, JWTs or raw responses are logged.

The only hosted write is synthetic session creation during login; no
booking POST or data reset is performed. The prior failed attempt is
**FAIL/UNRESOLVED**, not a hosted authorization PASS. Repeat on the exact
reviewed test commit with existing local DEV credentials, without changing
the deployed application.
