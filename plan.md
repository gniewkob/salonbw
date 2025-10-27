# Implementation Plan (October 2025)

This plan reflects the current state of the repository after the recent deployment/operations hardening work. Completed milestones are listed for context; upcoming milestones capture the next engineering priorities.

## ✅ Completed Milestones

- **Operational baselines** – Repository audited, pnpm workspaces aligned, lint/typecheck/test scripts enforced via Husky, Node 22 standardised.
- **Developer automation** – macOS onboarding, SSH tunnel scripts (`pnpm tunnel:start|stop`), comprehensive environment variable docs (`docs/ENV.md`), and agent runbooks (`docs/AGENT_STATUS.md`, `docs/AGENT_OPERATIONS.md`).
- **Backend readiness** – `/healthz` endpoint, SMTP-backed `/emails/send`, NestJS build pipeline, CI smoke tests.
- **Frontend hardening** – Security headers, role-based dashboards, contact form integration, standalone builds for Passenger deployment.
- **CI/CD & Deployments** – `ci.yml` matrix, deployment workflows for API/public/dashboard/admin resilient to PHP-based Passenger domains, all production apps deployed from commit `35b08ad4`.

## 🔜 In Progress / Next Up

| ID | Workstream | Description | Owner | Target |
| --- | --- | --- | --- | --- |
| P1 | Monitoring & Observability | Add structured logging, runtime metrics, and external uptime checks (e.g. health ping & email smoke). Expand `docs/AGENT_OPERATIONS.md` with alert response playbooks. | TBD | Nov 2025 |
| P2 | Product Retail Module (POS) | UI flows + API endpoints for recording product sales, stock adjustments, and commissions (see ROADMAP backlog). Requires inventory schema update & dashboard screens. | TBD | Q1 2026 |
| P3 | Automated Appointment Reminders | Re-enable WhatsApp/SMS reminders with configurable schedules and opt-out. Include delivery monitoring and retries. | TBD | Q1 2026 |
| P4 | Reporting & Analytics | Generate downloadable daily/weekly reports covering bookings, revenue, product sales, and staff performance. Integrate with dashboard exports. | TBD | Q2 2026 |
| G1 | Performance & Caching | Re-introduce Next.js image optimisation, enable HTTP compression, and configure CDN caching to keep First Load JS under 120 kB for public flows. Ship behind feature flags and verify with Lighthouse. | TBD | Dec 2025 |
| G2 | Conversion & Tracking | Add persistent booking CTAs, streamline contact forms, and instrument GA4/Facebook Pixel funnels for homepage → booking completion. Document tracking in `docs/CI_CD.md` and validate via `docs/RELEASE_CHECKLIST.md` smoke tests. | TBD | Dec 2025 |
| G3 | SEO & Local Content | Produce location/service landing pages with structured data (`LocalBusiness`, FAQ, Review). Align content updates with release checklist and update sitemap/robots entries. | TBD | Jan 2026 |
| G4 | Trust & Social Proof | Surface testimonials, stylist bios, and gallery highlights on key pages; integrate review aggregation API if available. Ensure deployment steps include asset refresh per `docs/DEPLOYMENT_MYDEVIL.md`. | TBD | Jan 2026 |
| G5 | Retention & Lifecycle | Launch referral/loyalty experiments and post-visit email sequences via CRM integration. Capture configuration/reporting steps in `docs/AGENT_OPERATIONS.md`. | TBD | Feb 2026 |
| G6 | Dashboard Productivity | Optimise dashboard bundles (lazy-load FullCalendar, virtualise lists) and surface actionable KPIs. Verify via E2E specs (`e2e-frontend-chrome.yml`) before triggering deploy workflow. | TBD | Feb 2026 |

### Growth Initiative Playbooks

- **G1 – Performance & Caching**
  - Reinstate `next/image` optimisation (`images.unoptimized=false`), audit critical hero assets, and configure responsive sizes.
  - Enable Brotli/Gzip compression via Passenger (update Nginx include) and add cache headers for `/_next/static` during deploy (`deploy.yml` static rsync step).
  - After each change, run `npm run build`, Lighthouse CI, and follow [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md) pre-release tests.
  - Deploy with `.github/workflows/deploy.yml` and confirm `_buildManifest.js` via the smoke test in the workflow summary.

