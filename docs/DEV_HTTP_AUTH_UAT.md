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
`stylist@salonbw.example.test`, checks that account's role and
`isSystemAdmin=false` using real `GET /users/profile`, and then verifies
an **actual HTTP 403** from `GET /system/status`, a route restricted to
system administrators. After authentication all browser mutation requests
are blocked. HTTP probes are strictly GET. The only intentional remote
write is creation of a synthetic authentication session during login;
**zero booking write requests** are made. All credentials remain local.

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

The revised test verifies a real authenticated `GET /users/profile` 200
before checking that exactly one namespaced API-scoped access cookie exists
and has `HttpOnly` and `Secure` attributes. If the profile request is
401, diagnose the synthetic DEV login and the cookie `Domain`/origin/
proxy configuration in the trusted environment; **do not** interpret a panel
navigation as proof of API authentication. An API-scoped cookie mismatch
remains a failing test, not a waiver. The test never logs cookie names,
values, headers, JWTs or raw responses.

The only hosted write is synthetic session creation during login; no
booking POST or data reset is performed. The prior failed attempt is
**FAIL/UNRESOLVED**, not a hosted authorization PASS. Repeat on the exact
reviewed test commit with existing local DEV credentials, without changing
the deployed application.
