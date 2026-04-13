---
name: salonbw-release-checklist
description: Use before staging or production rollout to verify CI, smoke, health, env sanity, observability, and documentation readiness for SalonBW.
---

# SalonBW Release Checklist

Use this skill when deciding whether a branch or deploy candidate is ready for staging or production.

## Minimum gate

1. CI is green for the affected area.
2. The changed app builds cleanly.
3. Runtime health is green:
   - `https://api.salon-bw.pl/healthz`
   - changed public surfaces respond
4. Browser smoke passes for affected auth or panel flows.
5. Observability is present for backend-affecting changes.
6. Required docs are updated when runtime/deploy behavior changed.

## By change type

### Frontend-only

- changed route renders
- no obvious console or network failures
- adjacent route still works

### Auth / session / cookie

- real login flow tested
- dashboard load confirmed
- cookie domain/origin sanity checked

### Backend / API

- `/healthz` checked
- `/metrics` checked
- at least one changed endpoint path or UI-backed flow verified

### Deploy / infra / env

- deploy target mapping verified
- MyDevil restart plan clear
- fallback / rollback posture clear
- docs updated

## Docs to update when relevant

- `docs/AGENT_STATUS.md`
- `docs/DEPLOYMENT_MYDEVIL.md`
- `Agent.md`
- `AGENTS.md`

## Release outcome format

Summarize readiness as one of:

- `ready for staging`
- `ready for production`
- `not ready`

Then list the exact blocking risks, not generic concerns.
