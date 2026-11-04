# Studio V18 — reference-aligned concept

Status: implementation in a dedicated feature branch, staging deployment requires green exact-SHA CI and acceptance.

## Reference

User-provided original video and screenshots of @paulcodes4, “Dashboard V18 — Modern & Minimal UI”, 24 October 2026.

The original *actual composition* (not just its caption): slim black icon rail, near-white/light-grey workspace, compact lilac welcome ribbon with abstract orb art, three small cards (people, time, activity), right-side mini month calendar and pastel cards. The second scene, “Saved for later”, uses six small pastel cards in a 3-column grid and a collections panel on the right.

The earlier SalonBW concepts misinterpreted that layout as a conventional KPI dashboard with a large hero. This version is a new implementation grounded in those frames; it does not reuse creator CSS, assets or source code.

## UI scope

- New isolated route: `/studio-v18`, admin only, DEV host only, noindex.
- Review tab: compact violet welcome strip; real team from existing `/employees`, real appointment and revenue KPIs, monthly revenue chart, dark pending card, stock alert panel, right-side navigable month calendar and upcoming appointment tiles.
- Modules tab: pastel shortcut cards with real destinations and a collections sidebar; filter controls work.
- Pure CSS blob illustration; no new media downloads, dependencies, fabricated statistics, fake staff, authentication changes or database changes.
- Original `/studio-preview` remains available for side-by-side comparisons and links to the new V18.
- Responsive layout and reduced-motion handling.

## Acceptance

1. Exact-SHA CI PASS: secret scan, lint, typecheck, build, panel tests, backend regression.
2. Only `dev-panel.salon-bw.pl` / local development can render. Production must 404.
3. Admin authenticated access, other roles denied; normal app login and API guards intact.
4. Data and links from existing real backend only. Browser and console checks for empty, error and data states.
5. Desktop, tablet, mobile screenshots compared with the original frames; no template copying or unsupported visual fidelity claims.
6. Owner reviews DEV before any production promotion or merge.

## Deployment

Manual `deploy.yml` dispatch for `environment=staging`, `target=panel` and the exact tested source commit. No prod, no master merge.
