# Booking POST — transaction-scoped availability

- Date: 2026-10-27
- Parent: draft #1539 (stacked on #1536 and #1535).
- Release: NO-GO, no merge or deployment.

## Finding
Independent PR #1539 review found that revalidation during booking held
a PostgreSQL staff row lock while CalendarService queried through injected
repositories on another pool connection. Saturated concurrent bookings can
cause pool starvation/deadlock-like timeouts.

## Change
Forward the transaction EntityManager into online availability verification
and all related service/add-on/employee/branch/timetable/exception/appointment/
time-block reads. The public slot picker keeps its original repositories.

## Validation
Exact remote CI and non-skipped PostgreSQL pool test required. This journal
does not claim tests have run.

## Follow-up
Complete writer locks for timetables/exceptions, protect existing bookings,
exercise both PostgreSQL interleavings, then independent review and dev UAT.
