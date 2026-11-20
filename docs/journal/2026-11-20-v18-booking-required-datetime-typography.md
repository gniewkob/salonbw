# Studio V18 — required booking date/time typography

- **Date:** 2026-11-20
- **Agent:** Codex
- **Commit:** pending publication
- **PR:** pending publication

## Finding

After the owner confirmed successful functional UAT of the clicked-calendar-slot
and explicit manual date/time workflow, the new appointment drawer showed the
date in medium weight (`500`) and the time in bold (`700`). This came from
`apps/panel/src/styles/V18DateInput.module.css` (`.input` vs `.timeTrigger`).
The existing help text also said only the time was required, although booking
validation requires a date and time together.

## Change

- Use `700` font weight for both date and hour selectors in the existing V18
  datetime row, scoped so date-only CRM fields retain their original `500`;
  no palette, layout, timezone, or booking behavior change.
- Clarify the form message: both date and start hour are mandatory. The
  existing `Start wizyty *` label remains visible.
- Add a regression assertion for the required-field message.

## Validation

- Fail-first targeted Jest test: RED on the old message, GREEN after the fix.
- Full panel Jest: **769/769 PASS**, 138 suites.
- TypeScript `tsc --noEmit`: **PASS** (run after build completion).
- Next.js 15.5.28 production build: **PASS**, 115 prerendered pages and
  123 generated next-data files.
- Scoped ESLint with inherited Prettier debt excluded: **0 errors**, seven
  previously existing warnings in the test module.
- `git diff --check`: **PASS**.
- Hosted visual screenshot and CI for the new commit: **NOT VERIFIED**.

## Rollout

- Previous owner-verified DEV panel release: `ac553b175b3425472f189be083ddee06ed4a91d9`
  with Passenger HTTP smoke and release SHA readback PASS.
- New appearance correction: **not deployed** as of journal creation.
- No production, database, auth, or secret changes.

## Follow-up

Publish a draft PR stacked on #1732, deploy the exact code SHA through the
preflight/staging/Unix-smoke/rollback-protected DEV flow, then visually confirm
date/time parity and required text on an iPhone.
