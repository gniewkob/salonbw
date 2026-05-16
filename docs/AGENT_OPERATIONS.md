# Agent Operations Runbook

This runbook captures the minimum context an AI agent (or on-call human) needs to operate the Salon Black & White deployments safely.

## 1. Quick Reference

| Workflow | Purpose | Required Inputs | Production defaults | Dispatch example |
| --- | --- | --- | --- | --- |
| `ci.yml` | Lint, test, build (frontend + backend) | none | n/a | `gh workflow run ci.yml -r master` |
| `deploy.yml` (Deploy MyDevil) | Deploy target (`landing` \| `panel` \| `api` \| `all` \| `probe`; aliases: `public`=`landing`, `dashboard`/`admin`=`panel`) | `ref`, `target`, optional `api_url`, optional `remote_path`, optional `app_name` | see repo variables below | `gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api` |

Monitor progress with:

```bash
gh run list --workflow .github/workflows/deploy.yml --limit 5
gh run view <run-id> --log | tail
```

### 1.0 Panel regression baseline (2026-05-16)

- Baseline SHA: `e6b032134e21138d5c80524c321a489e70e141e2`
- Baseline result: `pnpm --filter @salonbw/panel test` -> `70/70 suites`, `212/212 tests`
- Validation contract:
  - `pnpm --filter @salonbw/panel test`
  - `pnpm --filter @salonbw/panel typecheck`
  - `pnpm --filter @salonbw/panel lint` (warnings allowed, errors not allowed)
- Stabilized regression areas:
  - `AdminDashboard`
  - `customersCrashGuards`
  - `layout`
  - `auth logout/refresh harness`

### 1.0a Focused regression commands (panel)

Use this command set for quick panel regression verification:

```bash
pnpm --filter @salonbw/panel test
pnpm --filter @salonbw/panel test -- customersCrashGuards AdminDashboard auth authStorage layout
pnpm --filter @salonbw/panel typecheck
pnpm --filter @salonbw/panel lint
```

All workflows assume the secrets described in [`docs/CI_CD.md`](./CI_CD.md) are populated (SSH key, mydevil host/user, optional API URLs, `NPM_TOKEN`).

## 1.1 Production smoke: Reception Insights (`calendar`)

Scope:
- logged-in smoke for `/calendar?view=reception`,
- insights panel render,
- fallback when `/api/reception/operational-insights` is unavailable,
- CTA-to-filter UI flow (`priority`, `alert CRM`, `to_finalize`).

Required environment variables:
- `PANEL_LOGIN_EMAIL`
- `PANEL_LOGIN_PASSWORD`

Manual run:

```bash
cd apps/panel
PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl \
PANEL_LOGIN_EMAIL='[EMAIL]' \
PANEL_LOGIN_PASSWORD='[PASSWORD]' \
pnpm exec playwright test tests/e2e/prod-calendar-smoke.spec.ts --project=desktop-1366
```

Runtime guardrails:
- test suite is skipped with explicit reason when required login env is missing,
- request interception for fallback/CTA checks is limited to `/api/reception/operational-insights`.

PASS criteria for production validation:
- `/calendar?view=reception` loads for authenticated operator without crash,
- insights panel (`[data-testid="reception-insights-panel"]`) is visible,
- fallback message is rendered when `/api/reception/operational-insights` is unavailable,
- CTA actions update filters in UI:
  - `Włącz filtr Tylko priorytetowe` -> `#reception-priority-filter` checked,
  - `Przejdź do wizyt z alertem CRM` -> `#reception-alert-filter` checked,
  - `Sprawdź wizyty do finalizacji` -> `#reception-status-filter=in_progress` and `#reception-payment-filter=to_finalize`.
- legacy compatibility: `/calendar-next?view=reception` redirects to `/calendar?view=reception`.

## 1.2 Production smoke: CRM Follow-up (`calendar`)

Scope:
- logged-in smoke for `/calendar?view=reception`,
- follow-up candidates panel render,
- follow-up action capture path (`POST /api/crm/follow-up-actions`),
- follow-up audit panel render (7-day range),
- fallback when `/api/crm/follow-up-candidates` is unavailable,
- fallback when `/api/crm/follow-up-actions?from=...&to=...` is unavailable.

