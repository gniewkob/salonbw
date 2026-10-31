# WDI Landing — QA Report (design lab / first implementation)

**Date:** 2026-10-31  
**Evidence nomenclature:** MEASURED = executed; OBSERVED = inspected screenshot; STATIC = source review; HYPOTHESIS = unvalidated.  
**Scope boundary:** HTML design lab on synthetic data is **not** the hosted Next.js application. Production and hosted DEV not deployed/touched.

## Prototype evidence — MEASURED

Three different responsive designs (A Editorial, B Price-first, C Discovery) ran in an isolated Chromium Playwright fixture. Source HTML and 9 screenshots/JSON results were generated as a conversation artifact (not in this GitHub PR). The fixture is **not connected** to real catalog or login.

| Dimension | A | B | C | Test |
| --- | --- | --- | --- | --- |
| Mobile 390px | PASS | PASS | PASS | no document-level horizontal overflow |
| Tablet 768px | PASS | PASS | PASS | no document-level horizontal overflow |
| Desktop 1440px | PASS | PASS | PASS | no document-level horizontal overflow |
| Category controls | PASS | PASS | PASS | clicking category restricts 4-item synthetic list to 2 matching items |
| Native disclosure | PASS | PASS | PASS | Enter toggles open and closed |
| Booking demonstration | PASS | PASS | PASS | opens demo-only modal and Escape closes |
| Keyboard/no-JS | PARTIAL | PARTIAL | PARTIAL | native `details` works; prototype filter relies on JS |
| Touch size | PASS | PASS | PASS | measured category button height ≥44px, booking button ≥44px |
| Browser exceptions | 0 | 0 | 0 | Playwright `pageerror` |
| Reduced motion | PASS (fixture) | PASS (fixture) | PASS (fixture) | emulated `prefers-reduced-motion: reduce`; no auto animation in lab |

**9/9 viewport × variant combinations PASS.** This does not validate actual application CSS, API, mobile GPU, font metrics or network waterfalls.

## Existing implementation baseline — verified separately

Exact prior L3 CI [#41228867672](https://github.com/gniewkob/salonbw/actions/runs/41228867672) on SHA `9a55537`: public frontend lint/typecheck/build/Jest **PASS** (6 suites / 29 tests), backend **PASS**. Global CI **FAIL** from two older HIGH advisories (`follow-redirects` and `joi`), separate PR [#1576](https://github.com/gniewkob/salonbw/pull/1576).

## Newly implemented B candidate — status

- **STATIC:** `/services` service catalog now has a desktop left-side filter and a fluid content column, with horizontally scrollable categories under 900px. This keeps the existing React state, server-side categories, live prices and BookingModal unchanged.
- **TEST ADDED:** a regression for category selection, price retention and semantic group.
- **PENDING:** exact candidate SHA GitHub CI (fill with run after PR is opened), actual Next/browser screenshots, live DEV API and authentic booking redirect, Lighthouse.
- **NOT CLAIMED:** production accessibility audit, real UX uplift, fully validated keyboard screen reader, photo quality or real authenticated booking.

## Release gate checklist

- [ ] L4 candidate CI exact-SHA lint/typecheck/build/Jest; review failures with logs.
- [ ] Visual 320, 390, 768, 1440 on **running Next.js app** and the isolated DEV catalog.
- [ ] Existing NAV, login modal, booking button, targeted `serviceId`, `onlineBooking=false`, PL/EN/DE.
- [ ] Keyboard tab/shift-tab, focus, native `summary`, zoom/reflow, no forced motion.
- [ ] Lighthouse accessibility and LCP/CLS/INP with recorded URL, hardware/emulation and run.
- [ ] First-party salon photo review, SEO/canonical/schema and actual copy signoff.
- [ ] Independent dependency advisory PR #1576 and stacked L1 → L2 → L3 → this PR before possible merge.
- [ ] Explicit owner approval before production promotion.
