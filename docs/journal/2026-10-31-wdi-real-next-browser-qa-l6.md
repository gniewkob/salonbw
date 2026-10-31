# WDI L6 — actual Next.js browser QA with synthetic catalog

**Scope:** Browser smoke runs on the production-built Landing application (`next build` + `next start`) in ephemeral GitHub Actions, *not* on a hand-built HTML mock and **not on protected hosted DEV**.

## Why

WDI L4 prototype screenshots and L5 unit tests cannot prove real Next.js DOM/CSS, brand-photo sizing, mobile overflows, modal keyboard/ESC behavior or SSR catalog category interactions. Protected `https://dev.salon-bw.pl` is not accessible from this session, and must not be bypassed.

## Isolation and provenance

- Start an in-process HTTP fixture listening on `127.0.0.1:43177` only, without external proxying.
- Build and run the actual existing Next.js Landing under a CI-only `NEXT_PUBLIC_DEPLOYMENT_ENV=wdi-ci` value, pointed to the isolated API for server and browser via `API_BASE_URL`, `API_PROXY_URL`, `NEXT_PUBLIC_API_URL=/api`.
- Fixture returns **synthetic** flat Booksy-like service options, an active nested variant catalog, an excluded offline service, synthetic founder content and synthetic hours. It does not contain customer PII.
- This does **not** test real service availability, salon inventory, login against live accounts, Booksy or the production API.
- No emails, payments, appointment creation, production deploy or DEV credentials. No new runtime dependencies.

## CI scope

New standalone workflow `.github/workflows/wdi-browser-qa.yml` triggered by PRs to `master` with landing changes or by explicit manual workflow dispatch. Existing Cypress is reused (no new npm package); screenshot evidence uploaded to GitHub Actions as `wdi-next-browser-<sha>` (14-day retention), with logs.

### Browser checks

| Route | Viewport | Checks |
| --- | --- | --- |
| `/` | 320, 390, 768, 1440 | Hero visible, first-party hero image loaded, no horizontal document overflow, CTA hitboxes ≥44px, modal opens and closes with ESC, focus restored, services link navigates to `/services` |
| `/` | 390 EN/DE | Language from local storage, translated content visible, no page overflow, primary action ≥44px |
| `/services` | 1440 | SSR catalog, desktop sidebar, category count, correct flat Booksy option, nested/inactive/offline exclusions, direct booking modal |
| `/services?offer=care` | 390 | Deep link focuses catalog, manual `Wszystkie` restores all, no document overflow |
| all | as above | Actual Cypress viewport screenshot, logs on success/failure, no mocked Next markup |

## Evidence levels

- **STATIC**: tests, fixture and workflow are committed in a separate PR above WDI #1585.
- **PENDING MEASURED**: resulting GitHub Actions workflow run on the exact branch HEAD, pass/fail screenshots, logs and actual browser assertions.
- **NOT TESTED**: hosted DEV `dev.salon-bw.pl`, real catalog, authenticated user journey, hardware iPhone browser, Lighthouse and production LCP/CLS/INP.

## Execution contract

1. Open PR to `master` temporarily solely because workflow PR triggers are scoped to master; run browser job and standard CI.
2. Inspect actual Cypress failures and screenshots. Fix only verified issues; rerun on updated exact SHA.
3. Restore stacked base to [#1585](https://github.com/gniewkob/salonbw/pull/1585) and keep Draft. Record immutable SHA and workflow run link.
4. Separate real hosted DEV UAT and security remediation PR [#1576](https://github.com/gniewkob/salonbw/pull/1576). No production release without authorization.
