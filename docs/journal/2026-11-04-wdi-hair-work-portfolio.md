# WDI 08 — The Art of Hair | SalonBW original work portfolio

**Scope:** preview-only `/design-lab?variant=hairwork` on DEV. The canonical landing, API, salon workflow, database and production remain unchanged.

## Problem and solution
Prior design studies used mostly static interior images. Public salon gallery contains authentic published hairstyle photos, but chronological social posts include unrelated seasonal and marketing posts. This new design uses an explicit owner-approved curated set: seven real salon works, with editorial asymmetry and genuine hair colour, surrounded by Black & White monochrome identity.

## Curation provenance
The public `https://salon-bw.pl/api/gallery?limit=24` yielded 24 posts; an authenticated *user-owned* workflow was **not** used. GitHub Actions #41930152498 fetched 18 public images as evidence (only public media URLs; no token). The user gave permission to use salon imagery on the DEV site. The exact owner-approved seven JPEGs were imported into `apps/landing/public/images/hair-portfolio/` with source media IDs and SHA-256 in `selection.json`. The site does not call Instagram CDN at render time, uses Next Image optimization, and can work independently of Instagram expiration.

## Experience
- Copper waves hero + six distinctive salon work photos (blonds, updos, gloss).
- Navigation, in-page discovery, optional accessible lightbox using the app's existing shared viewer.
- Canonical booking modal and current `/services` and `/gallery` links; no invented prices.
- PL/EN/DE, responsive mobile grid, keyboard focus, native scroll and reduced motion.
- All other Design Lab variants remain unchanged; owner chooses after browser review.

## Acceptance evidence required
- Exact SHA CI green: frontend lint/typecheck/unit/build and security/backend regressions.
- Real browser QA (Cypress + Playwright) at 390/768/1440 with all seven first-party image files loaded and no horizontal overflow.
- Booking opens and closes, full gallery lightbox keyboard, links retain canonical URLs.
- Immutable SHA staging deployment and HTTP smoke, then **visual owner acceptance** before any canonical homepage integration.