Required environment variables:
- `PANEL_LOGIN_EMAIL`
- `PANEL_LOGIN_PASSWORD`

Manual run:

```bash
cd apps/panel
PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl \
PANEL_LOGIN_EMAIL='[EMAIL]' \
PANEL_LOGIN_PASSWORD='[PASSWORD]' \
pnpm exec playwright test tests/e2e/prod-calendar-smoke.spec.ts --project=desktop-1366
```

Runtime guardrails:
- test suite is skipped with explicit reason when required login env is missing,
- request interception for follow-up fallback checks is limited to:
  - `/api/crm/follow-up-candidates`,
  - `/api/crm/follow-up-actions?from=...&to=...`.

PASS criteria for production validation:
- `/calendar?view=reception` loads for authenticated operator without crash,
- candidates panel (`[data-testid="reception-follow-up-panel"]`) is visible,
- audit panel (`[data-testid="reception-follow-up-audit-panel"]`) is visible,
- action capture path works (e.g. `Oznacz kontakt`) and row shows handled state,
- fallback message is rendered when candidates endpoint is unavailable:
  - `Kandydaci follow-up chwilowo niedostępni.`,
- fallback message is rendered when audit endpoint is unavailable:
  - `Audyt follow-up chwilowo niedostępny.`
- legacy compatibility: `/calendar-next?view=reception` redirects to `/calendar?view=reception`.

## 2. Deployment Flow

1. **Choose target commit**: typically `git rev-parse HEAD` after pushing to `master`.
2. **Dispatch API deploy** (backend must go first to ensure `/healthz` and `/emails/send` remain live):

   ```bash
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api
   ```

3. **Dispatch frontends** (landing → panel), or use `target=all` to deploy api+landing+panel together (api migrations run before any frontend restart):
   - `landing` → `dev.salon-bw.pl` (landing / wizytówka)
   - `panel`   → `panel.salon-bw.pl` (Versum clone)

   ```bash
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=landing
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=panel
   # or, instead of the three dispatches in steps 2–3:
   gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=all
   ```
   \* Aliases: `public`=`landing`, `dashboard`=`panel`, `admin`=`panel`. Prefer canonical names in new scripts.
4. **Monitor logs**:
   - API: look for tar upload + `npm22 ci --omit=dev` finishing, `OK: /healthz`.
   - Public/Panel: Next.js build plus standalone runtime install. Warnings about Node engines on mydevil (Node 18) are expected.
   - Restart step now tolerates PHP domains—should either log `[Ok]` or simply touch `tmp/restart.txt`.
5. **Post-deploy verification**:
   ```bash
   curl -I https://api.salon-bw.pl/healthz
   curl -s -X POST https://api.salon-bw.pl/emails/send \
     -H 'Content-Type: application/json' \
     -d '{"to":"kontakt@salon-bw.pl","subject":"Smoke","template":"Hello {{name}}","data":{"name":"Smoke"}}'
   ```
   Load `https://salon-bw.pl` (legacy), `https://dev.salon-bw.pl` (public), and `https://panel.salon-bw.pl` (dashboard) in a browser.
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
| Public legacy (`salon-bw.pl`) | `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs` |
| Public (dev) | `/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs` |
| Dashboard (panel) | `/usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs` |

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

##### Batch customer statistics (reception) alert routing policy

- **Scope:** `GET /customers/statistics/batch` telemetry events:
  - `customer statistics batch slow`
  - `customer statistics batch failed`
  - `customer statistics batch failure burst`
- **Noise policy:** fast-success telemetry (`customer statistics batch served`) stays disabled in production.
- **Routing matrix:**
  - `slow` warning (`durationMs >= 800`) -> Loki/Grafana panel only, no page.
  - `failed` warning (`HttpException` 4xx) -> Slack `#ops-alerts` warn digest, no page.
  - `failed` error (5xx/unexpected error) -> On-call channel immediate alert.
  - `failure burst` error (`>=5` failures in `5m`) -> On-call channel immediate alert + incident note in `docs/AGENT_STATUS.md`.
- **Starter Loki queries:**
  - Slow: `{service="salonbw-backend"} |= "customer statistics batch slow"`
  - Failed: `{service="salonbw-backend"} |= "customer statistics batch failed"`
  - Burst: `{service="salonbw-backend"} |= "customer statistics batch failure burst"`
