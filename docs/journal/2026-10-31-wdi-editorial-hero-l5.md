# WDI L5 — editorial homepage hero

- **Data:** 2026-10-31
- **Branch:** `design/wdi-landing-editorial-hero-l5-20261031`
- **Baseline:** WDI [#1584](https://github.com/gniewkob/salonbw/pull/1584), SHA `49f6dbca38711427af18d9b12e4d0cf5033680eb`.
- **Scope:** `apps/landing/src/components/SplitHero.tsx`, existing CSS and targeted regression test. No backend, database, photo/media replacement, booking logic, third-party dependencies or production runtime.

## Finding — STATIC

The old homepage `SplitHero` specified `height: 100svh; min-height: 640px`, with mobile `min-height: 65svh` for left text and `35svh` for the photo. Combined with long headings, two CTA controls, optional nearest-slot copy and PL/EN/DE strings, this **risks visual clipping** rather than allowing the content to determine page height. Independent entrance animations, slow image zoom, moving scroll hint and diagonal split conflicted with the selected calm Editorial direction. This is static code evidence, **not a measured real-device defect or conversion decline**.

## Change

- Replace fixed viewport height with content-driven layout, responsive `min-height` only on desktop, auto-growing mobile text panel and bounded mobile photo panel.
- Preserve logo, Playfair/Open Sans, first-party hero photo `slider1.jpg`, brand monochrome tokens, all PL/EN/DE copy, `NearestSlotTeaser`, existing auth/booking modal, `/services` route and existing head metadata.
- Add main `section[aria-labelledby]` connected to `h1`, explicit 48px CTA targets, keyboard-visible outlines and mobile full-width buttons.
- Remove purely decorative hero diagonal, vertical scroll ticker and initial fade/zoom animations; leave core content visible before JS animation and keep the CTA hover microinteraction with reduced-motion override.
- Match responsive `next/image` `sizes` to actual desktop/mobile picture widths without changing image file or quality assumptions.
- Add a Jest regression for heading, correct catalog link, booking modal open/Escape and image contract.

## Visual direction

Implement WDI selected [Editorial A + Price-first B](../design/landing/DESIGN_DECISIONS.md) while protecting B's catalog layout in PR #1584 and the L1–L3 service/booking contracts. Do not introduce ThreeUI or new paid images.

## Validation

- Exact-head CI: **PENDING** as of document creation; replace claim through PR comment after inspected result.
- Real authenticated DEV browser, 320/390/768/1440 screenshots and Lighthouse/CLS: **NOT TESTED** for this implementation. Isolated HTML design lab from #1584 is not evidence of Next runtime.
- Required: full code/test CI, visual accessibility and localization check, actual booking flow, confirmation of portrait crop/alt text from existing first-party photos.

## Rollout and follow-up

**No DEV or PROD changes**; PR stays Draft and stacked above #1584. Before release, complete real screenshot and image-crop review, verify CTA clickability and cross-language reflow, resolve separate Security Audit HIGH #1576, then merge stacked PRs in order with explicit authorization.
