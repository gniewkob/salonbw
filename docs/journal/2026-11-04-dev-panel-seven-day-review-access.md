# SalonBW DEV panel — bounded preview access

Status: feature branch, not deployed or approved for production.

Window (Europe/Warsaw): 4 November 2026 18:15 to 11 November 2026 18:15.
UTC expiry: 2026-11-11T17:15:00.000Z.

## Purpose
Allow the owner to view the existing Studio dashboard concept in the DEV panel without a browser-level Basic Auth challenge. This is not a public demo, not anonymous application access, and not production authorization.

## Boundaries
- `apps/panel/src/utils/temporaryDevPanelAccess.ts` checks exact DEV panel hostname, both development environment flags, and a fixed start/end on every request.
- `apps/panel/src/middleware.ts` skips only the supplementary DEV Basic challenge during the window. Existing session-cookie login and route guards remain unchanged.
- `apps/panel/src/pages/api/[...path].ts` sends the existing DEV gateway credential from the trusted server to the fixed DEV API origin during that window; no browser copy of the secret.
- The backend development-access middleware and all direct requests to `dev-api.salon-bw.pl` remain protected.
- No change to production, public landing, database, signing keys, users or DEV secrets.
- After the end timestamp, the original gateway behavior resumes without scheduler or follow-up deployment.

## Acceptance gates
1. Exact source SHA passes CI: lint, typecheck, panel build and panel tests.
2. Anonymous GET `/auth/login` via `dev-panel.salon-bw.pl` loads without Basic challenge.
3. Anonymous `/studio-preview?variant=light` and `?variant=atelier` redirect to application login, not dashboard data.
4. Anonymous `/api/users/profile` fails application authentication; no fake login is created.
5. Direct `dev-api.salon-bw.pl/users/profile` continues to require its own Basic gateway.
6. After signing in as a legitimate DEV admin, Studio Light and Atelier load data using the panel proxy.
7. The release remains development-only, noindex/nofollow, and does not change production.
8. Time-bounded tests fail closed at the expiry and for all other hosts and environments.

## Deployment / fallback
Deploy only the tested SHA to `staging` target `panel` with the explicit manual `deploy.yml` dispatch. Do not merge to master. If smoke/authentication checks fail, redeploy the previously observed working panel SHA `2271aac636940723507c7b020a77639ea7da8b7e`.
