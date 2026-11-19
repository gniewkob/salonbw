# Studio V18 booking start from clicked slot or explicit date/time

- **Date:** 2026-11-19
- **Agent:** Codex / ChatGPT
- **PR:** pending (branch `fix/v18-calendar-slot-preservation-20261119`)
- **Source base:** DEV release `6dc96205ef4efa728314bff40be69f0858265d42`

## Finding

Owner's iPhone screenshots showed a selected calendar slot of 19 November
2026, 11:30 in the "Co chcesz dodać?" modal. After choosing "Wizyta", the
drawer showed 23:39 instead. `AppointmentDrawer.tsx` treated every V18
`initialStartTime` in the past as a signal to replace it with `now + 10 min`,
even though `calendar.tsx` and `useAppointmentDrawer` correctly passed the
selected 11:30. The owner clarified two distinct contracts: a grid click
prefills its date/hour; "Nowa wizyta" and customer-context create actions
must require manual selection of both date and hour.

## Change

- Mark calendar time-grid selections with `preserveStartTime` through the
  existing drawer hook/state/props. Retain the selected time in V18, including
  an already-past selection, with an explicit warning. The existing local and
  backend validation still refuse a past appointment write.
- Toolbar "Nowa wizyta" and other non-grid V18 create contexts start with
  no appointment date/time. The primary create action remains disabled until
  the required booking fields, date and hour are complete.
- Extend the existing localized `V18DateInput` with a strictly opt-in booking
  mode that tracks partial date/hour choices without silently filling today's
  date or 09:00 as the other field. Existing date-only and editing flows keep
  their behavior. The time selector shows a localized placeholder until used.
- Do not evaluate booking opening-hours validity for an empty datetime.

## Validation

- RED: 3 tests failed against the old behavior (clicked 11:30 became 23:38;
  V18 toolbar supplied a timestamp; the empty time selector displayed 09:00).
- GREEN: targeted V18 drawer/calendar/date-selector/action tests **108/108**;
  complete panel Jest **769/769** (138 suites).
- Panel TypeScript `tsc --noEmit`: **PASS**.
- ESLint with pre-existing repository-wide Prettier rule excluded: **0 errors**,
  8 warnings in existing tests and hook dependency. Touched small modules
  Prettier **PASS**; `git diff --check` PASS. Full strict formatting is not
  claimed because the parent V18 page and test files have existing formatting
  debt beyond the changed lines.
- Next.js 15.5.28 DEV-targeted production build and generated data: **PASS**
  (115 static pages, 123 data files).
- Hosted mobile UAT and GitHub CI for the new SHA: **NOT VERIFIED**.

## Rollout

No deployment, database mutation, message sending or production change for
this follow-up. The previous `6dc96205` release remains active on DEV as
verified by the owner's SSH release readback and Passenger HTTP smoke.

## Follow-up

Create the source-locked PR, repeat Node 22 exact-SHA Mac QA and guarded DEV
panel staging/activation through the verified manual fallback, then test a
past slot (preserved but not bookable), a future slot (prefilled), and the
blank toolbar/customer creation path on iPhone and desktop. Production stays
outside scope.
