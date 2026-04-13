---
name: salonbw-ci-fix
description: Use for debugging and fixing failing GitHub Actions in SalonBW, especially frontend matrix jobs, deploy workflows, probes, and regressions introduced by scoped changes.
---

# SalonBW CI Fix

Use this skill when CI is red, a PR check is failing, or a deploy workflow breaks in GitHub Actions.

## Read first

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `AGENTS.md`

## Preferred tools

- Prefer GitHub workflow inspection via `gh` or GitHub plugin tooling.
- Use repo-local skills and MCP only after extracting the exact failing job and step.
- Prefer the smallest possible code change that fixes the red path.

## Workflow

1. Identify the exact failing workflow, job, and step.
2. Classify the failure:
   - frontend build or lint
   - backend test or build
   - deploy packaging or upload
   - probe or health check
   - environment or secret mismatch
3. Reproduce locally only the failing slice when feasible.
4. Fix the underlying issue, not just the symptom.
5. Re-run the narrowest useful verification locally.
6. If the fix changes deploy/runtime behavior, update the corresponding docs.

## Repo-specific focus

- Frontend matrix includes `public`, `dashboard`, and `admin`.
- Deploy target naming must stay aligned with:
  - `public`
  - `dashboard`
  - `admin`
  - `api`
  - `probe`
- Audit failures only block on high/critical vulnerabilities.

## Good habits

- Read the workflow file before changing app code for a CI issue.
- Inspect whether the failure is infra-only before touching product code.
- Keep CI fixes isolated from feature work unless the failure is caused by the feature itself.

## Guardrails

- Do not merge a speculative CI workaround.
- Do not change secret names or workflow envs without confirming the source of truth.
