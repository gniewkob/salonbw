# SalonBW Codex Plugin

Repo-local Codex plugin for SalonBW development, operations, deploy verification, and observability.

## Use This Plugin First

Start with:

- `salonbw-project-tooling`

Then switch to the narrowest skill that matches the task.

## Skill Map

### Product and UI parity

- `salonbw-versum-clone`
  - Use when cloning or finishing a Versum-derived screen or flow.
  - Best for route mapping, parity rules, and clone progress discipline.

- `salonbw-panel-smoke`
  - Use after panel changes, auth fixes, route rewrites, or deploys.
  - Best for login, dashboard, calendar, customers, services, and settings smoke checks.

- `salonbw-playwright-pro`
  - Use when Playwright work needs more structure than a simple smoke pass.
  - Best for flaky tests, locator review, auth-flow coverage, and browser automation hygiene.

- `salonbw-ui-parity-review`
  - Use after a clone is already functionally close to parity and needs visual consistency or UX sanity checks without drifting into redesign.
  - Best for spacing, hierarchy, state consistency, affordance review, and safe UI polish within clone constraints.

### Backend and data

- `salonbw-db-debug`
  - Use for PostgreSQL tunnel workflow, DB inspection, migrations, and auth/session data debugging.

### CI, deploy, and release

- `salonbw-ci-fix`
  - Use when GitHub Actions are failing and the exact failing job/step needs a minimal repair loop.

- `salonbw-deploy-ops`
  - Use for staging/production rollout order, MyDevil restarts, and post-deploy probes.

- `salonbw-release-checklist`
  - Use before staging or production rollout to decide if a change is actually ready.

### Runtime and incidents

- `salonbw-observability`
  - Use for `/healthz`, `/metrics`, Grafana, Prometheus, Loki, and post-deploy telemetry checks.

- `salonbw-incident-commander`
  - Use when runtime is degraded or production/staging has an outage.
  - Best for severity classification, first-response structure, and recovery confirmation.

## MCP Map

- `salonbw-devil-ssh`
  - MyDevil SSH ops, restarts, logs, and remote commands

- `salonbw-observability`
  - metrics, Grafana, Loki, and Prometheus lookups

- `salonbw-runtime-health`
  - HTTP probes, default surface checks, and env inventory

- `database-server`
  - session-level PostgreSQL access after DB config is loaded

## Practical Routing

- New panel or clone work:
  - `salonbw-versum-clone` -> `salonbw-panel-smoke`

- Backend bug with data symptoms:
  - `salonbw-db-debug` -> `salonbw-observability`

- Failing CI:
  - `salonbw-ci-fix`

- Deploy or post-deploy verification:
  - `salonbw-deploy-ops` -> `salonbw-release-checklist` -> `salonbw-observability`

- Runtime outage:
  - `salonbw-incident-commander` -> `salonbw-observability` -> `salonbw-devil-ssh`

## Recommended Combinations

- `salonbw-panel-smoke` + global `playwright-pro`
  - Use when a change needs stronger browser verification, locator cleanup, or flaky test repair after smoke coverage exists.

- `salonbw-versum-clone` + `salonbw-ui-parity-review` + global `ui-design-system`
  - Use when a cloned screen is already close to source parity and needs controlled cleanup of spacing, hierarchy, tokens, or component consistency without redesigning the flow.

- `salonbw-ui-parity-review` + global `ux-researcher-designer`
  - Use when you want structured usability observations or journey friction notes after the clone is done, not during the copy-first implementation phase.

- `salonbw-ci-fix` + global `release-manager`
  - Use when a failing pipeline is part of a release candidate and you need both CI repair and release readiness discipline.

- `salonbw-observability` + global `observability-designer`
  - Use when diagnosing runtime issues is not enough and the next step is improving dashboards, signals, or alert structure.

- `salonbw-incident-commander` + global `incident-commander`
  - Use when a SalonBW incident needs both the repo-specific topology and a deeper incident-management structure for timeline, severity, or PIR follow-up.

- `salonbw-deploy-ops` + `salonbw-release-checklist` + global `release-manager`
  - Use for higher-risk staging or production rollouts where deploy order, readiness, and rollback posture all matter.

- `salonbw-db-debug` + global `monorepo-navigator`
  - Use when a backend/data issue crosses app boundaries and you need to reason about workspace structure as well as the database path.

## Fast Entrypoints

- "Mam czerwone CI"
  - Start with `salonbw-ci-fix`

- "Login nie działa albo panel pętli auth"
  - Start with `salonbw-panel-smoke`
  - then `salonbw-db-debug` or `salonbw-observability` depending on whether the symptom looks data/config or runtime-related

- "Po deployu coś padło"
  - Start with `salonbw-deploy-ops`
  - then `salonbw-release-checklist`
  - then `salonbw-observability`

- "API działa dziwnie albo dane się nie zgadzają"
  - Start with `salonbw-db-debug`

- "Grafana, Prometheus albo /metrics pokazują problem"
  - Start with `salonbw-observability`

- "Mamy incident na stagingu albo produkcji"
  - Start with `salonbw-incident-commander`

- "Klonuję ekran albo flow z Versum"
  - Start with `salonbw-versum-clone`
  - finish with `salonbw-panel-smoke`

- "Widok jest sklonowany, ale wygląda jeszcze niespójnie albo topornie"
  - Start with `salonbw-ui-parity-review`

- "Potrzebuję mocniejszego Playwright workflow niż zwykły smoke"
  - Start with `salonbw-playwright-pro`

- "Czy to jest gotowe na staging albo production"
  - Start with `salonbw-release-checklist`

## Notes

- Prefer repo-local skills over generic global skills when the task is SalonBW-specific.
- Use generic global skills only when they add technique depth without overriding repo-specific rules.