- **G2 – Conversion & Tracking**
  - Add above-the-fold booking CTA + sticky contact actions; simplify forms with progressive disclosure.
  - Instrument GA4 events (view_item, begin_checkout, purchase) and Facebook Pixel equivalents; document IDs in [`docs/ENV.md`](docs/ENV.md).
  - Update [`docs/CI_CD.md`](docs/CI_CD.md) with any new secrets (e.g. `GA_MEASUREMENT_ID`) and extend Cypress specs to assert analytics tags fire.
  - Use the deployment runbook [`docs/DEPLOYMENT_MYDEVIL.md`](docs/DEPLOYMENT_MYDEVIL.md) to roll out and verify conversion events post-release.

- **G3 – SEO & Local Content**
  - Create templated location/service pages and add schema markup; ensure `sitemap.xml` and `robots.txt` updates are covered by automated smoke checks.
  - Coordinate releases using the checklist (section 1 sanity, section 3 deploy) and document new content in `docs/AGENT_STATUS.md`.
  - Submit updated sitemap via Search Console after deploy; note follow-up tasks in the roadmap backlog.

- **G4 – Trust & Social Proof**
  - Embed testimonial carousels, stylist bios, and before/after galleries with lazy-loaded media.
  - If integrating external review APIs, add secrets to GitHub and reference retrieval logic in [`docs/AGENT_OPERATIONS.md`](docs/AGENT_OPERATIONS.md) for support staff.
  - Validate asset delivery with the Passenger static link check added in `frontend/app.cjs`/`app.js` before promoting to production.

- **G5 – Retention & Lifecycle**
  - Choose CRM/ESP (e.g. Klaviyo); sync booking data via backend cron or webhooks.
  - Define referral/loyalty data schema updates; run migrations per the deployment runbook and extend release checklist with migration callouts.
  - Add monitoring hooks so reminders/report emails emit metrics (`salonbw_emails_sent_total`); create alert thresholds in the observability workstream.

- **G6 – Dashboard Productivity**
  - Profile dashboard bundle sizes; defer heavy modules and lazy-load calendar/analytics widgets.
  - Introduce KPI widgets (bookings today, upcoming gaps); back them with `/api` endpoints and unit/E2E coverage.
  - Follow CI guidance in [`docs/CI_CD.md`](docs/CI_CD.md) to ensure Chrome E2E runs on each PR; deploy via GitHub workflow to keep `tmp/restart.txt` touch automated.

### POS migration draft (2025-10-24)

- Create `product_sales` table (id, productId, soldAt, quantity, unitPrice, discount, employeeId, appointmentId nullable) to record retail transactions.
- Create `inventory_movements` table (id, productId, delta, reason enum, referenceId/referenceType, note, createdAt, actorId) to preserve stock history and reconcile adjustments.
- Add nullable `productSaleId` foreign key to `commissions` (and backfill existing rows) so product sales can generate commission records independent of appointments.
- Consider denormalised daily aggregates once raw sales flow is stable; defer until access patterns confirmed.

## 🧭 Working Agreements

- Keep `docs/AGENT_STATUS.md` current after every deployment or infrastructure change (commit SHA, workflow IDs, verification notes, known issues).
- When updating automation, prefer additive changes and document the rationale in the runbooks.
- Every new feature must ship with **unit tests**, **E2E coverage**, and updated **docs** (README sections, runbooks, roadmap).
- Changes impacting infrastructure (secrets, hosting, new services) must capture required steps in [`docs/DEPLOYMENT_MYDEVIL.md`](docs/DEPLOYMENT_MYDEVIL.md) and be referenced from this plan.

## 📌 References

- Roadmap themes: [`ROADMAP.md`](ROADMAP.md)
- Status dashboard: [`docs/AGENT_STATUS.md`](docs/AGENT_STATUS.md)
- Operations runbook: [`docs/AGENT_OPERATIONS.md`](docs/AGENT_OPERATIONS.md)
- Release process: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)
