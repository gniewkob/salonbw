---
name: salonbw-deploy-ops
description: Use for staging or production rollout work in SalonBW, including GitHub workflow dispatch, MyDevil restarts, probe order, and post-deploy verification.
---

# SalonBW Deploy Ops

Use this skill for staging or production deploys, rollback-oriented investigation, or runtime changes affecting MyDevil.

## Read first

- `AGENTS.md`
- `docs/DEPLOYMENT_MYDEVIL.md`
- `docs/AGENT_OPERATIONS.md`
- `.github/workflows/deploy.yml`

## Canonical deploy order

1. `api`
2. `public`
3. `dashboard`
4. `admin`
5. `probe`

Map targets as:

- `public` = landing
- `dashboard` = panel
- `admin` = admin
- `api` = backend
- `probe` = smoke only

## Execution rules

- Prefer GitHub Actions workflow `Deploy (MyDevil)` as the deployment path of record.
- Prefer deterministic `gh workflow run ...` dispatches over ad-hoc SCP/SSH deploys.
- Use MyDevil restart commands only for restart and recovery, not as a substitute for deployment.

## Post-deploy checks

- `https://api.salon-bw.pl/healthz`
- `https://dev.salon-bw.pl/`
- `https://panel.salon-bw.pl/`
- route-specific browser smoke for changed surfaces
- metrics presence in Prometheus / Grafana when the change affects backend runtime

## Incident posture

- If deploy succeeds but runtime is degraded, inspect:
  - Passenger logs
  - app logs
  - `/healthz`
  - Prometheus metrics
  - Loki or remote logs if configured
- If Passenger restart is not picked up, use `tmp/restart.txt` touch on the canonical domain/app path.

## Guardrails

- Do not invent remote paths or MyDevil options.
- Do not change symlink deployment paths unless workflow and docs are updated together.
- Update operational docs after any deploy/runtime workflow change.
