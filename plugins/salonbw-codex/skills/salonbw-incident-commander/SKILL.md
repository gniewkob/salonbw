---
name: salonbw-incident-commander
description: Use for SalonBW production or staging incidents: classify severity, establish a response path, gather evidence from health, logs, metrics, and SSH, and define follow-up actions.
---

# SalonBW Incident Commander

This is a SalonBW-specific adaptation of the broader incident workflow from `claude-skills-main`, narrowed to MyDevil, panel/api/landing topology, and the current observability stack.

## Use this when

- production or staging is degraded
- login is looping or failing
- deploy succeeded but runtime is broken
- health checks or probes fail
- a customer-facing outage needs structured triage

## Severity model

- `SEV1`: panel or api broadly unavailable, auth fully broken, or customer-facing outage across core flows
- `SEV2`: major degradation, subset of users blocked, repeated 5xx or serious data-path failure
- `SEV3`: isolated route or feature failure with workaround
- `SEV4`: cosmetic issue, low-risk operational gap, or non-production-only problem

## First 10 minutes

1. Identify impacted surface:
   - landing
   - panel
   - api
   - admin
2. Check:
   - `https://api.salon-bw.pl/healthz`
   - landing/panel probe status
   - Prometheus metrics presence
3. Pull the first evidence:
   - app or passenger logs
   - recent deploy target/run
   - browser symptom
4. Decide whether the issue is:
   - deploy regression
   - runtime dependency problem
   - auth/session/config bug
   - infra/connectivity problem

## Response tools

- `salonbw-runtime-health`
- `salonbw-observability`
- `salonbw-devil-ssh`
- GitHub workflow history
- Playwright for user-visible confirmation

## Communication format

Keep incident updates short and operational:

- impact
- current status
- suspected cause
- next check
- next update time

## Exit criteria

- impacted user flow is confirmed working again
- health endpoint is green or understood
- a root-cause hypothesis exists
- follow-up items are captured if the fix was only mitigative

## Guardrails

- Do not over-escalate cosmetic issues as incidents.
- Do not call an incident resolved based only on process restarts; confirm user-visible recovery.
- Do not mix feature work into incident mitigation unless the feature caused the outage.
