# Agent Status Dashboard

_Last updated: 2026-01-21 (production readiness verification and database password update)_

## Platform Architecture

The Salon Black & White platform consists of the following services:

- **`api.salon-bw.pl`** - Backend API (NestJS) serving all business logic, authentication, and data
- **`dev.salon-bw.pl`** - **New client-facing frontend** (Next.js) - public marketing site for end users to browse services and book appointments (**bez logiki dashboardu**)
- **`panel.salon-bw.pl`** - **Management dashboard** (Next.js) - authenticated portal for:
  - **End users**: View reservation history, manage bookings
  - **Admins**: Manage services, reservation calendar, appointments, user management
- **`salon-bw.pl`** - **Legacy service** (being phased out, redirects to www.salon-bw.pl)

**Current Focus:** Development on `dev.salon-bw.pl` (client-facing) and `panel.salon-bw.pl` (management dashboard), with `api.salon-bw.pl` as the backend.

## Current Release

| Component | Commit | Workflow Run ID | Finished (UTC) | Environment | Notes |
| --- | --- | --- | --- | --- | --- |
| API (`api.salon-bw.pl`) | `a98d923d` | `18857312225` | 2025-10-27 22:09 | production | Redeployed after security fixes; `/healthz` 200 |
| Public site (`dev.salon-bw.pl`) | `1b65bbf5` | `18859475724` | 2025-10-27 23:57 | production | Deployed static assets fix, image optimization + caching, GA4/Web Vitals wiring; smoke checks OK |
| Dashboard (`panel.salon-bw.pl`) | `a98d923d` | `18857314859` | 2025-10-27 22:10 | production | Redeployed from master; smoke checks passed |

Verification:

- `curl -I https://api.salon-bw.pl/healthz` → `200 OK`
- `curl -s -X POST https://api.salon-bw.pl/emails/send …` → `{"status":"ok"}` (SMTP: kontakt@salon-bw.pl on `mail0.mydevil.net`)

## Recent Incidents

### 2026-01-21: Database Password Update and Production API Recovery

**Timeline:**

- **21:00 UTC** - Database password changed in MyDevil panel to `B04Pak8q3{1D72$vB`
- **21:15 UTC** - GitHub secrets updated (`MYDEVIL_DB_PASSWORD`, `PGPASSWORD`)
- **21:30 UTC** - Initial connection tests failed with auth errors
- **21:45 UTC** - Used `devil pgsql passwd` to reset password, connection successful
- **22:00 UTC** - Fixed production API issues:
  - Rebuilt bcrypt native module for Node 22/FreeBSD
  - Added missing `COOKIE_DOMAIN=salon-bw.pl` to .env
  - Added missing `FRONTEND_URL=https://panel.salon-bw.pl` to .env
  - Fixed app.js to load dotenv before application startup
  - Manually updated DATABASE_URL with URL-encoded password
- **22:10 UTC** - Production API fully recovered and verified

**Resolution:**

- API health check: ✅ Database connected (2.1ms latency)
- SMTP verification: ✅ Working (22ms latency)
- All production endpoints verified operational

**Lessons Learned:**

- Use `devil pgsql passwd` command for password resets on MyDevil
- Special characters in passwords require URL encoding in DATABASE_URL (`{` = `%7B`, `$` = `%24`)
- app.js entry point must call `require("dotenv").config()` before any other code for Passenger deployments
- Native modules like bcrypt must be rebuilt when Node.js version changes

## What's Working

- **2026-01-21 22:15 UTC** - Production readiness verification Phase 1 completed:
  - ✅ API health endpoints operational (database, SMTP, Prometheus metrics)
  - ✅ Public site (salon-bw.pl) → redirects to www.salon-bw.pl (200 OK)
  - ✅ Panel dashboard (panel.salon-bw.pl) → proper auth redirect (307)
  - ✅ Dev site (dev.salon-bw.pl) → operational (200 OK)
  - ✅ Database password updated across all environments
  - ✅ bcrypt native module rebuilt for production environment
- Contact form calls `/emails/send` (Nest `EmailsModule`) and relays through `kontakt@salon-bw.pl`.
- Deploy workflows (`deploy_api`, `deploy_public`, `deploy_dashboard`) accept optional `app_name` and tolerate php domains by touching `tmp/restart.txt`. (`deploy_admin` is legacy.)
- Public Next.js build succeeds with `experimental.typedRoutes=false`.
- SMTP + JWT secrets and POS flags managed in production `.env` at `/usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/.env` (`POS_ENABLED=true`; see [docs/ENV.md](./ENV.md)).
- **2025-11-01 18:32 UTC (`fd0b06d0`)** – POS migrations applied in production (`1710006000000`, `1710007000000`, `1710008000000`), and `POS_ENABLED=true` is live. Verification commands:
  ```bash
  curl -sw '%{http_code}\n' -X POST https://api.salon-bw.pl/sales -H 'Content-Type: application/json' -d '{"saleId":"agent-check","items":[]}' | tail -n1  # 201
  curl -sw '%{http_code}\n' -X POST https://api.salon-bw.pl/inventory/adjust -H 'Content-Type: application/json' -d '{"productId":"demo","delta":1}' | tail -n1  # 200
  ```
  Note: initial `1710007000000` execution blocked on a long-lived session; disconnecting the staging bastion freed the lock and the migration completed cleanly.
