# Codex Project MCP Setup

This document tracks which Codex plugins and MCP integrations are already useful in `salonbw`, which ones are missing, and what is required to enable them without storing secrets in the repo.

## Already useful in this project

- `GitHub` plugin
  - PR review, Actions triage, workflow dispatch, deploy monitoring.
- `Playwright` MCP
  - UI smoke tests, screenshots, auth flow checks, visual parity verification.
- `Obsidian` MCP
  - Project notes, handoffs, operating logs, decisions, and external runbooks.
- `Figma` MCP
  - Optional; use only when implementing from design files.
- `Desktop Commander` / shell
  - Repo inspection, local scripts, tunnel helpers, and MyDevil workflows.

## Enabled now

### `database-server`

Configured in the current Codex session from the local backend env.

Current source:
- `backend/salonbw-backend/.env`

Notes:
- this is session-level activation, not a committed secret-bearing config
- if the SSH tunnel is down, the MCP will fail until the DB becomes reachable again

### `salonbw-devil-ssh`

Repo-local MCP server implemented in:

- `plugins/salonbw-codex/scripts/devil_ssh_mcp.py`

Plugin wiring:
- `plugins/salonbw-codex/.mcp.json`

Provided tools:
- `devil_target`
- `devil_www_list`
- `devil_restart_domain`
- `devil_tail_log`
- `devil_exec`

Configuration model:
- prefers `MYDEVIL_SSH_USER` + `MYDEVIL_SSH_HOST` if exported
- otherwise falls back to the local SSH alias `devil`
- optional key override via `MYDEVIL_SSH_KEY_PATH`

Security model:
- no keys or secrets are stored in the repo
- the server uses the local machine SSH configuration or env vars

### `salonbw-observability`

Repo-local MCP server implemented in:

- `plugins/salonbw-codex/scripts/observability_mcp.py`

Provided tools:
- `obs_targets`
- `api_metrics`
- `prometheus_query`
- `loki_query`
- `grafana_health`
- `grafana_search_dashboards`

Env model:
- `SALONBW_API_URL`
- `GRAFANA_URL`
- `PROMETHEUS_URL`
- `LOKI_QUERY_URL`
- `GRAFANA_API_KEY`
- `LOKI_BASIC_AUTH`

What works immediately:
- raw API metrics via `api_metrics`

Notes:
- Grafana, Loki, and Prometheus queries still require the corresponding local env vars to be set
- no secrets are stored in the repo

### `salonbw-runtime-health`

Repo-local MCP server implemented in:

- `plugins/salonbw-codex/scripts/runtime_health_mcp.py`

Provided tools:
- `runtime_targets`
- `probe_url`
- `probe_surface`
- `probe_default_stack`
- `env_inventory`

Configuration model:
- defaults to:
  - `https://api.salon-bw.pl`
  - `https://dev.salon-bw.pl`
  - `https://panel.salon-bw.pl`
  - `https://salon-bw.pl`
- can be overridden with:
  - `SALONBW_API_URL`
  - `SALONBW_LANDING_URL`
  - `SALONBW_PANEL_URL`
  - `SALONBW_LEGACY_URL`

Security model:
- shows env presence without printing secret values

## Per-project local plugin

This repo now includes a local Codex plugin:

- `plugins/salonbw-codex`

Marketplace entry:

- `.agents/plugins/marketplace.json`

Purpose:
- keep project-specific Codex guidance in-repo
- avoid encoding repo behavior only in global Codex state

## Manual prerequisites checklist

- backend env contains a valid `DATABASE_URL`
- SSH tunnel details are available if the database is only reachable through MyDevil
- Grafana API key is available outside git if Grafana queries are needed
- Prometheus URL is confirmed from the observability stack owner if Prometheus queries are needed
- Loki query endpoint or Grafana URL is available if Loki queries are needed
