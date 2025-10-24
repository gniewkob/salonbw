# Product Roadmap

This roadmap captures the medium-term product and platform goals. Dates are indicative; each initiative will be broken down into issues/PRs as scoping matures.

## Q4 2025 – Operational Excellence

- **Observability & Alerting**
  - Centralise structured logging for API and Next.js apps.
  - Health/uptime monitoring (HTTP `/healthz`, `/emails/send` smoke).
  - Document on-call response playbooks in `docs/AGENT_OPERATIONS.md`.
- **Hardening CI/CD**
  - Add automated verification for deployments (post-run curl checks).
  - Cache optimisation for standalone builds on mydevil.

## Q1 2026 – Front‑of‑House Enhancements

- **Retail Point-of-Sale (POS)**
  - Allow staff to record product sales (quantity, price, commission) directly in the dashboard.
  - Sync inventory counts and generate receipts/invoices.
  - Expose reporting endpoints (daily/weekly sales).
- **Automated Appointment Reminders**
  - Restore WhatsApp/SMS notifications with configurable lead times.
  - Include retry logic, customer opt-in/out, and tracking metrics.

## Q2 2026 – Insights & Growth

- **Advanced Reporting**
  - Build dashboards/exports for revenue, utilisation, product sales, staff performance.
  - Support CSV/PDF exports and email subscriptions.
- **Marketing Integrations**
  - Explore integrations with Instagram/Facebook for gallery updates and promotional campaigns.
  - Evaluate loyalty programme add-ons (points, referral tracking).

## Backlog / Ideas

- Multi-location support (location-aware scheduling, inventory, reporting).
- Customer self-service portal for product purchases and appointment packages.
- Mobile-friendly staff view with quick actions (check-in/out, instant notes).

---

Roadmap items feed into the implementation plan tracked in [`plan.md`](plan.md). Update both documents whenever priorities change or new major initiatives are confirmed.
