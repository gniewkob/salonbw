# P0 — atomicity of timetable/exception writers with booking

- **Date:** 2026-10-27
- **PR:** #1540 (DRAFT; stacked on #1539 → #1536 → #1535)
- **Commits:** `72fd821f`, `691d8252`, `e8f0475c`, `6915d431`
- **Production/development:** no deployment, no live data operations

## Finding

Booked appointments were serialized with PostgreSQL staff-row locks while
`TimetablesService` create/update/delete and exception create/update/delete/
approve did not participate. A day-off or reduced working hours could commit
after a customer booking without checking that the booked time remained valid.
Existing mutations also saved timetable header and slot rows in separate
non-atomic operations.

## Change

The timetable and exception service now acquires the existing
`users(id) FOR UPDATE` lock, reads/writes with a single TypeORM
transaction manager, compares existing future appointment working-hour
validity before and after each mutation, and rolls back changes that would
invalidate a previously valid booking. Existing deliberate staff appointments
outside published hours remain unchanged (no blanket grandfathering of new
online bookings). All audit entries occur after successful commit.

A separate CalendarService method reuses the same effective staff timetable,
break, exception, branch fallback and Warsaw-local DST interpretation already
used by the slot picker. Timetable mutations re-read records after the lock.

## Validation

- GitHub CI `40489876927` for `e8f0475c`: success, all 9 jobs.
- `6915d431` adds controlled two-connection PostgreSQL interleaving tests
  for booking-before-day-off and day-off-before-booking, atomic slot rollback,
  and real online POST with a one-connection PostgreSQL pool.
- **Final exact-head CI:** must be checked; do not call this task complete
  based on prior commit CI.
- Independent review and isolated dev UAT are still required.

## Rollout

None. PR intentionally remains Draft. Never merge the stacked branch
independently or deploy/modify Booksy before release-gate acceptance.

## Follow-up

Read exact-head CI logs; correct any failed tests. Independent review of
lock ordering, effective-hours policy, and rollback. Verify both
`TZ=UTC` and Warsaw cases, staging UAT, backup restoration and owner GO.
