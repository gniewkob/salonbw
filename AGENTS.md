# AGENTS.md (Codex-first, repo-wide)

This file is Codex-oriented but intentionally compatible with other agents.
It defines how agents should operate in this repository: what is “production”, how to deploy, how to verify, and what not to break.

---

## 0) Non-negotiables (execution rules)

1. Read-before-write: before changing anything, read:
   - Agent.md
   - docs/ (especially deployment + env + ops docs)
   - .github/workflows/*
2. No secrets in commits: never introduce secrets into git. Use existing GitHub Secrets / server env.
3. No “best guess” infra edits: if a change requires unknown values (domains, paths, env keys, credentials), stop and ask for exact inputs instead of inventing them.
4. Single change-set: keep changes minimal, scoped, and reversible.

---

## 1) Production topology (authoritative)

### Domains (current reality)
- Legacy public site (will be replaced): https://salon-bw.pl
  Status: legacy, to be replaced by the dev landing after development completion.
- Landing page (customer-facing): https://dev.salon-bw.pl
  Role: marketing/landing for customers.
- Panel: https://panel.salon-bw.pl
  Role: registration + login; after login: dashboard for customers and staff.
- API: https://api.salon-bw.pl
  Role: backend for dev and panel.

### Contract
- dev and panel talk to the same api.
- Auth happens via the panel (cookies/session/token flows).
- The legacy salon-bw.pl must not be treated as canonical going forward.

---

## 2) Repository mapping (what’s what)

### Apps
- Landing: apps/landing
- Panel: apps/panel
- Admin: apps/admin (exists in workflows; treat as separate deployable)

Panel canonical admin routes:
- `/calendar`, `/clients`, `/products`, `/statistics`, `/communication`, `/services`, `/settings`, `/extension`
- legacy `/admin/*` entry routes should be treated as compatibility aliases/redirects

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

---

## 5) Production paths (MyDevil) — operational reference

### Canonical public_nodejs domain roots
- API: /usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs (symlink to /usr/home/vetternkraft/apps/nodejs/api_salonbw)
- Legacy public: /usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs
- Panel: /usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs
- Landing (dev): /usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs

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
- FRONTEND_URL=https://dev.salon-bw.pl,https://panel.salon-bw.pl
- JWT_SECRET
- JWT_REFRESH_SECRET

Rule: never commit secrets; reference docs/ENV.md as the canonical inventory.

---

## 9) Logs (where to look first)

- Passenger logs: ~/logs/nodejs/<app>/passenger.log
- App logs: ~/logs/nodejs/<app>/app.log
- Centralized logs: Loki (see docs/AGENT_OPERATIONS.md)

---

## 10) Agent maintenance policy (keep docs consistent)

After any change that affects deploy/infra/runtime behavior, update:
- docs/AGENT_STATUS.md
- docs/DEPLOYMENT_MYDEVIL.md (if steps changed)
- Agent.md (repo-level instructions)
- This file (AGENTS.md) if it changes how agents must operate

---

## 11) “Do not break” list (practical guardrails)

- Do not change domain ownership/meaning:
  - dev is the landing
  - panel is auth + dashboard
  - api is backend
  - salon-bw.pl is legacy and will be replaced
- Do not “simplify” cookies/origin rules without a confirmed auth test plan.
- Do not replace symlink-based deployment paths unless the workflow is updated accordingly.
- Do not add new tooling that requires new credentials unless explicitly provided and stored as Secrets.
