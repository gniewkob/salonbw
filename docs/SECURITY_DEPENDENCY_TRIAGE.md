# Security/Dependency Triage Report (Sprint 45 Step 1)

Date: 2026-05-17  
Branch: `master`  
Baseline HEAD: `ef9ea42765e8e7d5d72751889fb323b1f99f685c`

## Scope

- Dependabot alerts triage for default branch (`master`)
- Local `pnpm audit` snapshot (monorepo)
- `gitleaks/gitleaks-action@v2` Node 20 deprecation warning check
- No dependency updates or workflow changes in this step

## Executive Summary

- Open Dependabot alerts on default branch: **14**
- Severity split: **3 high**, **9 medium**, **2 low**, **0 critical**
- Highest-risk open items are concentrated around `xlsx` (SheetJS) in backend dependency graph.
- Most medium/low alerts are transitive lockfile findings with available patched versions and can be handled in controlled patch/minor updates.
- `gitleaks/gitleaks-action` latest release is `v2.3.9` (2025-04-17), but action runtime is still `node20`; deprecation warning is expected from upstream action runtime metadata.

## Data Sources

- GitHub API: `GET /repos/gniewkob/salonbw/dependabot/alerts?state=open`
- Local: `pnpm audit --json`
- Upstream action metadata:
  - `gitleaks/gitleaks-action` latest release (`v2.3.9`)
  - `action.yml` at `v2` and `v2.3.9`

## Open Dependabot Alerts (default branch)

### Totals

- `high`: 3
- `medium`: 9
- `low`: 2

### Alert Inventory

| Alert | Severity | Package | Direct/Transitive | Scope | Manifest | Fixed Version | Area | Upgrade Type |
|---|---|---|---|---|---|---|---|---|
| #123 | high | `xlsx` | direct | development | `backend/salonbw-backend/package.json` | none indicated | backend | major/unclear (manual) |
| #125 | high | `xlsx` | inconclusive | runtime | `pnpm-lock.yaml` | none indicated | backend/root lockfile | major/unclear (manual) |
| #126 | high | `xlsx` | inconclusive | runtime | `pnpm-lock.yaml` | none indicated | backend/root lockfile | major/unclear (manual) |
| #216 | medium | `@nestjs/core` | transitive | runtime | `pnpm-lock.yaml` | `11.1.18` | backend | patch/minor likely |
| #181 | medium | `file-type` | transitive | runtime | `pnpm-lock.yaml` | `21.3.1` | backend toolchain | major likely (transitive) |
| #229 | medium | `follow-redirects` | transitive | runtime | `pnpm-lock.yaml` | `1.16.0` | backend | patch/minor likely |
| #235 | medium | `postcss` | transitive | runtime | `pnpm-lock.yaml` | `8.5.10` | landing/build | patch/minor likely |
| #236 | medium | `uuid` | transitive | runtime | `pnpm-lock.yaml` | `11.1.1` | backend | patch likely |
| #237 | medium | `ip-address` | transitive | runtime | `pnpm-lock.yaml` | `10.1.1` | backend transitive | patch likely |
| #198 | medium | `picomatch` | transitive | development | `pnpm-lock.yaml` | `4.0.4` | tooling | patch likely |
| #210 | medium | `picomatch` | transitive | development | `pnpm-lock.yaml` | `2.3.2` | tooling | patch likely |
| #212 | medium | `serialize-javascript` | transitive | development | `pnpm-lock.yaml` | `7.0.5` | tooling | patch likely |
| #12 | low | `min-document` | transitive | runtime | `pnpm-lock.yaml` | `2.19.1` | backend transitive | patch likely |
| #178 | low | `@tootallnate/once` | transitive | runtime | `pnpm-lock.yaml` | `3.0.1` | backend transitive | patch/minor likely |

## Key Risk Notes

- `xlsx` (`^0.18.5` in backend) is the only **direct** high-severity package currently open.
- For `xlsx` alerts, Dependabot data indicates no straightforward `first_patched_version` resolution in current graph; this likely needs a targeted backend compatibility check and possibly broader package replacement/major move.
- `next` high/medium historical alerts are already fixed in this branch line (apps currently on `next@15.5.18` for panel and landing).

## Local `pnpm audit` Snapshot (Monorepo)

Command result: `pnpm audit --json` exited non-zero with vulnerabilities present.

Audit metadata snapshot:
- vulnerabilities: `high=5`, `moderate=15`, `low=2`
- total dependencies scanned: `1833`

Interpretation:
- `pnpm audit` includes additional advisories that are not necessarily identical to the current open Dependabot set (different matching/resolution model and ecosystem timing).
- For Sprint 45 Step 1 decision-making, Dependabot open alerts on default branch remain the canonical triage list; audit output is supporting signal.

## gitleaks-action Node 20 Deprecation

Current CI usage:
- `.github/workflows/ci.yml` uses `gitleaks/gitleaks-action@v2`

Upstream status checked on 2026-05-17:
- Latest release: `gitleaks/gitleaks-action@v2.3.9` (published 2025-04-17)
- `action.yml` at both `v2` and `v2.3.9` declares:
  - `runs.using: "node20"`

