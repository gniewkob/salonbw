---
name: salonbw-panel-smoke
description: Use for Playwright-driven or manual smoke verification of panel flows, including auth, dashboard, calendar, customers, services, settings, and compatibility routes.
---

# SalonBW Panel Smoke

Use this skill after panel changes, auth fixes, route rewrites, or deploys that may affect customer or staff flows.

## Primary tools

- Prefer Playwright for browser-driven verification.
- Use `salonbw-runtime-health` MCP for quick target checks before opening the browser.
- Use GitHub checks if validating a deploy or CI-driven preview.

## Default smoke path

1. Confirm the public targets respond:
   - `https://panel.salon-bw.pl/`
   - `https://api.salon-bw.pl/healthz`
2. Open the panel and verify login or registration flow.
3. Confirm dashboard load after authentication.
4. Verify the changed route and one adjacent route.
5. If the change touches calendar, validate:
   - `/calendar`
   - compat rewrites for `/events/*`, `/settings/timetable/schedules/*`, `/graphql`, `/track_new_events.json`
6. If the change touches customer/staff data, verify at least one data-backed screen renders without 401/500 failures.

## Minimum route set

- `/calendar`
- `/customers`
- `/services`
- `/settings`

Use `/products`, `/statistics`, `/communication`, or `/extension` when the change touches those surfaces.

## Failure triage

- Login loop or auth failure:
  - inspect cookie scope
  - inspect `COOKIE_DOMAIN`
  - inspect `FRONTEND_URL`
  - inspect CSRF refresh behavior
- Blank screen or API errors:
  - inspect network requests
  - inspect `/healthz`
  - inspect metrics and logs via observability / MyDevil SSH

## Guardrails

- Do not claim success without a real browser pass for auth-sensitive changes.
- Do not sign off on panel auth changes based only on unit tests.
