---
name: salonbw-db-debug
description: Use for PostgreSQL tunnel workflow, database MCP usage, schema inspection, migration-aware debugging, and auth/session data checks in SalonBW backend work.
---

# SalonBW DB Debug

Use this skill when the task involves backend data, migrations, auth/session persistence, broken reads/writes, or production-like DB diagnostics.

## Read first

- `docs/TUNNELING.md`
- `docs/ENV.md`
- backend env files only as needed

## Primary tools

- Prefer `database-server` MCP once configured in-session.
- Use the DB tunnel script when remote MyDevil PostgreSQL access is required.
- Use shell or backend scripts only when MCP coverage is insufficient.

## Workflow

1. Confirm the intended environment:
   - local DB
   - tunneled MyDevil DB
   - production-like remote inspection
2. Validate tunnel or socket availability before blaming the application.
3. Inspect schema, critical tables, and the exact records related to the bug.
4. Correlate DB state with:
   - `/healthz`
   - backend logs
   - panel/browser behavior
5. If the issue touches auth, inspect:
   - user/session records
   - token refresh behavior
   - cookie domain/origin config

## Good use cases

- broken appointments/services reads
- auth works in API but fails in panel
- migration drift
- environment mismatch between backend and panel
- production data sanity checks without editing data blindly

## Guardrails

- Never put credentials into git.
- Avoid write queries unless the user explicitly wants operational intervention.
- When using production-like data, default to inspection first, modification second.
