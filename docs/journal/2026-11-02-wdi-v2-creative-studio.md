# WDI v2 — radykalne warianty wizualne Landing (kandydat)

- **Data:** 2026-11-02
- **Source baseline:** RC1 `d78a4e295180540d8129542efa54242a538f244b`, Landing DEV deployed (but business UAT pending).
- **Status:** Draft candidate; **no** master merge, hosted DEV deploy or production change under this task.

## Finding

Real hosted DEV screenshot (2026-11-02) showed a conventional split hero with fragmented brand heading, a faded B&W mark, standard cards and limited aesthetic differentiation. The user explicitly requested a **transformational visual redesign**, not minor polishing.

## Independent references and provenance

1. [M/COUPE, Awwwards](https://www.awwwards.com/websites/360/) — monochrome fashion-editorial identity. Historical reference (2022), **not** claimed as 2026 release.
2. [Addendum Salon, The First The Last](https://thefirstthelast.agency/work/addendum-salon) — salon-space photography, cinematic framing and clear booking invitation.
3. [Mane salon concept, Orpheus (2026)](https://orpheusdigital.studio/en/works/hair-salon) — contemporary editorial concept linking brand imagery and service discovery; explicitly **concept only**, not measured sales evidence.
4. [Impronta, ET Studio](https://www.e-t.studio/works/impronta-website) — award-backed visual direction (2025) using clear editorial hierarchy and motion supporting comprehension.
5. [Spoke & Weal](https://spokeandweal.com/) — practical navigation to services/booking. Reference behavior only.

All image assets used here originate in the SalonBW repository. No external creative assets, 3D runtime, unlicensed design files, stock photos or new npm packages.

## Change

- Three distinct compositional implementations sharing existing i18n, hero CTA, modal and real service deep links:
  - **Fashion Editorial** — full-bleed venue photography with overlaid expressive display typography; asymmetrical service photo triptych.
  - **Cinematic Monochrome** — restrained full-black stage with central vertical image and film-style information hierarchy, dark gallery-like service discovery.
  - **Swiss Atelier** — light modernist masthead, two-photo architectural collage, numbered service index with typographic rhythm.
- One session-preserving design switcher gated by `NEXT_PUBLIC_DEPLOYMENT_ENV=development`, never shown in PROD or synthetic baseline WDI CI (`wdi-ci`). Query `?edition=fashion|cinematic|atelier` supports direct comparisons; switching never changes API state.
- Both home and `/services` respond visually; service catalog continues using the existing SSR API, category focus, variants/duration/price and booking IDs. No service pricing fabricated in preview.
- Existing `SplitHero` / `ServicesTeaser` stay the production path. Existing PR #1587 remains unchanged.
- UX has no forced WebGL, infinite marquees, scroll hijacking or delayed-visibility effects. CSS-only transitions respect reduced motion; images remain first-party.
- A dedicated built-Next Cypress workflow compares 390/1440 visual/functional states and emits full-page PNGs.

## Validation status

GitHub CI, Cypress and visual comparison **PENDING** at time of initial commit; fill in exact run URLs after results. Synthetic loopback API is not hosted DEV business acceptance. Screen-reader audit, real mobile Safari, measured INP/LCP/CLS and owner approval remain separate.

## Rollout

**NOT DEPLOYED.** Candidate for creative review on PR. Preview must go through current staging exact-SHA CI/deployment gate after explicit approval. No production deployment.

## Follow-up

Inspect side-by-side screenshots and fix P0/P1 issues; choose one direction, remove the dev switcher and unused variants before production; run actual protected DEV catalog/rebooking UAT.
