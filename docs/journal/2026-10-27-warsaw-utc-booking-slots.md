# P0 Follow-up — UTC-safe Warsaw booking slot generation

- Date: 2026-10-27
- Parent: #1535 / issue #1528
- Deployment: **NOT DEPLOYED**
- Branch: `codex/p0-warsaw-slots-utc-safe-20261027` (stacked on #1535)
- Production data/SMTP/SMS: untouched

## Finding

The parent PR #1535 uses Europe/Warsaw to derive the *date* for
`CalendarService.isAvailableSlot`, yet `getAvailableSlots` builds start times with
`new Date(date + 'T00:00:00')`, `startOfDay()`, `addMinutes()` and a local
`endOfDay()`. Those operations resolve in the **server's timezone** (often
UTC), not the salon's timezone. On UTC hosts a 09:00 Warsaw booking might
be emitted at 09:00Z rather than 07:00Z in summer. At DST changes, the
day length is 23/25 hours and the 02:xx wall-clock time is missing or
ambiguous. These are correctness/security defects in availability and POST
revalidation, even when online double-booking uses a DB employee lock.

## Change

- Isolated pure Intl-based Warsaw conversion helpers. Use actual IANA
  timezone rules (not fixed +01/+02), return 0 instants on spring-gap
  and 2 on autumn-fold, and compute midnight-to-midnight UTC boundaries.
- For `getAvailableSlots`, query appointments/blocks using these actual
  UTC bounds, enumerate possible real instants for every configured local
  wall-clock slot, and reject bookings whose *actual end* is after
  wall-clock closing time.
- Keep existing timetable, employee service, breaks, appointment conflict,
  notifications, data-model and manual admin booking behavior unchanged.
- No new dependency.

## Verification / outstanding checks

- Added six direct Jest cases for summer/winter UTC mapping,
  spring gap, autumn fold, 23/25-hour days, closing-time comparison,
  malformed date and invalid minute.
- Code committed to GitHub. PR build, typecheck, dedicated tests and
  production-like PostgreSQL/E2E are **required**, not presumed.
- Need a real `CalendarService.getAvailableSlots` database fixture across
  UTC host and DST date, not just pure helper tests.
- PostgreSQL time-block creation/timetable mutation still do not share a
  verified employee-schedule lock with online booking. Parent #1535 must
  not reach production until concurrent write scenarios and rollback are
  validated.
- Native browser dev UAT and owner acceptance remain open.
- Parent review has separate gates; stacked follow-up must be integrated
  without inadvertently including unrelated work.

## Outcome

**NO-GO production.** Complete CI, PG concurrency (booking × block ×
timetable), end-to-end dev UAT and independent review, then decide whether
to merge this follow-up into #1535 before staging rollout.
