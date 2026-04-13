---
name: salonbw-observability
description: Use for runtime telemetry in SalonBW, including Grafana dashboard checks, Prometheus queries, API metrics inspection, health endpoints, and post-deploy verification.
---

# SalonBW Observability

Use this skill when debugging degraded runtime behavior, validating a deploy, or confirming that backend changes show up correctly in telemetry.

## Primary tools

- `salonbw-observability` MCP for metrics, Grafana, Loki, and Prometheus lookups
- `salonbw-runtime-health` MCP for HTTP probes and target inventory
- local Grafana / Prometheus Docker stack when available

## Default checks

1. Probe:
   - `https://api.salon-bw.pl/healthz`
   - `https://dev.salon-bw.pl/`
   - `https://panel.salon-bw.pl/`
2. Confirm `/metrics` responds from the API.
3. Check the SalonBW Grafana dashboard if local Grafana is running.
4. Inspect request rate, latency, 5xx, resident memory, and domain-specific counters.

## Current dashboard target

If the local OpenBrain Grafana stack is present, use the `SalonBW Overview` dashboard provisioned in the `SalonBW` folder.

## Triage pattern

- Health red but metrics present:
  - inspect application-level dependency failures such as SMTP or third-party tokens
- Rising latency or 5xx:
  - inspect request-rate-by-status and latency quantiles
  - correlate with deploy timestamp and route changes
- Browser breakage with healthy API:
  - suspect cookie/origin config, panel rewrites, or frontend runtime issues

## Guardrails

- Do not treat dashboard absence as runtime failure until provisioning is confirmed.
- Prefer direct Prometheus truth for metric existence when Grafana is stale.
