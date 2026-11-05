# WDI SalonBW craft pass — editorial storytelling and mobile preview

DEV-only `/design-lab`: no canonical homepage, backend, pricing, database or production modifications.

- Compact scrollable variant controls replace the multi-row mobile picker; the actual selected concept is now visible near the first fold.
- Atelier adds a contrasting photographic editorial chapter using existing salon assets, localized PL/EN/DE narrative, a real gallery link and existing booking modal.
- All existing variants, canonical service URLs and booking integration are preserved; no dependencies added.
- Acceptance requires exact-SHA green CI, browser screenshot comparison mobile/desktop, keyboard and booking regression and live DEV smoke.
- Do not promote to canonical homepage before explicit visual approval.
