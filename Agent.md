# Agent Instructions (SalonBW)

This file is the single source of truth for AI/automation work in this repo.
Keep it short, actionable, and update it after any infra or deployment change.

## 1. Stack + domains (production)
- Public site: `https://salon-bw.pl`
- Public preview / customer-facing: `https://dev.salon-bw.pl`
- Dashboard (staff/admin/client): `https://panel.salon-bw.pl`
- Backend API: `https://api.salon-bw.pl`
- All frontends talk to the same API; auth happens on panel, customer-facing stays on dev/public.

## 2. Deployments (preferred)
- Use GitHub Actions: `.github/workflows/deploy.yml` (workflow name: **Deploy (MyDevil)**).
- Order: API first, then frontends.

```bash
# API (deploy first)
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api

# Frontends (after API)
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=public
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=dashboard
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=admin

# Monitor
gh run list --workflow .github/workflows/deploy.yml --limit 5
```

## 3. Restarts (MyDevil official)
- Restart via Devil CLI (after SSH). If Devil reports an invalid domain type or the build is not picked up, fall back to touching `tmp/restart.txt`.

```bash
ssh vetternkraft@s0.mydevil.net
# restart a domain

devil www restart <domain>
# optional: adjust Passenger process count

devil www options <domain> processes <COUNT>
```

- Fallback when Devil restart fails:

```bash
ssh vetternkraft@s0.mydevil.net "touch /usr/home/vetternkraft/domains/<domain>/public_nodejs/tmp/restart.txt"
```

## 4. Production paths (MyDevil)
- API: `/usr/home/vetternkraft/apps/nodejs/api_salonbw` (symlinked into `/usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs`)
- Public: `/usr/home/vetternkraft/domains/salon-bw.pl/public_nodejs`
- Panel: `/usr/home/vetternkraft/domains/panel.salon-bw.pl/public_nodejs`
- Dev: `/usr/home/vetternkraft/domains/dev.salon-bw.pl/public_nodejs`

## 5. Health checks + smoke tests
- API health: `https://api.salon-bw.pl/healthz`
- Auth flow: login -> panel dashboard -> appointments/services load.
- If login loops or shows 401/500, check cookies (COOKIE_DOMAIN) + CSRF refresh flow.

## 6. Environment (production essentials)
- Must be set in API `.env`:
  - `COOKIE_DOMAIN=salon-bw.pl`
  - `FRONTEND_URL=https://dev.salon-bw.pl,https://panel.salon-bw.pl`
  - `JWT_SECRET` / `JWT_REFRESH_SECRET`
- Never commit secrets. See `docs/ENV.md`.

## 7. DB migrations
- Prefer running migrations via deploy workflow.
- Manual fallback: see `docs/DEPLOYMENT_MYDEVIL.md`.

## 8. Logs
- Passenger logs: `~/logs/nodejs/<app>/passenger.log`
- App logs: `~/logs/nodejs/<app>/app.log`
- Centralized logs: Loki (see `docs/AGENT_OPERATIONS.md`).

## 9. Update policy
- After any deploy or infra change, update:
  - `docs/AGENT_STATUS.md`
  - `docs/DEPLOYMENT_MYDEVIL.md` (if steps changed)
  - This file (Agent.md)

## 10. References
- `docs/AGENT_OPERATIONS.md`
- `docs/DEPLOYMENT_MYDEVIL.md`
- `docs/CI_CD.md`
- `docs/RELEASE_CHECKLIST.md`
- **More context lives in `docs/`** (architecture, rollout, monitoring, and Versum-clone notes).
