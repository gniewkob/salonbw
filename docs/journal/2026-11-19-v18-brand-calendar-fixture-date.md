# V18 brand QA — deterministic synthetic mobile calendar date

- **Date:** 2026-11-19
- **PR:** #1728, `design/panel-brand-tokens-v18-20261119`
- **Base browser run:** `dcd96eef6103bfc369460173de9c74222e0749f9`

## Finding

Owner-run local Playwright on the exact candidate SHA selected eight tests:
seven passed; the mobile calendar test failed twice at
`studio-v18-calendar-integrity.spec.ts:169` because its fixture appointment was
on 2026-11-09 but the page initially selects `new Date()` (2026-11-19). The
mobile week agenda groups events under the selected week's Monday through Sunday,
so the static fixture falls outside the currently displayed week. This is a
test setup defect, not evidence of a calendar runtime regression.

## Change

Before switching to week view, select 2026-11-09 using the existing date-picker
UI and confirm the calendar API was requested with that date. Keep the fixture,
appointment assertion, mobile screenshot and all later date/navigation checks.
No application, API, database, auth, CSS or deployment changes.

## Validation

- **RED (owner Mac):** 7 passed, 1 failed, 0 skipped on the previous SHA.
- **Static source verification:** `git diff --check` PASS; unchanged brand
  integration contract 4/4 PASS. A TypeScript syntax-only check was unavailable
  (the local Node 24 parser does not support `import type` in `--check` mode;
  package installation is network-blocked). Browser execution is still needed.
- **GREEN:** NOT VERIFIED until Playwright runs on the new exact SHA.

## Rollout

No deployment or production mutation. PR remains Draft.

## Follow-up

Run the synthetic 8-case desktop/mobile brand visual suite on the new exact
SHA, require eight passing tests with zero skips/failures, and review the
generated screenshots and network traces before considering DEV activation.
