# P0 Isolated client booking journey + staff price fix

- Date: 2026-10-27
- Issue: #1529
- Source snapshot: existing tested PR #1523 `f48916f3e238eb6aebea3a9ee427658aa2315d60`, containing #1522 + #1519 history.
- Base: master; isolated copy of **12 explicitly whitelisted landing/panel files** only.
- Production: **NOT DEPLOYED**.

## Finding

Existing PRs #1519 → #1522 → #1523 are stacked. Merging #1523 imports
all #1519 UI removal, which is independent of the client's bug and
premature prior to Booksy cutover. First registration click from booking
could miss because validation text shifted the clickable link; after
registration the chosen service context was lost. Manual staff price could
be overwritten by a late catalogue response (including explicitly typed 0).

## Change

Whitelisted only:
- Landing: `BookingModal.tsx`, `404.tsx` and their focused Jest tests.
- Panel: login/register pages, `postLoginRoute.ts`, and their Jest tests.
- Panel finalization: `FinalizationModal.tsx` and Jest tests.

No changes to `communication/[id].tsx`, `salon-shell.css`, Booksy import/
reconcile/cleanup, `UAT_PLAN.md`, `PROJECT_STATE.md`, backend, secrets or
production operations. Fixes login-to-registration and registration-to-booking
return path restricted to local `/booking`, preserving serviceId.
Fixes delayed catalogue overwrite of staff's final price.
Fixes 404 CTA to point at the client's own `/booking`, not admin appointments.

## Validation and release gates

- Existing source PRs had green CI; **that does not validate this isolated
  branch**. Run exact new SHA CI lint/typecheck/build/Jest and independent
  review before any merge.
- Synthetic browser dev UAT is still needed for first-click registration
  with `serviceId`, slot selection and price persistence. Do not claim
  real end-to-end validation from unit tests alone.
- Parent PR #1523 must not be merged blindly in addition to this extracted
  PR. Retain admin/communication UX from #1519 as separate cutover decision.
- No online POST concurrency/availability changes here: #1535/#1536/#1537
  own that separate gate.
- No production merge or deploy; Booksy is not switched off.
