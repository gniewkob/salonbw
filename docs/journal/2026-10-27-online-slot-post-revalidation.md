# P0 Online booking — POST-side availability revalidation

- Date: 2026-10-27
- Base: current `master` before functional release.
- Issue: #1528.
- Deployment: **NOT DEPLOYED**, no production data mutation.

## Finding
Before this patch, the online wizard fetched `/calendar/available-slots`, but the booking POST ran only an overlapping-appointment check. A client could submit an expired/forged timestamp that was outside scheduled hours, during a timetable exception or overlapping a manual time block. The existing transaction lock serialized appointment POSTs by employee but did not consult the shared slot policy.

## Change
- `AppointmentsService.saveNewAppointment` calls an online-slot eligibility callback **after locking the employee row**, before the conflicting-appointment check and before any INSERT.
- `CalendarService.isAvailableSlot` finds the correct `Europe/Warsaw` calendar date, resolves through existing `getAvailableSlots` and requires matching staff ID and exact UTC timestamp.
- Prevent inactive/non-online service and mismatched employee from qualifying for online slot selection.
- Preserve independent manual staff booking rules and existing audit/notification sequence. Rejected creates do not emit emails/push.
- `AppointmentsModule` imports `CalendarModule`. Test harness injects availability mock.
- Regression specs include stale online-slot refusal, manual staff bypass, matching staff + exact UTC instant, and Warsaw DST date lookup.

## Validation
- Code committed on separate isolated GitHub branch. **CI / independent review pending**.
- Existing Postgres employee-row lock serializes concurrent appointment creations, but **transactional synchronization with concurrent time-block/timetable edits has NOT yet been proven**. This is a remaining P0 concurrency risk.
- Existing `getAvailableSlots` constructs local day boundaries using server-local Date functions; correctness around Warsaw DST transition and non-Warsaw server TZ requires additional end-to-end test and may require a dedicated engine fix. Passing date-lookup tests alone does not prove DST end-to-end.
- Dedicated Postgres integration tests needed: two clients same slot, block creation while booking, timetable change while booking, exceptions, daylight-saving gap/fold. No claimed production readiness.

## GO/NO-GO
**NO-GO** for production merge/deploy until exact-SHA CI, PostgreSQL concurrency and slot policy integration regressions pass, code review and staging UAT are accepted. Booksy reconciliation and frontends are separate workstreams.

## Next
Run GitHub CI, repair any failures, complete transactional synchronization with time-block/time-table writes, validate Warsaw local-day handling on a UTC host, then execute synthetic E2E on dev only.
