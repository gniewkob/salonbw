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
| `api.salon-bw.pl` | nodejs (Passenger) | `devil www restart <domain>` |
| `salon-bw.pl` | Next.js standalone (Passenger) | `devil www restart <domain>` |
| `panel.salon-bw.pl` | Next.js standalone (Passenger) | `devil www restart <domain>` |
| `dev.salon-bw.pl` | Next.js standalone (Passenger) | `devil www restart <domain>` |

If Devil reports an invalid domain type or the restart does not pick up a new build, fall back to touching `tmp/restart.txt` in the domain root.

Passenger log files (if needed) live under `~/logs/nodejs/<app>/passenger.log`.

## 5. Observability

### Logs

#### 5.1 Centralised logging stack

- **Ingestion pipeline:** Promtail runs alongside each Node app on mydevil and tails `~/logs/nodejs/<app>/app.log`. It attaches `{service, environment}` labels and pushes to Grafana Loki (`https://observability.salon-bw.pl/loki/api/v1/push`). API logs and frontend client error events both flow through this channel.
- **Credentials:** Grafana and Loki share the same basic-auth secret as `LOKI_BASIC_AUTH` in production (`docs/ENV.md`). For client-side logs, set `CLIENT_LOG_TOKEN` on the API and `NEXT_PUBLIC_LOG_TOKEN` in each frontend build so the browser can POST to `/logs/client`.
- **Manual verification:**

```bash
# Promtail health on mydevil
ssh devil "docker logs promtail --tail 50"

# Ship a test entry (replace TOKEN)
curl -X POST https://api.salon-bw.pl/logs/client \
  -H 'Content-Type: application/json' \
  -H 'x-log-token: TOKEN' \
  -d '{"message":"smoke test","level":"info"}'

# Explore in Grafana → Explore → Loki
{service="salonbw-backend"} |= "smoke test"
```

- **Raw file fallback:** stdout is still stored at `~/logs/nodejs/<app>/app.log`. Use this only if promtail is unhealthy or you need to inspect pre-ingestion lines.

#### 5.2 Standard LogQL queries

| Scenario | Query | Notes |
| --- | --- | --- |
| 5xx spike | `{service="salonbw-backend",level=~"error|fatal"} |= "HTTP" | logfmt` | Pair with Prometheus alert: `sum by(service)(rate(salonbw_http_server_requests_total{status_code=~"5.."}[5m])) > 0.1` |
| Auth failures | `{service="salonbw-backend"} |= "AuthFailureFilter"` | Alerts when `rate(...) > 5` over 15 m |
| Client JS errors | `{service="salonbw-backend",context="frontend"} |= "TypeError"` | Feed directly into on-call Slack |
| Slow queries | `{service="salonbw-backend"} |= "slow query"` | Comes from `DatabaseSlowQueryService` |

Promtail labels every log with `requestId`; copy it to find corresponding traces or HTTP metrics.

#### 5.3 Alert rules

- **API 5xx:** `sum(rate(salonbw_http_server_requests_total{status_code=~"5.."}[5m])) > 0.1` for 10 minutes ⇒ page SRE channel.
- **Email failure rate:** `sum(rate(salonbw_emails_sent_total{status="failed"}[15m])) / max(sum(rate(salonbw_emails_sent_total[15m])), 1)` > 0.2 ⇒ Slack warn.
- **Client JS errors:** `count_over_time({context="frontend",level="error"}[10m]) > 25` ⇒ create dashboard panel and Slack alert.

Grafana alert contact points are stored in the `On-call` notification channel. When adjusting thresholds, update this runbook and `docs/AGENT_STATUS.md`.

#### 5.4 On-call procedure

1. **Alert fires** – note the query and time-range in Grafana.
2. **Scope via Loki** – copy the alert query into Explore, add `|= \`requestId\`` or `|= "<user id>"` filters to narrow.
3. **Correlate with metrics** – check Prometheus panel `salonbw_http_server_request_duration_seconds` for latency spikes.
4. **Remediate** – restart offending service (`devil www restart api.salon-bw.pl`) or roll back.
5. **Document** – append the incident to `docs/AGENT_STATUS.md` (alert, root-cause, mitigation) and link the Grafana panel used. Include follow-up tickets if thresholds need tuning.

Tip: when debugging client flows locally, set `NEXT_PUBLIC_ENABLE_DEBUG=true` or toggle `localStorage.DEBUG_API=1` to force the frontend to attach `X-Request-Id`; the value is echoed back in backend logs and appears as a `requestId` label in Loki.

#### 5.5 Application Performance Monitoring (Sentry)