- **Action target:** acknowledge alert, validate reception panel impact (`/calendar?view=reception`), trigger `Ponów teraz` retry check, then investigate backend exceptions.
- **Automation hook:** workflow `.github/workflows/ops_batch_stats_alerts.yml` runs every 10 minutes and evaluates the above telemetry in Loki. It fails on:
  - `customer statistics batch failure burst` > 0
  - `customer statistics batch failed` (`level=error`) >= 3 in 10m
  Warning-only signals (`slow`, controlled 4xx failures) are reported in run summary without failing.
  If Loki query itself is unavailable, or `LOKI_BASIC_AUTH` is missing, the check reports `degraded observability` (non-failing by default) to reduce false-positive pages caused by telemetry transport/config gaps.
  Each run uploads `batch-telemetry-evidence.json` as a GitHub artifact (14-day retention) for audit evidence and post-incident review.
  The workflow validates evidence schema before upload (`generatedAt/status/action/reason/config/counts/failedQueries/queries/exitCode`) to prevent malformed audit artifacts.
  Concurrency guard serializes scheduled runs to prevent overlapping checks and duplicate alert transitions.
  Workflow explicitly opts into Node 24 action runtime (`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`) to avoid Node 20 deprecation drift.
- **Incident ticket automation:** workflow `.github/workflows/ops_batch_stats_incident_ticket.yml` listens for failed `Ops Batch Stats Alerts` runs, downloads evidence artifact, and creates/updates an incident issue (`ops`, `incident`, `batch-stats`) using a daily dedup key (`reason + date`).
  Incident quality guard validates mandatory evidence fields, status whitelist, title prefix, and dedup key format before issue creation/update.
  Lifecycle guard reuses the same dedup marker across issue states: if matching issue is closed, automation reopens it and appends a new occurrence comment instead of creating a duplicate ticket.
  Concurrency guard keys runs by source run/id to prevent duplicate ticket mutations under retried/parallel dispatches.
  Missing-artifact fallback keeps automation alive: if `batch-telemetry-evidence.json` is unavailable, incident flow uses `reason=missing_evidence_artifact` and still opens/updates the ticket with explicit evidence-gap context.
- **Resolution template:** `.github/ISSUE_TEMPLATE/ops-batch-stats-incident-resolution.md` defines the required closure structure (`Mitigation`, `Root Cause`, `Verification`, `Follow-up`). Auto-created incidents include matching sections by default.
- **SLA reminder automation:** workflow `.github/workflows/ops_batch_stats_incident_sla.yml` runs hourly and comments on stale open incidents (`ops,incident,batch-stats`) if no activity for >6h. It adds one reminder comment per day using an internal marker.
- **Incident closure guard:** workflow `.github/workflows/ops_batch_stats_incident_closure_guard.yml` validates closed `ops,incident,batch-stats` issues. If closure notes do not include both `root cause` and `mitigation`, it reopens the issue and posts a guard comment.
  Both workflows now include concurrency groups to avoid race conditions on issue comments/state updates.

##### Ops workflow permissions matrix (least privilege)

| Workflow | contents | actions | issues | Rationale |
| --- | --- | --- | --- | --- |
| `ops_batch_stats_alerts.yml` | `read` | `none` | `none` | Reads repo script and uploads telemetry evidence artifact; no issue mutation. |
| `ops_batch_stats_incident_ticket.yml` | `read` | `read` | `write` | Reads source-run artifacts via Actions API and creates/updates incident issues. |
| `ops_batch_stats_incident_sla.yml` | `read` | `none` | `write` | Reads and comments on stale incident issues. |
| `ops_batch_stats_incident_closure_guard.yml` | `read` | `none` | `write` | Reads closed incident issues and reopens/comments when closure evidence is missing. |
| `ops_batch_stats_drill.yml` | `read` | `none` | `none` | Validates fixtures/guards and publishes drill report artifact only. |
| `ops_workflow_noise_guard.yml` | `read` | `read` | `none` | Reads source workflow logs via Actions API and uploads noise report artifact. |
| `ops_probe_panel.yml` | `n/a` | `n/a` | `n/a` | Manual SSH probe workflow (legacy operational diagnostics); no issue mutation. |
| `ops_maintenance.yml` | `n/a` | `n/a` | `n/a` | Manual SSH maintenance/probe workflow (legacy operational diagnostics); no issue mutation. |

