# P0 independent transaction/code-security review — PR #1540

- **Date:** 2026-10-27
- **Agent:** Codex + one independent read-only security reviewer
- **Reviewed base:** `461934bd2068419919529c1affeec6ffcb2a21ce`
- **Validated code commit:** `ef415906f367d22b430c3b283ffd6360881d2bc6`
- **PR:** [#1540](https://github.com/gniewkob/salonbw/pull/1540), remains Draft
- **Issues:** [#1537](https://github.com/gniewkob/salonbw/issues/1537), [#1530](https://github.com/gniewkob/salonbw/issues/1530)
- **Scope:** isolated worktree; no merge/deployment, Booksy, production writes or real messages.

## Finding

1. **P1 — manual overlap bypassed serialization.** `saveNewAppointment` and
   `updateAppointmentSchedule` returned before the employee transaction/lock when
   overlap was permitted. Two new controlled PG tests fail on the base because
   manual create/reschedule never waits at the shared users lock.
2. **P1 — validated duration differed from persisted interval.** Appointment end
   was computed before the staff lock, while CalendarService re-read the service
   duration after it. In a controlled two-connection test, a service changed from
   60 to 30 minutes plus a block on the last 30 minutes; old code accepted the
   full 60-minute booking across that block. The regression failed before fix.
3. **P2 — deletion could be reversed by an overlapping block update.** Delete
   bypassed the staff lock; TypeORM save after a transactional reload could
   recreate the deleted block. A barrier pauses update before save. Its delete
   lock assertion fails with the original delete implementation, passes with fix,
   and the final persisted block count is zero.
4. **P1 — finalization/reschedule lock inversion and stale status.** Reschedule
   locked users then appointments, while finalization locks appointments then
   writes a user FK. Controlled PG reproduction explicitly confirmed SQLSTATE
   `40P01` before fix. After fix, reschedule waits on the appointment, observes
   completed status and returns ConflictException; completion/start remain intact.

## Change

- Manual overlap skips conflict policy only; create/reschedule retain the staff
  mutex and transaction manager.
- Reschedule locks appointment before employee, matching lifecycle writers.
  Recheck captured status, employee and start/end after locking; stale changes
  reject 409 rather than undo completion/cancellation or a competing move.
- Online booking supplies the captured total duration (service/variant/add-ons)
  to CalendarService. Revalidation rejects if the freshly loaded total differs.
  Existing public-picker callers remain compatible; no HTTP contract change.
- Block delete obtains the same staff lock and performs affected-count checked
  deletion inside the transaction.
- No migrations, dependencies, auth/configuration or messaging changes.

## Validation

- Backend: **64 suites / 505 tests PASS** in UTC and Europe/Warsaw.
- Real disposable PostgreSQL 15: **25/25 PASS**, no skipped tests, UTC and
  Europe/Warsaw. Dedicated loopback port/database; no use of shared local DB.
- Added reverse day-off/block-first booking tests, catalogue-duration race,
  manual create/reschedule lock tests, update/delete race, finalization/reschedule
  deadlock/status test and three real database DST cases. Existing single-pool-
  connection test and booking-first schedule rollback remain passing.
- DST cases: spring missing hour; disjoint autumn 02:30–04:00 interval;
  180 elapsed minutes across the full fold. Exercise slot reads, actual booking
  and schedule-edit rollback; freeze Date only so fixtures do not expire.
- Rejected online writes assert no audit/client notification invocation; rejected
  schedule edits assert no audit. External delivery is stubbed throughout PG tests.
- Backend typecheck, build and scoped source ESLint PASS; diff whitespace check PASS.
- Independent reviewer inspected pinned base and final incremental diff. Four
  findings addressed; no remaining material code blocker in reviewed scope.
  Reviewer did not independently execute tests. GitHub Codex review was quota-
  blocked; separate Claude review failed. Neither is counted as a review pass.
- Every nested availability read and timetable before/mutation/after check uses
  the transaction manager. Schedule writers read appointments without row locks;
  existing-appointment mutations now use appointment -> employee order. This is
  bounded evidence for tested flows, not proof that the whole system is deadlock-free.

## Rollout

No rollout. Existing base CI: [40490500995](https://github.com/gniewkob/salonbw/actions/runs/40490500995)
9/9 PASS. Code commit **`ef415906f367d22b430c3b283ffd6360881d2bc6`** passed
[CI 40499898727](https://github.com/gniewkob/salonbw/actions/runs/40499898727):
**9/9 jobs SUCCESS**. Backend job `122174899129` logs explicitly report
**64 suites / 505 tests** and **25/25 PostgreSQL tests**, no skips. Frontend
jobs passed path selection; frontend build/tests were skipped because this
change concerns backend/docs. Claude review run `40499898768` failed execution
and is not an approval. The final documentation-only HEAD and its own CI result
are linked in #1537/#1530 and PR #1540; never substitute parent CI for HEAD CI.

Read-only dev probe on 2026-10-27: health HTTP 200, release
`4cc6faf37cd8d53db16be05e166b1c8a7c497885`; dev-panel calendar HTTP 401 without
credentials. This proves neither current isolation/outbound settings nor UAT
acceptance. Reviewed code is not deployed there; **no synthetic dev writes**.

## Impact / rollback / follow-up

Manual overlap remains allowed, with extra serialization. Concurrent stale moves
and catalogue changes can now return 409 and require refreshing/retrying. No
schema change; revert this scoped patch to roll back code, but that reopens the
reported defects and does not establish production readiness.

**NO-GO remains:** final exact-head CI verification, verified dev access/database/outbound gates and
reviewed release SHA, dev synthetic UAT, restoration/rollback evidence and owner
acceptance. Next: inspect exact pushed-head CI, publish immutable evidence on both
issues, then arrange gated dev UAT. Do not merge/deploy production or switch Booksy.
