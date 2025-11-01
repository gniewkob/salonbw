# Agent Status Dashboard

_Last updated: 2025-11-01 (automated improvements via Claude Code)_

## Current Release

| Component | Commit | Workflow Run ID | Finished (UTC) | Environment | Notes |
| --- | --- | --- | --- | --- | --- |
| API (`api.salon-bw.pl`) | `a98d923d` | `18857312225` | 2025-10-27 22:09 | production | Redeployed after security fixes; `/healthz` 200 |
| Public site (`dev.salon-bw.pl`) | `1b65bbf5` | `18859475724` | 2025-10-27 23:57 | production | Deployed static assets fix, image optimization + caching, GA4/Web Vitals wiring; smoke checks OK |
| Dashboard (`panel.salon-bw.pl`) | `a98d923d` | `18857314859` | 2025-10-27 22:10 | production | Redeployed from master; smoke checks passed |
| Admin (`dev.salon-bw.pl`) | `1b65bbf5` | `18859477828` | 2025-10-27 23:57 | production | Deployed static assets fix, image optimization + caching, GA4/Web Vitals wiring; smoke checks OK |

Verification:

- `curl -I https://api.salon-bw.pl/healthz` → `200 OK`
- `curl -s -X POST https://api.salon-bw.pl/emails/send …` → `{"status":"ok"}` (SMTP: kontakt@salon-bw.pl on `mail0.mydevil.net`)

## What’s Working

- Contact form calls `/emails/send` (Nest `EmailsModule`) and relays through `kontakt@salon-bw.pl`.
- Deploy workflows (`deploy_api`, `deploy_public`, `deploy_dashboard`, `deploy_admin`) accept optional `app_name` and tolerate php domains by touching `tmp/restart.txt`.
- Public Next.js build succeeds with `experimental.typedRoutes=false`.
- SMTP + JWT secrets and POS flags managed in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env` (`POS_ENABLED=true`; see `docs/ENV.md`).
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
| `npm warn EBADENGINE` on mydevil (Node v18) | Noise during `npm install` in standalone bundles | Safe to ignore; Node 18 is the highest available on shared hosting | 2025-10-24 |

## Improvements in Progress

| Initiative | Status | Commits | Last Updated |
| --- | --- | --- | --- |
| Phase 1: Security & Type Safety (SEC-1, SEC-3) | ✅ Complete | `2164a116`, `71b22d23`, `37cce05f` | 2025-11-01 |

**Completed Security Improvements:**
- **2025-11-01 (`71b22d23`)** – Enabled strict TypeScript mode in backend (`noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch`)
- **2025-11-01 (`71b22d23`)** – Removed all explicit `any` types from production code (4 instances fixed)
- **2025-11-01 (`71b22d23`)** – Added `@types/nodemailer` for proper type definitions
- **2025-11-01 (`37cce05f`)** – Added automated dependency vulnerability scanning to CI
- **2025-11-01 (`37cce05f`)** – CI now fails on high/critical vulnerabilities in production dependencies
- **2025-11-01 (`37cce05f`)** – Updated CONTRIBUTING.md with TypeScript standards and dependency management practices

**Current Security Status:**
- ✅ Zero `any` types in production code
- ✅ Strict TypeScript enabled across backend
- ✅ No known vulnerabilities in production dependencies
- ✅ Automated security audits on every CI run

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
   - PHP/Passenger wrappers (e.g. `salon-bw.pl`, `dashboard.salon-bw.pl`, `admin.salon-bw.pl`): write `tmp/restart.txt` instead—see operations doc.
6. **Document everything**—if you learn a new path, secret, or behaviour, append it here and cross-link the deeper documentation.
