# AGENTS.md (Codex-first, repo-wide)

## Two environments (active topology, 2026-10-25)

| Environment | Landing | Panel | API | App directories under `~/apps/nodejs/` |
| --- | --- | --- | --- | --- |
| production | salon-bw.pl | panel.salon-bw.pl | api.salon-bw.pl | salonbw_prod, panelbw, api_salonbw |
| staging (development) | dev.salon-bw.pl | dev-panel.salon-bw.pl | dev-api.salon-bw.pl | salonbw, panelbw_dev, api_salonbw_dev |

Every domain keeps `~/domains/<domain>/public_nodejs` as a symlink to its
application directory. Never replace an unexpected directory/link during a
deploy. Provision explicitly first. `scripts/mydevil/ensure-app-symlink.sh`
checks the link and archives obsolete public diagnostics privately.

`staging` is the GitHub environment for development. Its independent database
is `p11522_salonbw_d`; production data is not a development seed. Development
requires gateway Basic authentication, `dev_` cookies, independent signing
secrets, explicit API origin, noindex and disabled outbound delivery/schedulers.
Hosted development uses NODE_ENV=production for Next/Nest runtime optimizations;
APP_ENV=development controls isolation. Never put gateway passwords in
NEXT_PUBLIC variables. Basic auth is an additional gateway; panel login still
uses the normal application session.

Preview: `scripts/deploy-environment.sh development all <sha>`.
Execute by adding `--execute`: API must finish successfully before frontends.
Use `production` for the production stack. `DEPLOY_WORKFLOW_REF` selects the
workflow source for an approved pre-merge rollout. Code deployment requires a
successful CI result for the exact immutable source SHA.

Canonical activation is a separate gate while the legacy PHP site exists:
production `target=landing, prepare_only=true` uploads the canonical bundle
without restarting/claiming live acceptance. Back up PHP files, prepare the
application link and private integration configuration, then convert the WWW
type through MyDevil. Verify actual release/build metadata and public legal
routes; update Meta application settings. Roll back by restoring the PHP WWW
type without deleting the preserved public_html files. See the task journal
for actual rollout status; this section defines the deployment contract.

Frontend acceptance checks HTML, running Next build ID and non-secret release
metadata; API acceptance requires the exact X-SalonBW-Release and healthy DB.
Public startup/error diagnostics are prohibited; use owner-only .diagnostics
and bounded status summaries. A backup listing is not a restoration test.


This file is Codex-oriented but intentionally compatible with other agents.
It defines how agents should operate in this repository: what is “production”, how to deploy, how to verify, and what not to break.

---

> **START HERE:** read [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) first —
> one page, always current: where the project is, what is next, what is blocked
> on the owner. Then follow
> [`docs/HANDOFF_PROTOCOL.md`](docs/HANDOFF_PROTOCOL.md), which is **binding for
> every agent (Codex, Claude, human)** and defines when a task counts as done.
>
> Per-task history lives in [`docs/journal/`](docs/journal/) — **one file per
> task**. Do NOT append to `docs/AGENT_STATUS.md` or
> `.claude/rules/active-context.md`; they are archived (append-at-top there
> caused repeated merge conflicts that silently blocked CI).
>
> Before pushing: `scripts/handoff-check.sh`.

## 0) Non-negotiables (execution rules)

