# Sprint 46 Step 1 — XLSX Remediation Assessment

Date: 2026-05-17  
Branch: `master`

## Scope

- Assess backend `xlsx` usage and risk posture
- Define remediation options and recommended path
- No dependency or source-code changes in this step

## Current State

Open Dependabot items related to `xlsx`:
- `#123` (high) — direct dependency in `backend/salonbw-backend/package.json`
- `#125` (high) — lockfile path
- `#126` (high) — lockfile path

Package location:
- `backend/salonbw-backend/package.json`: `devDependencies.xlsx = ^0.18.5`

## Usage Inventory (Code-Verified)

`xlsx` is used only in two backend utility scripts:

1. `backend/salonbw-backend/scripts/import-products.ts`
- Reads workbook from `IMPORT_PRODUCTS_XLSX` or fallback local file `produkty.xlsx`
- Uses `XLSX.readFile(...)` and `XLSX.utils.sheet_to_json(...)`
- Converts rows to product entities and writes to DB

2. `backend/salonbw-backend/scripts/import-services.ts`
- Reads workbook from `IMPORT_SERVICES_XLSX` or fallback local file `uslugi.xlsx`
- Uses `XLSX.readFile(...)` and `XLSX.utils.sheet_to_json(...)`
- Converts rows to services/categories/variants and writes to DB

No other backend runtime modules import `xlsx`.

## Execution Surface

Observed invocation points:
- `package.json` scripts:
  - `import:products`
  - `import:services`
- No CI workflow references these scripts
- No deploy workflow/manual deploy docs require these scripts as standard deployment steps

Operational interpretation:
- Exposure is primarily in manual/operator-run import tooling, not in API request-path runtime.
- Risk remains relevant because vulnerable parser is present and can be executed on supplied files during import operations.

## Risk Assessment

### Threat model (practical)

- Trigger condition: operator runs import script on malicious/untrusted `.xlsx` input
- Likely impact class (per advisories): DoS / prototype-pollution style parser abuse
- Blast radius: import process, potential import host resource pressure, possible bad data import
- Lower likelihood in normal production request flow because backend HTTP handlers do not parse xlsx files

### Why it still matters

- Dependency is direct and high severity in advisories
- Manual import workflows are part of operational lifecycle (data migration/seeding)
- Current implementation has no pre-validation/sandboxing around workbook parser invocation

## Remediation Options

### Option A — Remove xlsx from backend (preferred long-term)

Approach:
- Replace `.xlsx` import pipeline with safer canonical input format (`.csv` or `.json`)
- Keep transformation logic, swap parser layer

Pros:
- Eliminates current high-severity dependency cluster (`#123/#125/#126`)
- Simplifies supply-chain/security posture

Cons:
- Requires migration of existing operator input artifacts/process
- May need conversion tooling/docs updates

### Option B — Isolate import parser out of backend repo/runtime boundary

Approach:
- Move xlsx parsing to separate one-off migration utility (outside deployed backend package graph)
- Backend ingests sanitized intermediate format (JSON/CSV)

Pros:
- Keeps backend runtime/dependency graph cleaner
- Reduces accidental invocation in standard environments

Cons:
- Operational complexity (extra tool + handoff)
- Requires strict procedure/documentation discipline

### Option C — Keep xlsx temporarily with hard controls (short-term containment)

Approach:
- Continue current scripts, but enforce:
  - trusted-file-only policy,
  - size limits and prechecks before parse,
  - isolated execution context for imports,
  - explicit runbook controls and approvals.

Pros:
- Lowest implementation cost immediately

Cons:
- Does not close alert cluster
- Maintains risky dependency in graph

## Recommended Path

1. Adopt **Option A** as target state (remove `xlsx` from backend package graph).
2. Use **Option C** as temporary control until removal is completed.
3. Defer any major dependency swap in production branch until dedicated implementation sprint.

## Proposed Sprint 46 Follow-up (implementation)

Step 2 (design + minimal PoC):
- Define canonical import format (`csv` recommended)
- Prototype parser replacement for one script (`import-services.ts` first)

Step 3 (migration + cleanup):
- Migrate second script (`import-products.ts`)
- Remove `xlsx` from backend dependencies
- Re-run Dependabot/audit verification and document closure

## Acceptance Criteria for Future Remediation Sprint

- `xlsx` removed from `backend/salonbw-backend/package.json`
- Import scripts still support required business fields and DB writes
- Operator runbook updated with new input format and validation steps
- Dependabot `xlsx` alerts (`#123/#125/#126`) closed

## Sprint 46 Step 2 PoC Status (2026-05-17)

Implemented in `backend/salonbw-backend/scripts/import-services.ts`:
- Added CSV input support via `IMPORT_SERVICES_CSV=<path>`
- Added fallback auto-detection for `.csv` path passed through `IMPORT_SERVICES_XLSX`
- Kept existing XLSX path unchanged (backward compatible)
- Added `IMPORT_SERVICES_DRY_RUN=1` mode to validate parse+mapping without DB writes

Run examples:

```bash
# CSV path (preferred for PoC validation)
IMPORT_SERVICES_CSV=/abs/path/uslugi.csv \
IMPORT_SERVICES_DRY_RUN=1 \
pnpm --filter salonbw-backend import:services

# Existing XLSX path remains supported
IMPORT_SERVICES_XLSX=/abs/path/uslugi.xlsx \
pnpm --filter salonbw-backend import:services
```
