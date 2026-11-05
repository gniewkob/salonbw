# Studio V18 — visual and interaction audit

## Scope and evidence

Source reference: owner-provided @paulcodes4 *Dashboard V18* frames (reviewed in the conversation, **not copied into the repository**). Target: `/studio-v18` on `dev-panel.salon-bw.pl`, admin-only development preview.

Evidence classes:
- **STATIC — verified in code:** compact icon rail, light canvas, lilac welcome strip, pastel saved-module cards, small calendar and upcoming visits are present in the implementation. Previously the *Pulpit* rail icon was hardcoded active even while viewing Studio V18. Several captions were 9–10px and used low-contrast grey colors. Some failed data requests were indistinguishable from an empty set.
- **MEASURED — calculated from source color constants:** previous `#98939e` and `#99939f` text over white were approximately 3.0:1; new secondary `#6b6471` over white is approximately 5.7:1. This is a pairwise color calculation, **not** a WCAG compliance or user-testing claim.
- **NOT OBSERVED:** current authenticated DEV pixels at desktop/mobile, real client data states, Playwright screenshots on the live host. The audit environment could not resolve the DEV hostname and had no authenticated browser session.

## Changes

1. Added the actual Studio V18 route to the navigation rail and its `aria-current="page"` state. The conventional dashboard link no longer appears active on the preview route.
2. Returned the lavender banner and metric cards to a more compact visual rhythm, closer to the reference, while keeping the SalonBW data and navigation.
3. Improved metadata and actionable text sizes, grey-on-white legibility and hit areas for navigation/calendar controls. Respects the existing mobile layout and reduced-motion handling.
4. Distinguished loading, missing and error states in team, statistics and stock cards; no synthetic business figures are created.
5. Added a Playwright fixture test for the **real Studio V18 route**: desktop (1366/1920), mobile (390), no horizontal overflow, selected calendar date link, saved-module persistence and screenshot capture. Only synthetic API responses and a synthetic user are used.

## Browser test command (local test checkout only)

Run from the repository root:

```bash
NEXT_PUBLIC_DEPLOYMENT_ENV=development NEXT_PUBLIC_AUTH_COOKIE_PREFIX=dev_ DEV_ACCESS_USER=studio-fixture DEV_ACCESS_PASSWORD=studio-fixture-password pnpm --filter @salonbw/panel exec playwright test tests/visual/studio-v18.spec.ts --project=desktop-1366 --project=desktop-1920 --project=mobile-390
```

The local Playwright configuration starts the built Next app on port 3100. These credentials are deliberately fixture-only and **must not** be used on live DEV/production. Browser requests to the fixture API are intercepted. The tests intentionally skip unless the local environment is explicitly configured; they do not use live user credentials or live client data.

Screenshots, when run, are written to Playwright's per-test output paths. Compare them against the owner-supplied reference separately; do not claim pixel-exact recreation.

## Release gate

1. Exact-SHA CI lint/typecheck/build/tests/security — required to propose a staging deployment.
2. Staging panel `deploy.yml` from the exact green SHA; leave `master`, production, and the seven-day Basic Auth boundary unchanged.
3. Verify deployment logs' `APP_RELEASE`, HTTP 200, anonymous login/redirect (without Basic gateway) and rendered HTML build match.
4. Run authenticated browser UAT on DEV (desktop/mobile and keyboard) to confirm visuals and tasks. Until then the visual verdict remains **NOT TESTED**; owner sign-off is needed before replacing the default dashboard.

Do not treat a fixture screenshot, successful build or status 200 as proof of production-quality UX.
