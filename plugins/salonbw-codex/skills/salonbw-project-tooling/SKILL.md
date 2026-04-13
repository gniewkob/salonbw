---
name: salonbw-project-tooling
description: Repo-local SalonBW Codex entrypoint for MCP/tool routing, project operations context, and per-project setup references.
---

# SalonBW Project Tooling

Use this local plugin when the task is about Codex setup, MCP/tool routing, or project operations workflow in this repository.

## Default routing

- Use GitHub tooling for PRs, CI, workflows, deploy dispatches, and review threads.
- Use Playwright for UI smoke tests, screenshot verification, login flows, and post-change vibe checks.
- Use Obsidian for project notes, handoffs, decision capture, and operational runbooks outside the repo.
- Use Figma only when the task depends on design sources or design-to-code parity.
- Use Desktop Commander / shell for repo inspection, local scripts, SSH tunnel helpers, and MyDevil-oriented workflows.
- Use the local `salonbw-devil-ssh` MCP server for MyDevil SSH operations after the plugin is loaded.
- Use the local `salonbw-observability` MCP server for metrics, Grafana, Loki, and Prometheus lookups after the plugin is loaded.
- Use the local `salonbw-runtime-health` MCP server for probes, surface checks, and env inventory after the plugin is loaded.

## Repo-local skills to prefer

- `salonbw-versum-clone` for 1:1 Versum cloning work, parity checks, and progress bookkeeping.
- `salonbw-panel-smoke` for panel smoke tests, login/dashboard verification, calendar checks, and compatibility routes.
- `salonbw-playwright-pro` for stronger Playwright generation/review/fix workflows around panel and landing paths.
- `salonbw-ui-parity-review` for post-clone visual consistency checks, safe UX/UI review, and non-redesign parity refinement.
- `salonbw-deploy-ops` for staging/production deploy order, MyDevil restarts, post-deploy probes, and incident rollback posture.
- `salonbw-db-debug` for database tunnel workflow, PostgreSQL MCP usage, auth/session debugging, and backend data checks.
- `salonbw-observability` for Grafana/Prometheus/Loki checks, metrics triage, and post-deploy telemetry validation.
- `salonbw-ci-fix` for GitHub Actions diagnosis, failing matrix jobs, and minimal CI repair loops.
- `salonbw-release-checklist` for release readiness checks before staging or production rollout.
- `salonbw-incident-commander` for structured incident triage, severity classification, and post-incident follow-up in SalonBW runtime issues.

## MCP setup source of truth

Project-local MCP recommendations and missing integrations are documented in:

- `docs/CODEX_PROJECT_MCP_SETUP.md`

Read that file before changing MCP or plugin setup for this repo.

## Project-specific constraints

- Do not invent production URLs, remote paths, or credentials.
- Treat `dev.salon-bw.pl` as landing, `panel.salon-bw.pl` as auth/dashboard, and `api.salon-bw.pl` as backend.
- Prefer repo-local setup and docs over global Codex configuration when possible.
- Do not commit secrets or machine-specific tokens.
