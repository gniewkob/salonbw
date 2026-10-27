# P0 / #1537 — time-block writer lock alignment

- Date: 2026-10-27
- Base: latest reviewed #1536 branch (includes #1535 server-side booking
  revalidation and timezone conversion).
- This is a **partial, isolated follow-up**, not final concurrency release.
- Production and dev: NOT DEPLOYED; no real data used.

## Finding

`AppointmentsService.saveNewAppointment` serializes online writes using a
PostgreSQL `users(id) FOR UPDATE` lock. `CalendarService.createTimeBlock`
and `updateTimeBlock` previously read conflicts and saved without taking
the lock. A concurrent client appointment POST and owner time-block
creation could each see an unblocked interval and commit contradictory
records.

## Change

Both time-block **create** and **update** now operate inside a TypeORM
transaction, acquire the exact same employee `FOR UPDATE` lock and use
the transaction manager repositories for every appointment/block overlap
read and resulting time-block save. Update reloads the block after locking
so it does not act on stale fields. Existing admin-as-owner support and
validation stay intact. The unit-test harness now supplies a transaction
manager rather than an untransactional repository.

## Remaining blockers

1. **Not yet implemented here**: matching lock/revalidation for
   `TimetablesService` create/update/remove and exception
   create/update/remove/approve.
2. Controlled two-connection PostgreSQL tests must prove book-vs-block
   and book-vs-day-off interleavings; unit tests cannot prove DB locks.
3. Existing availability callback inside booking transaction reads from
   CalendarService repositories, not explicitly the transaction manager.
   Read-committed visibility and writer lock ordering need a real PG test.
4. Staff scheduling semantics must be agreed for an existing appointment
   when reducing working hours; do not silently discard bookings.
5. CI, code review, dev synthetic UAT, restore rehearsal and owner GO
   remain required.

## Safety

No merge/deploy until the complete P0 writer serialization protocol
(including timetable exception paths) passes non-skipped PostgreSQL tests.
Do not disable booking validation or use a broad global overlap bypass.