1. Read-before-write: before changing anything, read:
   - docs/PROJECT_STATE.md (current state — first)
   - docs/HANDOFF_PROTOCOL.md (how to record work)
   - Agent.md
   - docs/ (especially deployment + env + ops docs)
   - .github/workflows/*
2. No secrets in commits: never introduce secrets into git. Use existing GitHub Secrets / server env.
3. No “best guess” infra edits: if a change requires unknown values (domains, paths, env keys, credentials), stop and ask for exact inputs instead of inventing them.
4. Single change-set: keep changes minimal, scoped, and reversible.

---

## 0a) Design / brand (mandatory for UI work)

Before designing, building, restyling, or reviewing ANY user-facing UI in
`apps/landing` or `apps/panel` — sections, components, pages, CTAs, color
choices, hover/focus states, animations — **READ
`.claude/skills/salonbw-brand/SKILL.md` first.** It is the single source of
truth for the Salon Black & White brand: approved color tokens, the
pre-computed WCAG contrast table, typography (Playfair + Open Sans), button/CTA
rules, surfaces/motion, and the hard anti-patterns (each caused a real shipped
bug). Pick an approved token instead of an ad-hoc hex; keep landing and panel
visually cohesive (shared `#b4b8be` silver, `#0d0d0d` black, silver-bg/dark-text
primary buttons). The file is the same one Claude Code loads as a skill — Codex
and other agents should read it directly.

---

## 1) Production topology (authoritative)

### Domains (active topology, verified 2026-10-25)
- Production landing: https://salon-bw.pl (Node.js; legacy PHP preserved for rollback).
- Production panel/auth: https://panel.salon-bw.pl.
- Production API: https://api.salon-bw.pl.
- Protected development landing: https://dev.salon-bw.pl.
- Protected development panel/auth: https://dev-panel.salon-bw.pl.
- Protected development API: https://dev-api.salon-bw.pl.

### Contract
- Each environment uses its own API, database, signing keys and auth cookies.
- Production is canonical/indexable; development requires its gateway and noindex.
- Technical administrators have full admin access and a system dashboard, but
  are excluded from employee lists, service assignments, timetables and bookings.
- Meta legal URLs must point directly to canonical /privacy, /policy and
  /data-deletion. Saved settings were verified during the cutover; retain this
  release gate for future changes. See docs/RELEASE_CHECKLIST.md and the journal.

---

## 2) Repository mapping (what’s what)

### Apps
- Landing: apps/landing
- Panel: apps/panel
- Admin: apps/admin (exists in workflows; treat as separate deployable)

Panel calendar runtime note:
- `/calendar` is the native React calendar in `apps/panel/src/pages/calendar.tsx`.
- It uses canonical `/api/calendar/*` and `/api/appointments/*` endpoints; legacy Versum paths are compatibility aliases only.

Panel canonical admin routes:
- `/calendar`, `/customers`, `/products`, `/statistics`, `/communication`, `/services`, `/settings`, `/extension`
- legacy `/clients` and `/admin/*` entry routes should be treated as compatibility aliases/redirects

### Backend
- API: backend/ (Node.js app; deployed separately from frontends)

Workflow deploy targets: public|dashboard|admin|api|probe

Mental mapping:
- public == landing build/deploy
- dashboard == panel build/deploy
- admin == admin build/deploy
- api == backend API build/deploy
- probe == smoke/health checks only

---

## 3) CI (quality gate)

### Workflow
- GitHub Actions workflow: CI (see ci.yml)
- Runs on push and pull_request for main and master
- Frontend job matrix includes: public, dashboard, admin

### Rule
- Do not merge PRs that break CI unless the intent is explicitly to fix CI infrastructure.
### Audit policy
- Security audit fails CI only on **high/critical** vulnerabilities.
- Moderate/low vulnerabilities are reported in the job summary but do not fail CI.

---

## 4) Deployment (MyDevil) — preferred path

### Workflow of record
- GitHub Actions workflow: Deploy (MyDevil) (see deploy.yml)
- Supported targets: public|dashboard|admin|api|probe
- Supports environments: staging|production
- Code deploys resolve the requested ref to an immutable SHA and wait for a
  successful `CI` run for exactly that SHA before install/build/upload/migrate.
  A failed, cancelled, missing, or timed-out CI result stops the deploy.
- Automatic pushes to `master` use the `production` GitHub environment, aligned
  with the production paths selected by `DEPLOY_ENV`.
- Transfer safety: workflow deploy steps enforce timeouts for `scp`/`rsync` so stalled uploads fail fast and can be retried.
- Push path detection requires a full checkout and is implemented by
  `scripts/ci/detect-deploy-changes.sh`; multi-commit pushes must not fall back
  to deploying every app.
- Frontend bundles must be extracted with
  `scripts/mydevil/extract-frontend-bundle.sh`, which rolls back failed
  extraction and retains one previous generation of fingerprinted assets.

### Default order (when you need a full rollout)
1. api
2. public (landing)
3. dashboard (panel)
4. admin
5. probe (optional, but recommended)

### Trigger via GitHub CLI (deterministic)

Staging:
```bash
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=staging -f target=api
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=staging -f target=public
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=staging -f target=dashboard
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=staging -f target=admin
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=staging -f target=probe

gh run list --workflow "Deploy (MyDevil)" --limit 10
```

Production:
```bash
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=production -f target=api
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=production -f target=public
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=production -f target=dashboard
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=production -f target=admin
gh workflow run "Deploy (MyDevil)" --ref master -f ref=master -f environment=production -f target=probe

gh run list --workflow "Deploy (MyDevil)" --limit 10
```

### Run monitoring standard (agent setting)

- Default close condition for task completion: `Deploy (MyDevil)` must be `completed/success` (CI should also be green unless explicitly waived).
- Preferred monitor command (token-efficient, deterministic):

```bash
scripts/monitor-master-runs.sh
```

- Optional explicit SHA:

```bash
scripts/monitor-master-runs.sh <sha_prefix>
```

- Agent rule:
  - use the script instead of repeated ad-hoc `gh run list` polling,
  - for small changes, commits may be batched before push,
  - for larger/riskier changes, push and monitor immediately to final deploy status.

---

## 5) Production paths (MyDevil) — operational reference

### Canonical public_nodejs domain roots
- API: /usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs (symlink to /usr/home/vetternkraft/apps/nodejs/api_salonbw)
- Production landing: /usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs -> /usr/home/vetternkraft/apps/nodejs/salonbw_prod
- Panel: /usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs
- Landing (dev): /usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs -> /usr/home/vetternkraft/apps/nodejs/salonbw
- Dev API: domains/dev-api.salon-bw.pl/public_nodejs -> apps/nodejs/api_salonbw_dev
- Dev panel: domains/dev-panel.salon-bw.pl/public_nodejs -> apps/nodejs/panelbw_dev

### Important nuance (Panel)
Deploy workflow enforces a “standard path” for panel app content:
- /usr/home/vetternkraft/apps/nodejs/panelbw (symlinked into /usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs)

Agents must treat the symlink as intentional and avoid “fixing” it unless explicitly instructed.

### Important nuance (API)
API is also symlinked:
- /usr/home/vetternkraft/apps/nodejs/api_salonbw (symlinked into /usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs)

Deployments must target the apps path, not the domain path.

---

## 6) Restarts (MyDevil official)

SSH:
```bash
ssh vetternkraft@s0.mydevil.net
```

Restart domains:
```bash
devil www restart api.salon-bw.pl
devil www restart panel.salon-bw.pl
devil www restart dev.salon-bw.pl
devil www restart salon-bw.pl
```

Node version note:
- `devil www options <domain> nodejs_version ...` is not supported on this MyDevil profile; do not use it in automation.
- Keep Node runtime selection in app/startup scripts (for example `node22` fallback), not in `devil www options`.

If Passenger restart is not picked up:
```bash
ssh vetternkraft@s0.mydevil.net "touch /usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/tmp/restart.txt"
ssh vetternkraft@s0.mydevil.net "touch /usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs/tmp/restart.txt"
ssh vetternkraft@s0.mydevil.net "touch /usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs/tmp/restart.txt"
ssh vetternkraft@s0.mydevil.net "touch /usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs/tmp/restart.txt"
```

---

## 7) Health checks + smoke tests (must-pass)

### API
- Health endpoint: https://api.salon-bw.pl/healthz

Manual check:
```bash
curl -fsS https://api.salon-bw.pl/healthz
```

### Auth flow (panel)
- Open https://panel.salon-bw.pl
- Register/login
- Confirm dashboard loads and core data (appointments/services) renders
- If login loops or returns 401/500:
  - validate cookie scope and allowed origins (see env section below)
  - check CSRF refresh behavior

---

## 8) Environment (production essentials)

API .env must include:
- COOKIE_DOMAIN=salon-bw.pl
- FRONTEND_URL=https://salon-bw.pl,https://www.salon-bw.pl,https://panel.salon-bw.pl
- JWT_SECRET
- JWT_REFRESH_SECRET

Rule: never commit secrets; reference docs/ENV.md as the canonical inventory.

Manual production API `.env` updates must use `scripts/safe-update-api-env.sh` (single-key update with backup + `.env` guardrail + health verification), not ad-hoc inline file rewrites.

---

## 9) Logs (where to look first)

- Passenger logs: ~/logs/nodejs/<app>/passenger.log
- App logs: ~/logs/nodejs/<app>/app.log
- Centralized logs: Loki (see docs/AGENT_OPERATIONS.md)

---

## 10) Agent maintenance policy (keep docs consistent)

After any change that affects deploy/infra/runtime behavior, update:
- docs/PROJECT_STATE.md and the task journal (AGENT_STATUS.md is archived)
- docs/DEPLOYMENT_MYDEVIL.md (if steps changed)
- Agent.md (repo-level instructions)
- This file (AGENTS.md) if it changes how agents must operate

---

## 11) “Do not break” list (practical guardrails)

- Do not change domain ownership/meaning:
  - salon-bw.pl is the production landing
  - panel/api are production auth + dashboard/backend
  - dev/dev-panel/dev-api are the isolated development stack
- Do not “simplify” cookies/origin rules without a confirmed auth test plan.
- Do not replace symlink-based deployment paths unless the workflow is updated accordingly.
- Do not add new tooling that requires new credentials unless explicitly provided and stored as Secrets.

---

## 12) Versum clone method (canonical, mandatory)

For cloning/copying Versum views and flows to panel, the canonical process is:
- `docs/VERSUM_CLONING_STANDARD.md`

Rules:
- Treat this document as the single source of truth for **how** to clone (copy-first, adapt later, validate parity).
- Any deviation from 1:1 must be explicitly documented in `docs/VERSUM_CLONE_PROGRESS.md`.
- Do not mark a module as "100%" if any UI action is stubbed, TODO, or missing parity smoke after deploy.
