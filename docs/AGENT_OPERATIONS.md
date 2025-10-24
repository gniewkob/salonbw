# Agent Operations Runbook

This runbook captures the minimum context an AI agent (or on-call human) needs to operate the Salon Black & White deployments safely.

## 1. Quick Reference

| Workflow | Purpose | Required Inputs | Production defaults | Dispatch example |
| --- | --- | --- | --- | --- |
| `ci.yml` | Lint, test, build (frontend + backend) | none | n/a | `gh workflow run ci.yml -r master` |
| `deploy_api.yml` | Deploy NestJS API to mydevil | `commit_sha`, `environment`, `remote_path`, `app_name` | `/usr/home/vetternkraft/apps/nodejs/api_salonbw`, `api.salon-bw.pl` | `gh workflow run deploy_api.yml -f commit_sha=<sha> -f environment=production -f remote_path=/usr/home/vetternkraft/apps/nodejs/api_salonbw -f app_name=api.salon-bw.pl` |
| `deploy_public.yml` | Deploy public Next.js site | `commit_sha`, `environment`, `remote_path` | `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs` | `gh workflow run deploy_public.yml -f commit_sha=<sha> -f environment=production -f remote_path=/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs` |
| `deploy_dashboard.yml` | Deploy dashboard frontend | `commit_sha`, `environment`, `remote_path` | `/usr/home/vetternkraft/apps/nodejs/dashboard` | `gh workflow run deploy_dashboard.yml -f commit_sha=<sha> -f environment=production -f remote_path=/usr/home/vetternkraft/apps/nodejs/dashboard` |
| `deploy_admin.yml` | Deploy admin frontend | `commit_sha`, `environment`, `remote_path` | `/usr/home/vetternkraft/apps/nodejs/admin` | `gh workflow run deploy_admin.yml -f commit_sha=<sha> -f environment=production -f remote_path=/usr/home/vetternkraft/apps/nodejs/admin` |

Monitor progress with:

```bash
gh run list --workflow "Deploy API"
gh run view <run-id> --log | tail
```

All workflows assume the secrets described in [`docs/CI_CD.md`](./CI_CD.md) are populated (SSH key, mydevil host/user, optional API URLs, `NPM_TOKEN`).

## 2. Deployment Flow

1. **Choose target commit**: typically `git rev-parse HEAD` after pushing to `master`.
2. **Dispatch API deploy** (backend must go first to ensure `/healthz` and `/emails/send` remain live).
3. **Dispatch frontends** (public → dashboard → admin). These share the same build artefacts and can run in parallel once the API is stable.
4. **Monitor logs**:
   - API: look for tar upload + `npm22 ci --omit=dev` finishing, `OK: /healthz`.
   - Public/Dashboard/Admin: Next.js build plus standalone runtime install. Warnings about Node engines on mydevil (Node 18) are expected.
   - Restart step now tolerates PHP domains—should either log `[Ok]` or simply touch `tmp/restart.txt`.
5. **Post-deploy verification**:
   ```bash
   curl -I https://api.salon-bw.pl/healthz
   curl -s -X POST https://api.salon-bw.pl/emails/send \
     -H 'Content-Type: application/json' \
     -d '{"to":"kontakt@salon-bw.pl","subject":"Smoke","template":"Hello {{name}}","data":{"name":"Smoke"}}'
   ```
   Load `https://salon-bw.pl`, `https://dashboard.salon-bw.pl`, and `https://admin.salon-bw.pl` in a browser.
6. **Update [`docs/AGENT_STATUS.md`](./AGENT_STATUS.md)** with the new run IDs and any issues discovered.

## 3. SSH & File Layout

Use the configured SSH alias:

```bash
ssh devil        # resolves to s0.mydevil.net with user vetternkraft
```

Key directories:

| App | Path |
| --- | --- |
| Backend API | `/usr/home/vetternkraft/apps/nodejs/api_salonbw` |
| Public Next.js | `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs` |
| Dashboard | `/usr/home/vetternkraft/apps/nodejs/dashboard` |
| Admin | `/usr/home/vetternkraft/apps/nodejs/admin` |
| Dev environment (preview) | `/usr/home/vetternkraft/domains/dev.salon-bw.pl` |

List configured domains:

```bash
ssh devil "devil www list --verbose"
```

## 4. Restart Rules

| Domain | Type | Preferred restart command |
| --- | --- | --- |
| `api.salon-bw.pl`, `dev.salon-bw.pl` | nodejs | `devil www restart <domain>` |
| `salon-bw.pl`, `dashboard.salon-bw.pl`, `admin.salon-bw.pl` | php wrapper around standalone app | Passenger ignores `devil www restart`. Instead, create `tmp/restart.txt` in the deployment root (handled automatically by workflows). Manual fallback: `ssh devil "touch /path/to/app/tmp/restart.txt"` |

Passenger log files (if needed) live under `~/logs/nodejs/<app>/passenger.log`.

## 5. Verification & Health Checks

- **Backend health**: `curl -I https://api.salon-bw.pl/healthz`
- **Email smoke test**: `curl -s -X POST https://api.salon-bw.pl/emails/send ...`
- **Frontend cache busting**: Next.js writes `.next/BUILD_ID`; workflows re-link to shared static assets automatically.
i
## 6. Notes on MyDevil Environment

- Node.js 22 is available via `/usr/local/bin/node22`, but the global default is Node 18. That is why `npm` prints `EBADENGINE` warnings—safe to ignore.
- Passenger restarts look for `tmp/restart.txt`. For standalone bundles we ship `.next/standalone` plus `.next/static` and `public`.
- SMTP credentials for contact form use the mailbox `kontakt@salon-bw.pl` on `mail0.mydevil.net` (port 465, SSL). Stored in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env`.

## 7. Documentation Hygiene

- Keep `docs/AGENT_STATUS.md` synchronized with each live deployment.
- When you learn a new operational quirk, update this runbook and link to any deeper reference files.
- Cross-reference the existing guides:
  - Developer onboarding: [`docs/README_DEV.md`](./README_DEV.md)
  - Environment reference: [`docs/ENV.md`](./ENV.md)
  - CI/CD details: [`docs/CI_CD.md`](./CI_CD.md)
  - Manual deployment notes: [`docs/DEPLOYMENT_MYDEVIL.md`](./DEPLOYMENT_MYDEVIL.md)

If in doubt, document the outcome and leave breadcrumbs for the next operator. A tidy status file is more valuable than perfect automation.