Policy:
- Keep `permissions` explicit in every ops workflow.
- Grant `issues: write` only to workflows that mutate issues.
- Grant `actions: read` only where Actions API artifact reads are required (`incident_ticket`).

##### Secrets / environment preflight policy

- `ops_batch_stats_alerts.yml` must preflight telemetry env/secrets and print clear diagnostics without exposing secret values.
- `ops_batch_stats_incident_ticket.yml` manual dispatch must fail fast with clear input errors when neither `source_run_id` nor synthetic fixture is provided.
- Invalid `synthetic_fixture` values must fail before any API mutation step.
- Preflight errors should be deterministic and operator-readable (no ambiguous bash failures).

##### Workflow warning/deprecation post-check

- Workflow `.github/workflows/ops_workflow_noise_guard.yml` scans completed ops workflow logs for warning/deprecation/runtime-noise patterns.
- Trigger mode:
  - automatic via `workflow_run` for ops workflows,
  - manual via `workflow_dispatch` (`source_run_id`).
- Output artifact:
  - `ops-workflow-noise-report-<run_id>` with:
    - `ops-workflow-noise-report.json`
    - `all-noise-lines.txt`
    - `unexpected-noise-lines.txt`
- Allowlist:
  - `.github/ops-noise-allowlist.txt` (regex lines, minimal by policy).
- Guard behavior:
  - fails only on **unexpected** noise after allowlist filtering.

##### Workflow mutation audit trail standard

For any automated issue mutation (create/update/reopen/comment), include:
- automation marker (`<!-- ops-automation:<workflow>:<run_id>:... -->`)
- `workflow`
- `workflow_run_id`
- `source_event`
- `dry_run`
- `dedup_key` (where applicable, incident ticket flow)
- source run URL/id for telemetry incidents

Current implementation:
- `ops_batch_stats_incident_ticket.yml`: standard marker and metadata on issue body + occurrence/reopen comments.
- `ops_batch_stats_incident_sla.yml`: standard marker and metadata on SLA reminder comments.
- `ops_batch_stats_incident_closure_guard.yml`: standard marker and metadata on reopen comments.
- **Drill mode (safe validation):**
  - `incident_ticket`: `workflow_dispatch` supports `dry_run=true` and synthetic fixture input `synthetic_fixture=critical|degraded_observability|missing_evidence`.
  - `incident_sla`: `workflow_dispatch` supports `dry_run=true` (no reminder comments are posted).
  - `incident_closure_guard`: `workflow_dispatch` supports `dry_run=true` (no reopen/comment mutation).
  - `ops_batch_stats_drill.yml`: runs on manual dispatch and scheduled cadence (weekly, Monday 03:17 UTC) to continuously verify fixture and guard integrity.

##### Incident automation drill checklist (no production incident required)

1. **Run incident ticket dry-run with synthetic critical fixture**
   - `gh workflow run "Ops Batch Stats Incident Ticket" --ref master -f dry_run=true -f synthetic_fixture=critical`
   - PASS: run succeeds and summary contains "Incident Ticket Dry Run" + planned action.
   - PASS: no new `ops,incident,batch-stats` issue is created/updated.

2. **Run incident ticket dry-run with synthetic degraded observability fixture**
   - `gh workflow run "Ops Batch Stats Incident Ticket" --ref master -f dry_run=true -f synthetic_fixture=degraded_observability`
   - PASS: run succeeds and payload route is `status=degraded_observability`.
   - PASS: no GitHub issue mutation.

3. **Run incident ticket dry-run with synthetic missing evidence path**
   - `gh workflow run "Ops Batch Stats Incident Ticket" --ref master -f dry_run=true -f synthetic_fixture=missing_evidence`
   - PASS: fallback reason is `missing_evidence_artifact`.
   - PASS: no GitHub issue mutation.

4. **Run SLA reminder dry-run**
   - `gh workflow run "Ops Batch Stats Incident SLA" --ref master -f dry_run=true`
   - PASS: summary shows `Dry run mode: true` and `Reminders planned`.
   - PASS: no new SLA reminder comments on incident issues.

