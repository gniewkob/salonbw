# Studio V18: desktop hour label and clock icon overlap

- **Date:** 2026-11-21
- **Scope:** DEV panel booking UI only
- **Source base:** `b8861bfde55ceb720f0b5b0ec0612c1a1bbea0c1` (deployed/owner readback PASS)
- **PR:** stacked draft against `fix/v18-required-datetime-ux-20261120`

## Finding

Owner's hosted DEV screenshot confirms `Wybierz godzinę` text reaches the
clock SVG in the new appointment form at desktop width.
`apps/panel/src/styles/V18DateInput.module.css` uses a 132px desktop time
track with `white-space: nowrap`; the existing visual test only checked
390/375/320px, where a different 50/50 grid rule applies.

## Change

Reserve a 190px desktop time track in `.dateTimeRow`. Keep the existing
351–430px equal columns and the <=350px stacked layout, state management,
date-only CRM inputs, and appointment API unchanged.
Add a CSS regression contract and a desktop Playwright check for text overflow
and physical separation from the icon at 1366/1024/768/480px.

## Validation

- Pre-change owner DEV evidence: `V18_DEV_DEPLOY=PASS` at `b8861bfde55ceb720f0b5b0ec0612c1a1bbea0c1`;
  visual issue reproduced in owner screenshot
- Source inspection and patch construction: completed via GitHub
- Jest / typecheck / build / Playwright on new commit: **NOT RUN / UNKNOWN**
- RED→GREEN runtime verification: **NOT RUN** (requires local Mac browser)

## Rollout

Not started for this correction. Hosted DEV remains on `b8861bfde55ceb720f0b5b0ec0612c1a1bbea0c1`.
No production, API, database, or runtime mutations.

## Follow-up

Run exact-SHA Node22 CSS Jest test, panel typecheck/build and desktop Playwright;
then deploy the reviewed SHA through the existing guarded DEV-only flow and
verify the form in the live browser before marking the PR ready.
