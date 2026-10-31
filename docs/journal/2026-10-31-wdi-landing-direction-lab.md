# WDI Design Director — pierwszy cykl Landing

- **Data:** 2026-10-31
- **Branch:** `design/wdi-landing-direction-lab-20261031` stacked on L3 [#1583](https://github.com/gniewkob/salonbw/pull/1583).
- **Scope:** design research, comparative prototype, implementation of one small B-layout slice in real Next.js and its test. No API/DB/MyDevil changes.

## Finding
Current site has a full-screen hero, three home teaser paths (L1) and a functional catalog with nested variants (L2/L3). However, before this cycle there was no documented evidence-backed visual direction for how the brand introduction, category navigation, price comparison and booking should work as one experience. Existing CSS fixes addressed symptoms, not a unified information architecture.

## Research
Direct primary site examples, reviewed as design references: [Sassoon](https://salon.sassoon-global.com/), [Salon SCK services](https://www.salonsck.com/services/), [Duck & Dry](https://duckanddry.com/), [The Salon Project](https://thesalonproject.com/). Patterns and caveats: [WDI_REFERENCE_BOARD](../design/landing/WDI_REFERENCE_BOARD.md). No visual assets copied.

## Experiment
Three interactive variants with consistent synthetic catalogue and demo-only booking modal. Variants differ in typography scale, hero composition and category/service navigation: A editorial, B price-first sidebar, C card-grid discovery. Chromium Playwright: 9/9 viewport × variant combinations (390/768/1440) PASS for basic overflow, filtering, native disclosures and demo dialog behavior. Not a real API, authenticated browser UAT or A/B conversion experiment.

## Decision
A for homepage visual tone; B for `/services` information architecture. C rejected as primary for service catalog because cards add repeated chrome and length. All preserve monochrome/silver, Playfair/Open Sans contract, no WebGL.

## Build
Added desktop left sidebar to existing `/services` category controls with sticky bounded scrolling above 900px, retained horizontal chips below 900px, without changing server/API/booking logic; added a Jest regression for category selection and displayed prices.

## Validation
Prior L3 CI [#41228867672](https://github.com/gniewkob/salonbw/actions/runs/41228867672): 29/29 tests plus frontend/backend checks PASS except unrelated HIGH audit. **This branch needs its own exact-SHA CI**; evidence to be recorded after PR. [QA_REPORT](../design/landing/QA_REPORT.md) lists limits and acceptance.

## Rollout
None. This work is intentionally stacked; keep draft pending hosted DEV QA and independent security advisory correction [#1576](https://github.com/gniewkob/salonbw/pull/1576).

## Follow-up
Extend winning A/B direction to hero and services in carefully sequenced PRs; inspect real first-party photos; test actual DEV at 390/1440, keyboard, EN/DE, Lighthouse; only then discuss merge/deploy.