Conclusion:
- Updating from `@v2` to `@v2.3.9` does **not** remove the Node 20 runtime deprecation warning by itself.
- Safe minimal path for now: keep existing action pin (`@v2`) and track upstream move away from `node20`.
- No workflow permission changes are required for a pure version pin bump within the same action major line.

## Recommended Remediation Order (Step 2 input)

1. **Backend high-risk direct dependency first**
- Triage `xlsx` usage in backend (`backend/salonbw-backend`), define safe remediation strategy (upgrade path or controlled replacement).
- Treat as separate focused change due to high severity + no clear auto-fix.

2. **Low-risk transitive patch/minor wave**
- Batch transitive updates where fixed versions are explicit and compatibility risk is low (`ip-address`, `uuid`, `follow-redirects`, `min-document`, `@tootallnate/once`, selected tooling packages).
- Keep scope separated by area (backend/tooling vs frontend) to reduce blast radius.

3. **Potentially disruptive medium items requiring validation**
- `file-type@21.3.1` path may imply non-trivial transitive shifts; validate lockfile and runtime behavior.
- `@nestjs/core` transitive bump should be validated with backend smoke/typecheck.

4. **gitleaks runtime deprecation**
- Do not change now unless upstream publishes runtime update (Node 22/24).
- Re-check upstream action metadata in next dependency/security sprint.

## What Can Be Safely Patched via Patch/Minor (Candidate List)

Patch/minor-biased candidates (subject to lockfile resolution):
- `ip-address` -> `10.1.1`
- `uuid` -> `11.1.1`
- `follow-redirects` -> `1.16.0`
- `postcss` -> `8.5.10`
- `serialize-javascript` -> `7.0.5`
- `picomatch` -> `2.3.2` and `4.0.4` (two transitive branches)
- `min-document` -> `2.19.1`
- `@tootallnate/once` -> `3.0.1`

