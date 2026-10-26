# Hosted development booking UAT

- Date: 2026-10-26
- Agent: Codex
- Related PR: #1521 (reporting only; no merge or deployment)
- Branch: `codex/hosted-dev-uat-20261026`, documentation based on `0b1732e5`
- Result: **PARTIAL** for the requested landing-to-registration journey;
  **PASS** for hosted registration, booking and salon confirmation after
  manually reselecting the service.

## Scope and actual running versions

Owner's delegated task: use the existing authorized development access, execute
the real browser journey on synthetic data, and report results in a new journal
and PR #1521. No production mutations, customer imports, external delivery,
gateway bypass, password rotation or deployment were performed.

The existing private local gateway/admin resources worked. Unauthenticated 401
is the expected protection, not evidence that authorized access is unavailable.

| Surface | Observed live revision | Upstream |
| --- | --- | --- |
| dev.salon-bw.pl | `41cfd131ffea4b42dbd7d139afdd41e2274b99d8` | dev-api.salon-bw.pl |
| dev-panel.salon-bw.pl | `41cfd131ffea4b42dbd7d139afdd41e2274b99d8` | dev-api.salon-bw.pl |
| dev-api.salon-bw.pl | `8aa1c7b864bd577d84c2df319ab3e09d9bda1eb6` | independent development DB |

This is UAT of these hosted versions, **not** a claim that PR #1521's
`64cee5bd` scripts were deployed or exercised by the browser. No revision was
changed to make the test pass.

## Safety gate before the first write

- Private host check: APP_ENV=development, expected development database name,
  user and host; OUTBOUND_DELIVERY_ENABLED=false and SMSAPI_ENABLED=false.
- Both frontend runtime files: own dev API, deployment environment development,
  AUTH_COOKIE_PREFIX=dev_. Configuration values/secrets were not printed.
- Read-only DB aggregate: 3 users, zero non-synthetic addresses, zero appointments.
- Authenticated gateway: landing HTTP 200 with noindex. Final unauthenticated
  checks of landing, panel and API public services each returned 401.
- Registration/admin login session cookies: dev_accessToken/dev_refreshToken,
  Secure and HttpOnly, scoped to dev-panel; no production token was used.

## Browser checks and observed results

| Check | Result | Evidence |
| --- | --- | --- |
| Open protected landing and public catalog | PASS | Authorized browser, backend-derived prices/durations |
| Anonymous generic booking CTA | OBSERVED | Opens login before service/date selection |
| Choose Strzyżenie grzywki from catalog | PASS | Modal retains the selected name, 30 PLN and 25 minutes |
| First register-link click in a fresh modal | FAIL | Reproduced in two fresh contexts: stays on /services and shows required-email validation; second click navigates |
| Empty registration form | PASS | Required name/email/password/privacy/terms validation; zero registration POSTs |
| Synthetic registration | PASS | POST /api/auth/register HTTP 201, normal client session created |
| Resume selected booking after registration | FAIL | Link has no booking context; successful registration sends the client to /dashboard instead of the selected service |
| Reselect service in panel /booking | PASS | 25 minutes / 30 PLN, optional add-ons can be skipped |
| Load/select availability | PASS | API-derived next available day: 2026-10-27, test stylist, 09:00 |
| Submit synthetic booking | PASS | POST /api/appointments HTTP 201, reservation #1, visible success screen |
| Client sees pending reservation | PASS | Dashboard and /visits?visitId=1 show Oczekuje |
| Salon sees matching pending reservation | PASS | Calendar 2026-10-27: 09:00–09:25, Online — czeka; details show pending online confirmation |
| Salon confirms reservation | PASS | PATCH /api/appointments/1/status HTTP 200 |
| Both sides retain confirmed state | PASS | Client reload shows Potwierdzona; salon reload shows Potwierdzona, zero pending badge |
| Mobile confirmation/details | PASS | 390px viewport and scrollWidth 390; screenshots inspected |

The success screen's "Moje wizyty" action currently opens /dashboard by design
(`booking.tsx` in live frontend revision, lines 780–785), rather than /visits.
The reservation is visible there and its details open /visits?visitId=1. This
is a navigation-label observation, not loss of the saved reservation.

## Safety and persistence after UAT

- Postflight private host check still passed the development/database/outbound
  guards. Read-only DB check: **4 synthetic users, 1 appointment**, confirmed.
- Only one new synthetic client and one appointment were created. Fixture:
  client ID 9, employee ID 8, service ID 12, appointment ID 1; name begins
  `UAT Flow 20261026`, email uses a reserved .test domain. No real phone used.
- Stored UTC interval 2026-10-27 08:00–08:25 matches 09:00–09:25 Europe/Warsaw.
- Browser mutation requests were confined to dev-panel's own API proxy:
  registration/login, appointment creation/status, and calendar operational
  events. Observed production API requests: **0**. No send endpoint was used.
- Delivery remained disabled; this UAT is not an e-mail/SMS/push/WhatsApp
  delivery test or a server-wide packet capture.
- Instrumented client detail reload/admin session: zero page errors. The
  observer was installed after booking; this does not assert a full-journey
  console-error capture.
- Test contexts were closed. Fixture remains on dev for inspection; no cleanup
  was applied to production or development, and no password was published.

## Evidence and next action

Local screenshots inspected under:
`/Users/gniewkob/.codex/visualizations/2026/10/26/salonbw-hosted-dev-uat/`

- `landing-register-first-click.png`: reproduced registration-link failure.
- `booking-summary-desktop.png`, `booking-confirmation-desktop.png`,
  `booking-confirmation-mobile.png`: selected service, term and success.
- `salon-pending-appointment.png`, `client-pending-mobile.png`: pending state.
- `salon-confirmed-desktop.png`, `client-confirmed-mobile.png`: confirmed state.

Next: fix the first-click registration behavior and preserve booking context
through registration, then repeat the fresh-client landing journey. Until then,
do not label the requested seamless landing→term→registration sequence PASS.
The gateway access blocker is resolved; no operator credential change is needed.
