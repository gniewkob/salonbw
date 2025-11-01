# Agent Operations Runbook

This runbook captures the minimum context an AI agent (or on-call human) needs to operate the Salon Black & White deployments safely.

## 1. Quick Reference

| Workflow | Purpose | Required Inputs | Production defaults | Dispatch example |
| --- | --- | --- | --- | --- |
| `ci.yml` | Lint, test, build (frontend + backend) | none | n/a | `gh workflow run ci.yml -r master` |
| `deploy.yml` (Deploy MyDevil) | Deploy target (api/public/dashboard/admin) | `ref`, `target`, optional `api_url`, optional `remote_path`, optional `app_name` | see repo variables below | `gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api` |

Monitor progress with:

```bash
gh run list --workflow .github/workflows/deploy.yml --limit 5
gh run view <run-id> --log | tail
```

All workflows assume the secrets described in [`docs/CI_CD.md`](./CI_CD.md) are populated (SSH key, mydevil host/user, optional API URLs, `NPM_TOKEN`).

## 2. Deployment Flow

1. **Choose target commit**: typically `git rev-parse HEAD` after pushing to `master`.
2. **Dispatch API deploy** (backend must go first to ensure `/healthz` and `/emails/send` remain live):

   ```bash
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api
   ```

3. **Dispatch frontends** (public → dashboard → admin):

   ```bash
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=public
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=dashboard
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=admin
   ```
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
| Dashboard | `/usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs` |
| Admin | `/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs` |
| Dev environment (preview) | `/usr/home/vetternkraft/domains/dev.salon-bw.pl` |

List configured domains:

```bash
ssh devil "devil www list --verbose"
```

## 4. Restart Rules

| Domain | Type | Preferred restart command |
| --- | --- | --- |
| `api.salon-bw.pl`, `dev.salon-bw.pl` | nodejs | `devil www restart <domain>` |
| `salon-bw.pl`, `panel.salon-bw.pl` (dashboard), any PHP-wrapped domain | php wrapper around standalone app | Passenger ignores `devil www restart`. Instead, create `tmp/restart.txt` in the deployment root (handled automatically by workflows). Manual fallback: `ssh devil "touch /path/to/app/tmp/restart.txt"` |

Passenger log files (if needed) live under `~/logs/nodejs/<app>/passenger.log`.

## 5. Observability

### Logs

- API emits structured JSON logs via pino; MyDevil captures stdout under `~/logs/nodejs/<app>/app.log` (e.g. `~/logs/nodejs/api.salon-bw.pl/app.log`).
- Each entry includes `requestId`, HTTP metadata, and the Nest context (`component`) to make tracing easier. Responses also echo `X-Request-Id`.
- Tail or filter logs with jq for troubleshooting:

```bash
ssh devil "tail -f ~/logs/nodejs/api.salon-bw.pl/app.log" | jq
```

Tip: when debugging client flows, set `NEXT_PUBLIC_ENABLE_DEBUG=true` (or `localStorage.DEBUG_API=1` in the browser console) so the frontend attaches an `X-Request-Id` header to every API call. The value is echoed back in responses and can be grepped directly in the backend logs.

### Metrics

- Prometheus-compatible metrics are exposed at `https://api.salon-bw.pl/metrics` (and `/metrics` on any environment).
- Output includes default Node.js/system counters and service metrics:
  - `salonbw_http_server_requests_total`
  - `salonbw_http_server_request_duration_seconds`
  - `salonbw_emails_sent_total{status="success|failed"}`
  - `salonbw_appointments_created_total`
  - `salonbw_appointments_completed_total`
- To query quickly:

```bash
curl -s https://api.salon-bw.pl/metrics | grep salonbw_http_server_requests_total
```

### Troubleshooting

1. **Missing logs** – ensure the workflow restart step succeeded; `devil www status api.salon-bw.pl` should list the Node app. If the log file is empty, tail `~/logs/nodejs/api.salon-bw.pl/passenger.log` for startup errors.
2. **Unexpected 5xx spikes** – correlate with request IDs in `salonbw_http_server_requests_total{status_code="500"}` and fetch the matching log lines via `grep <request-id> app.log`.
3. **Metrics endpoint down** – run `curl -I https://api.salon-bw.pl/metrics`; if it returns 5xx, restart (`devil www restart api.salon-bw.pl`) and re-test `/healthz` before retrying the scrape.

### Suggested Alerts (Prometheus)

- API errors: `rate(salonbw_http_server_requests_total{status_code=~"5.."}[5m]) > 0.1`
- Email failures: `rate(salonbw_emails_sent_total{status="failed"}[15m]) / (rate(salonbw_emails_sent_total[15m]) + 1e-9) > 0.2`
- Health endpoint availability: probe from your uptime checker against `/healthz`.

## 6. Verification & Health Checks

- **Backend health**: `curl -I https://api.salon-bw.pl/healthz`
- **Email smoke test**: `curl -s -X POST https://api.salon-bw.pl/emails/send ...`
- **Frontend cache busting**: Next.js writes `.next/BUILD_ID`; workflows re-link to shared static assets automatically.
i
## 7. Notes on MyDevil Environment

- Node.js 22 is available via `/usr/local/bin/node22`, but the global default is Node 18. That is why `npm` prints `EBADENGINE` warnings—safe to ignore.
- Passenger restarts look for `tmp/restart.txt`. For standalone bundles we ship `.next/standalone` plus `.next/static` and `public`.
- SMTP credentials for contact form use the mailbox `kontakt@salon-bw.pl` on `mail0.mydevil.net` (port 465, SSL). Stored in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env`.

## 8. Documentation Hygiene

- Keep `docs/AGENT_STATUS.md` synchronized with each live deployment.
- When you learn a new operational quirk, update this runbook and link to any deeper reference files.
- Cross-reference the existing guides:
  - Developer onboarding: [`docs/README_DEV.md`](./README_DEV.md)
  - Environment reference: [`docs/ENV.md`](./ENV.md)
  - CI/CD details: [`docs/CI_CD.md`](./CI_CD.md)
  - Manual deployment notes: [`docs/DEPLOYMENT_MYDEVIL.md`](./DEPLOYMENT_MYDEVIL.md)

If in doubt, document the outcome and leave breadcrumbs for the next operator. A tidy status file is more valuable than perfect automation.
