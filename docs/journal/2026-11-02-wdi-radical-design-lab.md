# WDI Design Lab — radically different visual directions (2026-11-02)

- **Owner mandate:** visible qualitative redesign, beyond the editorial L1–L6 refinements.
- **Base:** RC1 `d78a4e295180540d8129542efa54242a538f244b` already deployed on DEV in Actions run [41241376864](https://github.com/gniewkob/salonbw/actions/runs/41241376864), attempt 2, live smoke 200.
- **Branch:** `design/wdi-radical-design-lab-20261102`; standalone **Draft** PR; no master merge or production change.
- **Design entry:** `https://dev.salon-bw.pl/design-lab` **after a separately approved DEV deployment**, not on deployed RC1 yet.
- **Access:** `getServerSideProps` returns notFound outside APP_ENV=development. Synthetic CI exception requires four simultaneous exact flags, including fixed loopback API `127.0.0.1:43177`, and never enables production route.

## Finding

Owner-provided screenshot of RC1 shows split dark-text/photo hero, heavy B&W watermark, gray service cards and conventional compact navbar; the first direction did not change the visual identity substantially enough. Original salon photography, logo, silver token palette, Playfair Display + Open Sans typography and existing booking/catalog data are retained.

## Research / implementation rationale

Industry references, observed 2026-11-02:

- [Figma — web design trends 2026](https://www.figma.com/resource-library/web-design-trends/): expressive typography, intentional motion and contrasted visual hierarchy. **Guidance**, not measured conversion lift.
- [Squarespace — 2026 web design trends](https://www.squarespace.com/blog/web-design-trends): archival-index / editorial visual language and tactile human imagery. **Creative reference**, not source code.
- [GoDaddy — web design trends 2026](https://www.godaddy.com/resources/skills/web-design-trends): 2026 floating minimalism and strong typographic hierarchy for beauty/personal services; guidance, not a mandate.
- [Mane salon concept](https://orpheusdigital.studio/en/works/hair-salon): distinct editorial art direction concept. Agency demonstration is **not** proof of real salon accessibility/performance.
- Brand rules: `.claude/skills/salonbw-brand/SKILL.md` — ONLY black/white/silver/neutral, contrast-safe tokens, max 3 intentional booking entry points, first-party assets, no compulsory animation, PL/EN/DE on Landing.

No third-party layouts, copyrighted assets, fonts or code were copied into this PR.

## Three production-shaped, development-only alternatives

| Design | Visual mechanism | Content hierarchy | Service discovery |
| --- | --- | --- | --- |
| A / Fashion Editorial | Giant contiguous typographic masthead, asymmetrical original photo, magazine caption overlay | Brand → story → booking | Three-column editorial spread → original API-backed services |
| B / Cinematic Monochrome | Full-height immersive B&W photo, dark scrims, anchored film-title typography | Atmosphere → appointment → offerings | High-contrast ruled service index |
| C / Swiss Atelier | Cool-white modernist grid, asymmetrical photo diptych, small folio labels | Precise care positioning → booking | Structured numbered index |

All variants use first-party salon photos from `/images/hero/*`, the **existing `BookingModal`**, real PL/EN/DE translations, and link into the **existing SSR `/services` page** with `?offer=hairdressing|care|extensions` applied to DEV API data. **No prices are shown in design previews**; real prices/durations/variants remain in the existing service catalog. This avoids fabricating data or duplicating booking logic.

## Implementation

- `src/pages/design-lab.tsx`: DEV-only SSR guard, selector and 3 real React compositions, one booking modal, SEO noindex, preserves canonical Landing by isolation.
- `src/styles/DesignLab.module.css`: semantic B&W style system, real layout differences, responsive phone/tablet/desktop, pref-reduced-motion.
- `src/components/BookNowFab.tsx`: excludes design-lab so booking does not duplicate on mobile.
- `src/__tests__/designLabRoute.test.tsx`: SSR privacy, fallback, three compositions, real service URLs and booking modal; CSS module Jest mock.
- Browser QA: production-built Next + synthetic loopback API; screenshot widths and modal/selector assertions at 390 and 1440 px, planned **6 additional full-page screenshots and 7 Cypress cases** alongside existing 12.

## Quality gate / owner choice

- [ ] Exact-commit CI + Security Audit green
- [ ] Actual Next browser QA green; 6 new screenshots inspect at 390 and 1440; no horizontal overflow
- [ ] Owner compares A/B/C. Do not equate screenshots to accessibility or measured conversion.
- [ ] **Only after** approved DEV deploy, confirm actual site `/design-lab` after Basic login and link to real DEV `/services`.
- [ ] Choose a direction, then apply it to standard homepage + real services UX and retest. **This PR is a direction comparison, not final production redesign.**
- [ ] Add local licensed font assets to make `next/font/google` build deterministic in a separate, verified scope; current RC1 attempt 1 failed before SSH while attempt 2 passed unchanged.

Do not merge to master, change customer data, send notifications or deploy production.