5. **Run closure guard dry-run**
   - `gh workflow run "Ops Batch Stats Incident Closure Guard" --ref master -f dry_run=true -f issue_number=<existing_incident_issue_number>`
   - PASS: summary includes missing closure evidence assessment.
   - PASS: issue state remains unchanged (no reopen) and no guard comment is posted.

6. **Document drill**
   - Add a short note to `docs/AGENT_STATUS.md` with date, run IDs, and PASS/FAIL outcome.

##### Drill failure incident policy

- Scope: `Ops Batch Stats Drill` workflow failures indicate an operations-automation integrity problem unless proven otherwise.
- Interpretation:
  - **drill failure** = failure in ops automation controls/fixtures/guards/runbook alignment.
  - **not automatically** = production app/reception/API outage.
- Default routing:
  - owner: `ops/platform`
  - labels: `ops`, `automation`, `drill-failure`
- Required triage evidence (before escalation to app teams):
  1. workflow logs from failed `Ops Batch Stats Drill` run
  2. drill artifact `ops-batch-stats-drill-report-<run_id>`
  3. failure class identification:
     - fixture validation failure,
     - dry-run guard regression,
     - workflow/runtime/dependency regression
- Escalation rule:
  - escalate to app/backend owners only when drill evidence shows real product-path impact (not just ops automation harness failure).

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

- **Provider:** UptimeRobot monitors the four production surfaces (`https://api.salon-bw.pl/healthz`, `https://salon-bw.pl/`, `https://dev.salon-bw.pl/`, `https://panel.salon-bw.pl/dashboard`). Each monitor runs every 60 seconds from **US-East (Ashburn)** and **EU-West (Frankfurt)** to catch regional network issues.
- **Authentication:** Dashboard and API key secrets live in 1Password (“UptimeRobot – SalonBW”). Only on-call engineers and team leads have access; rotate credentials whenever someone leaves the rotation.
- **Alerting:** Primary channel is `#ops-alerts` in Slack plus the “On-call – SalonBW” SMS list configured in UptimeRobot → Integrations. Alerts trigger after one failed check (<1 minute). Acknowledge in UptimeRobot to mute the paging loop, then start the incident template below.
- **Adding monitors:** In UptimeRobot create an HTTPS monitor, paste the URL, set the timeout to `30 seconds`, enable both regions, and tag it (`api`, `public`, `panel`). Update the uptime table in `docs/AGENT_STATUS.md` after the monitor reports its first success.
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
4. **Next build fails with `Cannot find module '@next/env'`** – run `pnpm --filter @salonbw/landing run build` or `pnpm --filter @salonbw/panel run build` locally; if it errors before copying standalone deps, execute `node apps/landing/scripts/ensure-local-deps.js` or `node apps/panel/scripts/ensure-local-deps.js` once to rehydrate the vendored packages (stored under `apps/landing/vendor` or `apps/panel/vendor`). Commit those vendor folders so CI/postinstall environments have the same copies; without them the standalone runtime strips `@next/env`, `styled-jsx`, `picocolors`, and `@swc/helpers` from the pnpm store and `next build` halts midway.

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
- Passenger restarts look for `tmp/restart.txt`. For standalone bundles we ship `.next/standalone` plus `.next/static` and `public`; the startup script (`apps/landing/app.cjs` or `apps/panel/app.cjs`) now links/copies those asset folders into the standalone dir automatically, but the sources must still exist beside the deployment.
- SMTP credentials for contact form use the mailbox `kontakt@salon-bw.pl` on `mail0.mydevil.net` (port 465, SSL).
  - Production policy: keep `SMTP_USER` / `SMTP_PASSWORD` only on the server in `/usr/home/vetternkraft/apps/nodejs/api_salonbw/.env` (not in CI/CD).

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
  - Execute `pnpm --filter @salonbw/landing dlx depcheck`, `pnpm --filter @salonbw/panel dlx depcheck`, and `pnpm --filter salonbw-backend dlx depcheck`; remove unused packages immediately or justify them in the PR description.
  - Capture findings and assigned follow-ups in `docs/AGENT_STATUS.md`.
