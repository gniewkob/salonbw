# SalonBW Studio Design Lab — Dashboard V18 inspiration

Date: 2026-11-04
Status: IMPLEMENTED IN ISOLATED FEATURE BRANCH / DEV DEPLOYMENT NOT YET VERIFIED
Source: user-provided @paulcodes4 Dashboard V18 video and screenshots. This is an independent implementation; creator code and assets were not copied.

## Goal
Compare two distinct administration concepts without changing the existing operational dashboard or backend.

- 01 V18 Light: white / lavender-blue, soft elevated cards, clear daily-operation hierarchy and charts.
- 02 BW Atelier: warm editorial luxury, black-and-white branding, serif headings, dark hero and restrained surfaces.

## Technical scope
- Route: apps/panel/src/pages/studio-preview.tsx
- Scoped stylesheet: apps/panel/src/styles/StudioPreview.module.css
- Existing hooks: useDashboard, useDashboardStats, useStockSummary. Existing API data only.
- Admin-only auth via RouteGuard. Server-side 404 outside DEV mode and explicitly allowed host.
- noindex/nofollow, no demo KPI numbers, no new dependencies or changes to data.
- No modifications to current dashboard, backend, DB, deployment workflows or other apps.

## Review links — only after successful DEV deployment
- https://dev-panel.salon-bw.pl/studio-preview?variant=light
- https://dev-panel.salon-bw.pl/studio-preview?variant=atelier

The landing site dev.salon-bw.pl is a separate application and is not touched.

## Verification / acceptance
1. CI passes on PR head SHA: typecheck, lint, panel build.
2. Authenticated admin accesses both previews; anonymous / client / employee cannot.
3. Production host panel.salon-bw.pl/studio-preview returns 404.
4. KPIs and monthly revenue chart match existing API; missing data never replaced with mock numbers.
5. Desktop, tablet, mobile, touch, keyboard and reduced-motion smoke tests.
6. Current dashboard, calendar and booking flows remain unchanged.
7. UAT approval recorded before any merge into master.

## Deployment
The current canonical workflow .github/workflows/deploy.yml is explicitly dispatched. Use environment=staging, target=panel, ref=exact tested PR commit SHA. The workflow requires CI on exact SHA. Never run production or all targets for preview.
Only call it deployed when staging workflow and live HTTP checks are successful.
