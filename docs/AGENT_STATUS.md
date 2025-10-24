# Agent Status Dashboard

_Last updated: 2025-10-24 22:05 UTC_

## Current Release

| Component | Commit | Workflow Run ID | Finished (UTC) | Environment | Notes |
| --- | --- | --- | --- | --- | --- |
| API (`api.salon-bw.pl`) | `35b08ad4` | `18793081523` | 2025-10-24 21:58 | production | Tar/scp deploy, npm22 install, Passenger restart succeeded; `/healthz` responds 200, `/emails/send` returns 201 |
| Public site (`salon-bw.pl`) | `35b08ad4` | `18793085853` | 2025-10-24 21:58 | production | Next standalone pushed to `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs`; restart handled via `tmp/restart.txt` |
| Dashboard (`dashboard.salon-bw.pl`) | `35b08ad4` | `18793089883` | 2025-10-24 21:59 | production | Standalone deployed to `/usr/home/vetternkraft/apps/nodejs/dashboard`; restart fallback via `tmp/restart.txt` |
| Admin (`admin.salon-bw.pl`) | `35b08ad4` | `18793095910` | 2025-10-24 22:00 | production | Standalone deployed to `/usr/home/vetternkraft/apps/nodejs/admin`; restart fallback via `tmp/restart.txt` |

Verification:

- `curl -I https://api.salon-bw.pl/healthz` → `200 OK`
- `curl -s -X POST https://api.salon-bw.pl/emails/send …` → `{"status":"ok"}` (SMTP: kontakt@salon-bw.pl on `mail0.mydevil.net`)

## What’s Working

- Contact form calls `/emails/send` (Nest `EmailsModule`) and relays through `kontakt@salon-bw.pl`.
- Deploy workflows (`deploy_api`, `deploy_public`, `deploy_dashboard`, `deploy_admin`) accept optional `app_name` and tolerate php domains by touching `tmp/restart.txt`.
- Public Next.js build succeeds with `experimental.typedRoutes=false`.
- SMTP + JWT secrets managed in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env` (see `docs/ENV.md`).

## Known Issues

| Issue | Impact | Workaround | Last Updated |
| --- | --- | --- | --- |
| `npm warn EBADENGINE` on mydevil (Node v18) | Noise during `npm install` in standalone bundles | Safe to ignore; Node 18 is the highest available on shared hosting | 2025-10-24 |

## Improvements in Progress

*None currently tracked.*

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
