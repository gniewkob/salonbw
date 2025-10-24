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
