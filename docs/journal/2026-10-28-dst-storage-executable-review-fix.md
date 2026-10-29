# DST timestamp storage and executable entrypoint review fixes

- Date: 2026-10-28
- Scope: one focused follow-up on Draft #1544 (`c4399429`), issue #1530.
- No deployment, merge, migration, production or Booksy action.

## Finding

Review reproduced a loss of the second Warsaw 02:30 during autumn DST:
the real pg driver plus timestamp without time zone hydrated 01:30Z as
00:30Z. The new calendar enumerated both instants although the hosted
process could not persist both losslessly. Appointment end times can lose
the same hour. Two shell entrypoints also changed from 100755 to 100644.

## Change

A small shared guard checks that local timestamp hydration preserves the
exact instant, without changing the process timezone or stored data.
Availability filters unsafe starts and ends; creation and both reschedule
paths reject them with ConflictException before transaction/side effects,
including explicit administrator overlap. Pure Warsaw timezone conversion
still enumerates both mathematical instants; only persistable bookings are
offered. Safe slots and UTC-process behavior remain available.

Restore executable modes for deploy-environment.sh and
extract-frontend-bundle.sh. Add direct-exec regression coverage and CI steps
for Warsaw unit tests and real PostgreSQL round trips.

## Validation

- Fail-first on the unmodified source: 4 DST regressions fail (offered bounds,
  create unsafe start, create unsafe end, forced reschedule); executable test
  fails before any network call. No stash/reset of owner changes.
- Frozen-lockfile install in the isolated worktree; no dependency/lock change.
  Initial reuse of another checkout exposed Express 4/5 peer mismatch; final
  verification below uses the candidate's exact lockfile.
- Full backend UTC with a dedicated local statistics database: 64 suites,
  525/525 PASS, no skipped tests. Warsaw calendar/appointments: 78/78 PASS.
- Disposable loopback-only PostgreSQL 15: business flows 25/25 PASS under
  UTC and Europe/Warsaw. DST cases compare real SQL timestamp hydration,
  exact persisted start/end and zero rows for unsafe explicit overrides.
- Ops dispatch/destination tests: 18/18 PASS. Private snapshot/restore fixture
  PASS. Typecheck, source ESLint, backend build and diff whitespace PASS.
- No test connected to MyDevil databases; no real notification was sent.

## Rollout and follow-up

Hosted DEV remains on c4399429; the candidate has not been deployed.
Publish one Draft follow-up PR, require exact-SHA CI and review, then obtain
the separately scoped DEV rollout decision. Production remains NO-GO.
No data migration is needed for this bounded fail-closed behavior.
