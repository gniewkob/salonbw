# Agent Instructions (SalonBW)

This file is the single source of truth for AI/automation work in this repo.
Keep it short, actionable, and update it after any infra or deployment change.

## 1. Stack + domains (production)
- Public site: `https://salon-bw.pl`
- Public preview / customer-facing: `https://dev.salon-bw.pl`
- Dashboard (staff/admin/client): `https://panel.salon-bw.pl`
- Backend API: `https://api.salon-bw.pl`
- All frontends talk to the same API; auth happens on panel, customer-facing stays on dev/public.
- Panel admin canonical modules: `/calendar`, `/clients`, `/products`, `/statistics`, `/communication`, `/services`, `/settings`, `/extension` (legacy `/admin/*` routes are aliases/redirects).
- Calendar route (`/calendar`) is a vendored Versum runtime embed (`apps/panel/public/versum-calendar/index.html`) and relies on backend compat endpoints (`/events/*`, `/settings/timetable/schedules/*`, `/graphql`, `/track_new_events.json`) proxied through panel rewrites; legacy `/salonblackandwhite/*` paths are rewritten to local routes for runtime compatibility.

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

- Do **not** use `devil www options <domain> nodejs_version ...` on this host profile; this syntax is not supported and returns an error.

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
- Migrations are API-only (`target=api`); dashboard/panel deploys should not attempt DB migrations.
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

## 9a. CI audit policy
- CI security audit fails only on **high/critical** vulnerabilities.
- Moderate/low vulnerabilities are reported in the job summary but do not fail CI.

## 10. References
- `docs/AGENT_OPERATIONS.md`
- `docs/DEPLOYMENT_MYDEVIL.md`
- `docs/CI_CD.md`
- `docs/RELEASE_CHECKLIST.md`
- **More context lives in `docs/`** (architecture, rollout, monitoring, and Versum-clone notes).

## 11. CI notes
- `e2e-frontend-chrome.yml` runs panel E2E with a local backend via the MyDevil SSH tunnel and needs the same secrets as `e2e.yml`.

## 12. MANDATORY Pre-Commit Checklist (Agent MUST follow)

**CRITICAL**: Before ANY git commit, the agent MUST run these checks locally and fix all errors:

```bash
# 1. Panel (frontend) - REQUIRED before committing panel changes
cd apps/panel
pnpm eslint src --fix
pnpm tsc --noEmit

# 2. Backend - REQUIRED before committing backend changes
cd backend/salonbw-backend
pnpm lint --fix
pnpm tsc --noEmit

# 3. Landing (if changed)
cd apps/landing
pnpm eslint src --fix
pnpm tsc --noEmit
```

**Rules**:
- NEVER commit if lint or typecheck fails
- NEVER skip these checks "to save time"
- If lint --fix doesn't resolve all issues, manually fix remaining errors before commit
- Run checks for ALL packages that have modified files

## 13. Development Phase Testing Strategy

**Local (before commit)**:
- Lint + typecheck (mandatory, see above)
- Manual smoke test of changed functionality

**After deployment (production verification)**:
- Verify API health: `curl https://api.salon-bw.pl/healthz`
- Verify panel loads: open https://panel.salon-bw.pl
- Test login flow if auth-related changes
- Check browser console for errors

**If deployment fails**:
1. Check CI logs: `gh run view <run-id> --log-failed`
2. Fix locally, run pre-commit checks again
3. Commit fix and redeploy
