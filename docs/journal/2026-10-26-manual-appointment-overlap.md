# Manual conflict override for salon owner — phase 1

- Date: 2026-10-26
- Branch: `codex/owner-appointment-overlap-20261026`, base `master` `0b1732e5`.
- Workstream: SalonBW calendar-first admin workflow, WDI design-engineering review.
- State: CODE/TESTS ADDED, CI/DEV CHECKS PENDING. **No production merge or deploy.**

## Observed defect

The calendar appointment drawer warns about conflicts and changes the button to
"**Dodaj mimo to**" on a second click, but sends the identical POST body for
both clicks. When `allow_overlapping_appointments=false`, backend
`AppointmentsService.saveNewAppointment` rejects the retry as 409.
This breaks the owner's deliberately overlapping manual appointment workflow.

A distinct drag/drop override already exists on
`PATCH /appointments/:id/reschedule` with `force=true` but not on create.

## Change

- `CreateAppointmentDto.forceOverlap?: boolean` is an explicit per-booking
  admin-only acknowledgement; never used by client self-booking.
- Controller rejects `forceOverlap=true` from client, employee or
  receptionist with 403 before attempting creation. Actor role is passed
  to service.
- `AppointmentsService.create(data, actor, forceOverlap=false)` independently
  enforces admin role and non-self-booking, preserves global staff overlap
  behavior, and includes `forceOverlap: true` in the existing appointment
  creation audit action when manually overridden.
- Drawer supplies the override only after warning and second click, only for
  an admin. Non-admins see a clear error instead of a misleading button.
  Reset acknowledgement when date, employee or service changes.
- Added controller, service and UI regression tests for the above.

## Boundaries and follow-up

- This change addresses **only** manual appointment overlap acknowledgement.
  It does not broaden online booking privileges, change appointment statuses,
  modify notifications, change bookings, or run database migrations.
- **Open P0**: online booking POST still needs transactionally revalidated
  timetable, exceptional hours, blocks and service eligibility. Current
  concurrency guard prevents overlapping visits but is not sufficient to
  enforce all booking restrictions. Implement as separate scoped change
  with real PostgreSQL concurrent tests before any broad online go-live.
- **Open P1**: admin editing of client/service/staff/duration; phone-agreed
  reschedules should distinguish immediate confirmation from client approval.
- **Open P1**: calendar staff listings must include the salon owner
  (role=admin, isSystemAdmin=false), not only role=employee. Test the
  actual runtime path before changing role filters.
- **Open P1**: time block reconciliation; guard/resolve existing appointments
  when closing salon days, rather than silently conflicting.
- No access to local checkout/SSH was used; owner local changes remain
  untouched. Frontend dev staging deploy to be performed only after CI.

## Acceptance criteria

1. Admin receives overlap warning and explicitly confirms per event.
2. Same POST persists booking after confirmation with global overlap disabled.
3. Client, employee and receptionist cannot use force flag.
4. Other bookings retain existing conflict protection; online booking remains
   non-overlapping even when global staff overlap enabled.
5. Audit record distinguishes explicit overlap exception.
6. Entire normal booking, status and notifications lifecycle unchanged.