- **Where to look:** All traces and browser replays land in the Sentry Cloud workspace (`organization: salonbw`, project `salonbw-production`). Open https://sentry.io/organizations/salonbw/performance/ → “Transactions” to slice by route or response code; use Discover for custom aggregations.
- **Backend capture:** Setting `SENTRY_DSN` boots the Nest Sentry SDK with the sample rates from `SENTRY_TRACES_SAMPLE_RATE` (default `0.2`) and `SENTRY_PROFILES_SAMPLE_RATE` (default `0`). Requests slower than `APM_SLOW_REQUEST_MS` raise a warning issue named `slow_http_request` with `http.method`, `http.route`, `http.status_code`, and `request_id` tags so you can jump straight to the matching Loki logs.
- **Request correlation:** Each inbound request still gets the `X-Request-Id` header; when Sentry is active the same ID is attached as a trace tag. Copy it into Sentry search (`request_id:abcd-1234`) to jump between metrics, logs, and traces.
- **Frontend RUM:** The Next.js app initialises `@sentry/nextjs` when `NEXT_PUBLIC_SENTRY_DSN` is set. Adjust `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE`, and `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` to tune BrowserTracing and Replay volume. Web Vitals are forwarded automatically through `sendWebVital`.
- **Alerts & dashboards:** Sentry alerts `API P95 latency > 500ms` (10‑minute window) and `Frontend INP P95 > 400ms` page the on-call Slack channel. When editing thresholds, capture a screenshot of the updated alert, paste it into `docs/AGENT_STATUS.md`, and note the workflow run that justified the change.
- **Replay guidance:** When Replay sampling is non-zero, errors collect a 60‑second replay snippet. Use it for UX regressions instead of reaching out to customers; clear any PII before exporting clips.

#### 5.6 Uptime Monitoring & Alerts

- **Provider:** UptimeRobot monitors the four production surfaces (`https://api.salon-bw.pl/healthz`, `https://salon-bw.pl/`, `https://panel.salon-bw.pl/dashboard`, `https://admin.salon-bw.pl/dashboard`). Each monitor runs every 60 seconds from **US-East (Ashburn)** and **EU-West (Frankfurt)** to catch regional network issues.
- **Authentication:** Dashboard and API key secrets live in 1Password (“UptimeRobot – SalonBW”). Only on-call engineers and team leads have access; rotate credentials whenever someone leaves the rotation.
- **Alerting:** Primary channel is `#ops-alerts` in Slack plus the “On-call – SalonBW” SMS list configured in UptimeRobot → Integrations. Alerts trigger after one failed check (<1 minute). Acknowledge in UptimeRobot to mute the paging loop, then start the incident template below.
- **Adding monitors:** In UptimeRobot create an HTTPS monitor, paste the URL, set the timeout to `30 seconds`, enable both regions, and tag it (`api`, `public`, `dashboard`, `admin`). Update the uptime table in `docs/AGENT_STATUS.md` after the monitor reports its first success.
- **Secondary probes:** Pingdom checks `/api/appointments` and `/api/healthz` from APAC every 5 minutes for redundancy. Credentials sit next to the UptimeRobot entry in 1Password. Keep Pingdom alerts muted unless requested; it mainly supplies latency timelines.

##### Incident response template

When an uptime alert fires, log the incident in `docs/AGENT_STATUS.md` and link the Slack thread:

```
## Incident YYYY-MM-DD HH:MM UTC
- Alert Source: (UptimeRobot / Pingdom / Manual)
- Impacted Surface: (API / Public / Dashboard / Admin)
- Start Time: <UTC timestamp>
- End Time: <UTC timestamp or "ongoing">
- Customer Impact: <errors/timeouts observed>
- Mitigation: <what you did>
- Root Cause: <fill once known>
- Follow-up Tasks: <GitHub issues or TODOs>
```

After the incident, update the uptime metrics table for the affected month and file follow-up tickets if new automation/runbooks are required.

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
4. **Next build fails with `Cannot find module '@next/env'`** – run `pnpm --filter frontend run build` locally; if it errors before copying standalone deps, execute `node frontend/scripts/ensure-local-deps.js` once to rehydrate the vendored packages (stored under `frontend/vendor`). Commit those vendor folders so CI/postinstall environments have the same copies; without them the standalone runtime strips `@next/env`, `styled-jsx`, `picocolors`, and `@swc/helpers` from the pnpm store and `next build` halts midway.

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
- Passenger restarts look for `tmp/restart.txt`. For standalone bundles we ship `.next/standalone` plus `.next/static` and `public`; the startup script (`frontend/app.cjs`) now links/copies those asset folders into the standalone dir automatically, but the sources must still exist beside the deployment.
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

## 9. Security & Dependency Response

### 9.1 Security Incident Playbook

1. **Triage**
   - Record source (Dependabot, CVE feed, audit failure) and affected package/version in `docs/AGENT_STATUS.md`.
   - Verify impact with `pnpm audit --prod --audit-level=high` at the repository root.
2. **Mitigate**
   - If Dependabot opened a PR, review the diff, run `pnpm install --frozen-lockfile`, and execute `pnpm turbo run lint typecheck test --filter=...` for the touched apps.
   - For manual patches: bump the version in the relevant `package.json`, regenerate the lockfile with `pnpm install`, and repeat the test suite.
3. **Deploy**
   - Merge to `master`, trigger `deploy.yml` for the affected targets, and monitor `/healthz` plus critical user journeys.
4. **Document**
   - Append the incident summary (date, package, fixed version, verification steps) to `docs/AGENT_STATUS.md`.

### 9.2 Quarterly Dependency Review

- On the first Monday of January, April, July, and October:
  - Run `pnpm outdated` at the repo root and file follow-up issues for major upgrades.
  - Execute `pnpm --filter frontend dlx depcheck` and `pnpm --filter salonbw-backend dlx depcheck`; remove unused packages immediately or justify them in the PR description.
  - Capture findings and assigned follow-ups in `docs/AGENT_STATUS.md`.
