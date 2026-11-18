# Studio V18.1 — integrated DEV release candidate

**State:** in progress, Draft / not deployed.  
**Reference (owner-reported live DEV on 2026-11-18):** `cfb9320a630b964deabced006be19044fe4a6545` (PR #1725).  
**Target:** one source-integrated release candidate, one exact-SHA QA package, one MyDevil DEV deployment, one combined owner UAT.  
**Production:** explicitly out of scope, no real customer-data changes, no PR merge to master without a separate decision.

## Scope and evidence boundaries

| Track | Code/evidence discovered on the live DEV SHA | V18.1 action | Acceptance |
|---|---|---|---|
| Existing calendar actions | V18 shares `CalendarView`, `AppointmentDrawer` and `TimeBlockModal`; owner previously accepted block creation, hard block exclusion and mobile styles | Preserve; add regressions, do not rewrite interaction engine | Day/week, slot choice, block create/edit/delete, drag two times, overlap/admin acknowledgement, status and out-of-hours checks |
| Appointment create from calendar and customer card | `V18CustomerBooking` delegates to `AppointmentDrawer`, but the customer-card caller currently always sets `lockClientSelection` | Reproduce create and customer selection behavior in isolated tests first; **no frontend/backend permission changes in this first integration tranche** | API create receipt, refreshed calendar, customer context, field requirements, admin/employee/client authorization verified separately |
| Customer alerts on appointments | Legacy reception uses `hooks/calendar/useCustomerAlerts` (batch statistics endpoint plus bounded fallback). Shared `CalendarView` already accepts `customerAlertSeverityById`; V18 did not supply it | Wire the existing statistics-only classifications to V18 day grid and mobile week agenda; generic text and aria labels, no personal notes, no new endpoints | Correct visitor-by-ID severity only; missing/failed statistics are never treated as verified warnings; retry exists |
| Navigation and drag preview | Current DEV code already includes calendar rail links, return-to-calendar action, URL sync, and FullCalendar live move preview | Test those existing paths; do **not** cherry-pick old PR #1714 indiscriminately | Day/view return, visible destination time during drag, mobile day/week |
| Design consistency | Owner accepted PR #1725 mobile; desktop sign-off not yet reported | Include desktop confirmation in combined UAT, preserve V18 design tokens and legacy visual isolation | Compact blocks, form parity, hover matching, keyboard/mobile, no CSS regressions |
| Legacy receptionist workload | Extended `ReceptionInsightsPanel`, `ReceptionFollowUpPanel`, audits, etc. remain in classic calendar | Defer unneeded reception modules until product owner demonstrates need | One-person salon avoids redundant roster and reception controls |
| Messaging/consent and release security | Issues #1657, #1668, #1706, #1566 open in backlog | No outbound messaging, consent schema, DB grants or PROD changes in V18.1; treat critical security findings as independent release gates | Authorized operator documents the risk disposition before activation |

### No repeated micro-deployments

1. Commit source and tests on `integration/v18-1-calendar-crm-20261118`, stacked on #1725.
2. Keep work in GitHub Draft. Do not deploy incremental commits or open a MyDevil activation script for individual fixes.
3. Complete exact-SHA review and run `local-release-gate.sh` for the final integrated HEAD; browser tests at 1366 and 390 logical px with synthetic data; verify lint/typecheck/build. CI is a separate status.
4. Conduct read-only checks of DEV isolation before deployment. Issue #1706 found PostgreSQL `PUBLIC CONNECT` to the PROD database for the DEV role; it is **unresolved in this release evidence**. Do not assume MyDevil default HBA restrictions mitigate it. Any ACL change needs separate explicit authorization and a rollback plan.
5. Only after a passing QA matrix and a documented outcome of security release gates: package/stage once, MyDevil Unix socket smoke, verify previous live SHA, activate DEV once and verify active exact SHA/HTTP.
6. One owner UAT across appointments, blocks, calendar alerts, customer links, mobile and desktop. Regressions are handled on the RC branch and re-QA'd, not by repeated production deployments.

## Evidence ledger

- **Source changes:** V18 alert wiring and non-sensitive labels are being added in this integration branch. Source review only until the owner provides exact-SHA QA output.
- **Panel Jest, backend Jest, typecheck, build, Gitleaks, browser QA:** UNKNOWN for the integration HEAD until run.
- **DEV deploy / browser owner acceptance for V18.1:** NOT STARTED.
- **PROD deployment:** NOT AUTHORIZED.
- **Security finding:** #1706 read-only investigation outstanding; do not silently close or downrank.

## Follow-up / deliberately deferred

- Pinned client warnings/tags require a scoped privacy/authorization and batching review. This tranche shows only attendance-history signals from existing customer statistics; the UI does not claim full CRM alert coverage.
- Customer-selection role boundary on customer-context booking (`lockClientSelection`) is flagged for a separate test-first investigation against #1657; cannot be changed on the strength of a UI-only test.
- Communications UI/marketing consent changes and WhatsApp send-time eligibility remain a separate V18.2 workstream, subject to #1668 and the established independent channel opt-ins.
- Never infer green GitHub Actions from passing local operator scripts, and never label owner UAT PASS without owner confirmation.