Requires separate sprint / deeper analysis:
- `xlsx` high-severity cluster (#123/#125/#126) due to missing straightforward patched resolution in current dependency graph and likely compatibility impact.
- `file-type` transitive jump candidate due to likely major version implications.

## Step 1 Closure Recommendation

Sprint 45 Step 1 can be considered **formally complete** after docs commit + CI/Deploy monitoring, because:
- triage inventory is complete,
- risk-ranked remediation path is documented,
- no prohibited broad upgrades were performed,
- no app/backend/workflow behavior changes were introduced.

## Step 3 — Post-Patch Alert Snapshot (after commit `a30427e1`)

Date: 2026-05-17

### Before vs After (Dependabot open alerts)

- Baseline (Step 1): `14` open (`3 high`, `9 medium`, `2 low`)
- After Step 2 patch wave: `7` open (`4 high`, `3 medium`, `0 low`)
- Net reduction: `-7` open alerts (50% reduction)

### Alerts Closed Since Baseline

Closed alert IDs:
- `12`, `178`, `210`, `212`, `229`, `235`, `236`, `237`

These correspond to low/medium transitive dependency updates covered by the Step 2 scope (`ip-address`, `uuid`, `follow-redirects`, `postcss`, `serialize-javascript`, `@tootallnate/once` and related lockfile paths).

### Remaining Open Backlog

Still open alert IDs:
- `123`, `125`, `126`, `181`, `198`, `199`, `216`

Current open set by package:
- `xlsx` (high): `#123` (direct in backend `package.json`), `#125`, `#126`
- `picomatch` (high/medium): `#199`, `#198`
- `@nestjs/core` (medium): `#216`
- `file-type` (medium): `#181`

### Interpretation

- Step 2 met its goal: significant reduction through low-risk transitive updates without app/runtime workflow changes.
- `xlsx` remains the highest-risk unresolved area and requires dedicated remediation planning (possible compatibility/functional impact).
- `file-type` and `@nestjs/core` remain valid follow-up items, but were intentionally outside the minimal-risk patch wave boundary.

## Step 4 — XLSX Closure Snapshot (after commit `6bcc7a6b`)

Date: 2026-05-17

### Status Update

- Open Dependabot alerts: `4` (`1 high`, `3 medium`)
- Closed `xlsx` alerts: `#123`, `#125`, `#126` (**no longer open**)

### Current Open Backlog

- `#199` high — `picomatch`
- `#198` medium — `picomatch`
- `#181` medium — `file-type`
- `#216` medium — `@nestjs/core`

### Interpretation

- Sprint 46 remediation objective for `xlsx` is complete from dependency-alert perspective.
- Remaining security/dependency backlog is now concentrated in:
  - `picomatch` (one high + one medium),
  - `file-type` (medium),
  - `@nestjs/core` (medium).

## Sprint 47 Step 1 — Picomatch Path Assessment

Date: 2026-05-17

### Alert scope

- `#199` high (`GHSA-c2c7-rcm5-vvqj`) — `picomatch` ReDoS
- `#198` medium (`GHSA-3v7f-55p6-f55p`) — `picomatch` glob matching issue
- Both alerts target range `>=4.0.0 <4.0.4`, patched in `4.0.4`

### Current open state

- Open alerts total: `4`
- Open set:
  - `#199` high — `picomatch`
  - `#198` medium — `picomatch`
  - `#181` medium — `file-type`
  - `#216` medium — `@nestjs/core`

### Dependency-path findings

`pnpm why picomatch -r` in the current branch resolves `picomatch` to:
- `4.0.4` (via `@angular-devkit/*`, `jest-util`, etc.)
- `2.3.2` (via `micromatch` / `anymatch` branches)

No `picomatch@4.0.0-4.0.3` path appears in the local resolved graph.

### Why alerts may remain open

Most likely causes (given local graph):
- Dependabot alert dedup/recalculation lag after recent lockfile churn
- stale advisory linkage to previously resolved lockfile nodes that should now be superseded

No clear evidence in current lockfile of an actually unresolved `4.0.0-4.0.3` path.

### Recommendation before patching again

1. Trigger Dependabot re-evaluation (allow one scan cycle) and re-check open alerts.
2. If `#199/#198` persist after refresh, apply one targeted lockfile nudge (minimal no-op resolution refresh) and re-check.
3. Only if a concrete vulnerable path is shown in updated alert metadata, add another narrowly scoped override.

## Sprint 47 Step 2 — Targeted Rollup/Picomatch Override

Date: 2026-05-17

### Action applied

- Added scoped overrides:
  - `@rollup/pluginutils>picomatch: ^4.0.4`
  - `@rollup/plugin-commonjs>picomatch: ^4.0.4`

Rationale:
- Remaining vulnerable path in lockfile was tied to `@rollup/plugin-commonjs@28.0.1` and `@rollup/pluginutils@5.3.0` resolving `picomatch@4.0.3`.

### Local result after lockfile refresh

- `pnpm-lock.yaml` no longer contains `picomatch@4.0.3`
- `pnpm why picomatch -r` resolves only:
  - `picomatch@4.0.4`
  - `picomatch@2.3.2`

### Dependabot status immediately after push

- Open set still reports:
  - `#199` high (`picomatch`)
  - `#198` medium (`picomatch`)
- This is likely advisory recalculation lag on GitHub side; no local vulnerable 4.0.0-4.0.3 path is visible.

### Next check

- Re-check Dependabot after one additional scan cycle; if alerts persist with same metadata, capture fresh alert payload and escalate for lockfile/advisory synchronization follow-up.

## Sprint 48 Step 1 — Remaining Medium Alert Assessment

Date: 2026-05-17

### Current open alerts

- `#216` medium — `@nestjs/core` (`GHSA-36xv-jgw5-4q75`)
- `#181` medium — `file-type` (`GHSA-5v7r-6r5c-r473`)

### Path analysis

`#216` (`@nestjs/core`):
- lockfile resolves `@nestjs/core@11.1.15`
- advisory patched version: `11.1.18`
- package range in backend `package.json` is already compatible (`^11.1.14`)
- remediation type: low-risk patch/minor lockfile lift

`#181` (`file-type`):
- two lines exist in lockfile:
  - `file-type@21.3.4` (patched)
  - `file-type@16.5.4` (vulnerable range)
- vulnerable `16.5.4` path is pulled via `jimp@0.22.12` -> `@jimp/core`
- remediation is not a simple override-only patch in current graph; likely requires `jimp` family upgrade/replacement with compatibility checks

### Recommended remediation order

1. **`@nestjs/core` first** (`#216`):
- clear patch target (`11.1.18+`)
- lower functional risk than image-stack refactor

2. **`file-type` second** (`#181`):
- tied to `jimp` transitive tree
- requires focused remediation sprint (upgrade strategy and compatibility verification)

## Sprint 48 Step 2 — Patch `@nestjs/core` Vulnerability

Date: 2026-05-17

### Action applied

- Performed targeted lockfile lift for NestJS backend runtime packages to patched line:
  - `@nestjs/core` resolved to `11.1.19` (`>=11.1.18` patched advisory threshold)
  - paired Nest packages resolved in lockfile to `11.1.19` (`@nestjs/testing`, `@nestjs/websockets`) to keep version line coherent
- Kept `backend/salonbw-backend/package.json` semver ranges unchanged (`^11.1.14`) per minimal-change policy.

### Scope guardrails respected

- No changes to application/backend source code.
- No changes to workflows.
- No changes to `file-type` / `jimp` remediation scope.
- No mass dependency update.

### Local validation

- `pnpm --filter salonbw-backend test` ✅
- `pnpm --filter salonbw-backend typecheck` ✅
- `pnpm --filter salonbw-backend build` ✅
- `pnpm --filter @salonbw/panel test` ✅ (workspace safety check)

### Expected security impact

- Dependabot alert `#216` (`@nestjs/core`) should close after GitHub advisory re-evaluation on updated lockfile.
- Remaining backlog after closure should be focused on `#181` (`file-type` via `jimp`).