- **2025-10-24 23:31 UTC (`fd0b06d0`)** – API emits structured pino logs with `X-Request-Id` correlation and exposes `/metrics` for Prometheus; runbook updated with locations & troubleshooting.
- **2025-10-24 23:31 UTC (`fd0b06d0`)** – Deploy workflows append resilient smoke-check summaries via `scripts/post_deploy_checks.py` (retries `/healthz` and `/emails/send`).
 - **2025-10-25 02:10 UTC (`fd0b06d0`)** – Added domain metrics (emails, appointments). Frontend client now logs `x-request-id` in debug mode for correlation.

## Known Issues

| Issue | Impact | Workaround | Last Updated |
| --- | --- | --- | --- |
| CI/CD GitHub secrets may not propagate to generated .env files | Automated deployments may use stale passwords | Manually update production .env at `/usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/.env` | 2026-01-21 |

## Uptime Tracking

| Month (UTC) | API (`/healthz`) | Public (dev `/`) | Panel (`/dashboard`) | Notes |
| --- | --- | --- | --- | --- |
| 2025-11 | Monitoring (initializing) | Monitoring (initializing) | Monitoring (initializing) | UptimeRobot + Pingdom probes activated 2025-11-19; first full month of data available in December. |

## Improvements in Progress

| Initiative | Status | Commits | Last Updated |
| --- | --- | --- | --- |
| Phase 1: Security & Type Safety (SEC-1, SEC-2, SEC-3) | ✅ Complete | `2164a116`, `71b22d23`, `37cce05f`, `6b56b9e1` | 2025-11-01 |

**Completed Security Improvements:**
- **2025-11-01 (`71b22d23`)** – Enabled strict TypeScript mode in backend (`noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`)
- **2025-11-01 (`71b22d23`)** – Removed all explicit `any` types from production code (4 instances fixed)
- **2025-11-01 (`71b22d23`)** – Added `@types/nodemailer` for proper type definitions
- **2025-11-01 (`37cce05f`)** – Added automated dependency vulnerability scanning to CI
- **2025-11-01 (`37cce05f`)** – CI now fails on high/critical vulnerabilities in production dependencies
- **2025-11-01 (`37cce05f`)** – Updated CONTRIBUTING.md with TypeScript standards and dependency management practices
- **2025-11-01 (`6b56b9e1`)** – **BREAKING**: Implemented strict CSP with nonce-based scripts (removed `unsafe-inline`, `unsafe-eval`)
- **2025-11-01 (`6b56b9e1`)** – Added CSP violation reporting endpoint at `/csp-report`
- **2025-11-01 (`6b56b9e1`)** – Dynamic nonce generation via middleware for enhanced security

**Current Security Status:**
- ✅ Zero `any` types in production code
- ✅ Strict TypeScript enabled across backend
- ✅ No known vulnerabilities in production dependencies
- ✅ Automated security audits on every CI run
- ✅ **Strict CSP with nonces** (no unsafe-inline/unsafe-eval) - **A+ security grade expected**
- ✅ CSP violation monitoring and logging

## Operational References

- CI/CD overview and secrets: [`docs/CI_CD.md`](./CI_CD.md)
- Manual deploy runbook: [`docs/DEPLOYMENT_MYDEVIL.md`](./DEPLOYMENT_MYDEVIL.md)
- Environment variables: [`docs/ENV.md`](./ENV.md)
- Agent runbook (commands, restarts, verification): [`docs/AGENT_OPERATIONS.md`](./AGENT_OPERATIONS.md)

## Instructions for Agents

1. **After every deployment or infrastructure fix** update this file:
   - Record the commit SHA, workflow run ID, and timestamp.
   - Move resolved items from “Known Issues” to “What’s Working” with a brief note.
2. **Dispatch workflows** with `gh workflow run <file> -f commit_sha=<sha> …` (details in `docs/AGENT_OPERATIONS.md`).
3. **Monitor runs** with `gh run list --workflow "<name>"` and `gh run view <id> --log | tail`.
4. **Access servers** through the `devil` host alias (`ssh devil`). Node apps live under `/usr/home/vetternkraft/apps/nodejs/*`; public Next.js lives at `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs`.
5. **Restart rules:**
   - Node.js domains (e.g. `api.salon-bw.pl`, `dev.salon-bw.pl`): `devil www restart <domain>`.
   - PHP/Passenger wrappers (e.g. `salon-bw.pl`, `panel.salon-bw.pl`, `dev.salon-bw.pl`): write `tmp/restart.txt` instead—see operations doc.
6. **Document everything**—if you learn a new path, secret, or behaviour, append it here and cross-link the deeper documentation.
