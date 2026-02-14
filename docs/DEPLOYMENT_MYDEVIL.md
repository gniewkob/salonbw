# Deployment Runbook – mydevil hosting

This document describes how to deploy the Salon Black & White stack to the mydevil shared hosting platform. Adapt the paths/usernames below to match the live environment.

Most teams should prefer the automated GitHub Actions workflow `Deploy (MyDevil)` at `.github/workflows/deploy.yml` (see [`docs/CI_CD.md`](./CI_CD.md)). The steps below are a manual fallback and a useful reference when debugging.

Operational note (2026-02-14):
- Automated deploy transfers (`scp`/`rsync`) use explicit connection/transfer timeouts in workflow steps.
- If a transfer stalls, the job now fails instead of hanging indefinitely; re-run the workflow after failure.
- Frontend deploy bundles are transfer-lean (no `node_modules`, no `.next/cache` in tarball); production dependencies are installed on the FreeBSD host after extract (`npm22` fallback to `npm`).

## 0. Recommended: targeted deploys (GitHub Actions)

Use the workflow inputs to deploy only the app that changed and restart only that domain:

```bash
# Panel only
gh workflow run deploy.yml -f ref=master -f target=panel -f environment=production

# Landing only
gh workflow run deploy.yml -f ref=master -f target=public -f environment=production

# API only
gh workflow run deploy.yml -f ref=master -f target=api -f environment=production
```

On `push`, the workflow detects changed paths and skips apps that did not change.

## 1. Prerequisites

- SSH access to the production account (e.g. `user@s0.mydevil.net`) with public key authentication.
- Passenger-enabled Node.js applications configured for the public site (dev) and dashboard panel (panel).
- Environment variables stored outside the repo (`.env`, `.env.production`, secrets injected via deployment scripts). Review [`docs/ENV.md`](./ENV.md) for the required backend values (`FRONTEND_URL`, `COOKIE_DOMAIN`, throttler limits, Swagger flag, POS settings).
- Local machine has run through the release checklist in [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

Folder structure recommended on the server:

**Domain mapping:**
- `dev.salon-bw.pl` → public site (landing / wizytówka)
- `panel.salon-bw.pl` → dashboard (Versum clone)
- `api.salon-bw.pl` → backend API (symlinked domain root)

```
/home/<user>/domains/dev.salon-bw.pl/public_nodejs/    # Passenger app root (landing)
/home/<user>/domains/panel.salon-bw.pl/public_nodejs/  # Passenger app root (panel)
/home/<user>/apps/nodejs/api_salonbw                   # NestJS backend (symlinked into domains/api.salon-bw.pl/public_nodejs)
```

## 2. Build artifacts locally

```bash
# Ensure fresh installs
pnpm install

# Backend (NestJS)
pnpm --filter salonbw-backend build

# Frontend (Next.js)
pnpm --filter @salonbw/landing build
pnpm --filter @salonbw/panel build
```

The Next.js build outputs `.next`, and (if `output: 'standalone'` is configured) `.next/standalone`. When the standalone output is unavailable, you must ship the entire repo subtree required by Next.js (`.next`, `node_modules`, `public`).
> **Heads-up:** The runtime bootstrap (`apps/landing/app.cjs` / `app.js`, `apps/panel/app.cjs` / `app.js`) now auto-links both `.next/static` and `public/` into the standalone directory at startup. You still need to upload those folders with the build artifacts so the bootstrap has something to link to.

## 3. Upload to mydevil (manual reference)

Adjust the commands below to your environment. Use `rsync` for incremental uploads:

```bash
# Frontend (public site)
rsync -avz \
  --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  apps/landing/.next \
  apps/landing/public \
  apps/landing/package.json \
  apps/landing/package-lock.json \
  <user>@s0.mydevil.net:/home/<user>/domains/dev.salon-bw.pl/public_nodejs/

# Frontend (panel)
rsync -avz \
  --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  apps/panel/.next \
  apps/panel/public \
  apps/panel/package.json \
  apps/panel/package-lock.json \
  <user>@s0.mydevil.net:/home/<user>/domains/panel.salon-bw.pl/public_nodejs/

# Backend API (symlinked)
rsync -avz \
  --delete \
  --exclude='.git' \
  backend/salonbw-backend/dist \
  backend/salonbw-backend/node_modules \
  backend/salonbw-backend/package.json \
  backend/salonbw-backend/package-lock.json \
  <user>@s0.mydevil.net:/home/<user>/apps/nodejs/api_salonbw/
```

Upload environment files securely (never commit them):

```bash
scp backend/salonbw-backend/.env <user>@s0.mydevil.net:/home/<user>/apps/api/.env
scp apps/landing/.env.production <user>@s0.mydevil.net:/home/<user>/domains/dev.salon-bw.pl/public_nodejs/.env.production
scp apps/panel/.env.production <user>@s0.mydevil.net:/home/<user>/domains/panel.salon-bw.pl/public_nodejs/.env.production
```

SMTP note (production):
- `SMTP_USER` / `SMTP_PASSWORD` should be set directly on the server (API `.env`) and not stored in CI/CD.
- The automated workflow preserves existing `SMTP_*` lines on the server when updating `.env`.

## 4. Install dependencies on the server

SSH into mydevil and run:

```bash
# Frontend (landing)
cd /home/<user>/domains/dev.salon-bw.pl/public_nodejs
npm install --production

# Frontend (panel)
cd /home/<user>/domains/panel.salon-bw.pl/public_nodejs
npm install --production

# Backend
cd /home/<user>/apps/nodejs/api_salonbw
npm install --production
```

If you generated a standalone build (`.next/standalone`), dependencies are already bundled and you may skip `npm install` for the landing and panel apps. Keep the `public` and `.next/static` directories alongside the standalone server; the bootstrap script will create symlinks (or copies as a fallback) pointing to them when Passenger starts the app.

## 5. Restart apps (MyDevil official)

MyDevil restarts are handled via the Devil CLI after SSH login. The `www` module manages WWW domains, including Node.js apps. Use the official restart command for each domain:

```bash
ssh <user>@s0.mydevil.net
devil www restart <domain>
```

Optional: adjust Passenger process limits for Node.js domains if needed:

```bash
devil www options <domain> processes <COUNT>
```

Important:
- On this MyDevil profile, `devil www options <domain> nodejs_version ...` is unsupported and returns a syntax error.
- Treat Node version as an app/runtime concern (e.g. `node22` in startup scripts); do not automate `nodejs_version` via Devil CLI.

If Devil returns an invalid domain type, or the new build is not picked up, touch the Passenger restart file and retry:

```bash
ssh <user>@s0.mydevil.net "touch /home/<user>/domains/<domain>/public_nodejs/tmp/restart.txt"
```

You can also perform the restart from DevilWEB (WWW tab) if you prefer the GUI. Confirm the application process started cleanly by inspecting the Passenger logs (e.g. `~/logs/nodejs/<app>/passenger.log`).

## 5a. Image Optimization (Next.js)

- The landing and panel apps ship with Next.js Image Optimization enabled. The default build proxies remote images through the standalone server and respects `next.config.mjs` domain allowlists (`scontent.cdninstagram.com`, `cdninstagram.com`).
- MyDevil deployments **must** keep the `.next/image` directory and `public/` assets alongside each standalone bundle. The startup script attempts to link/copy both into `.next/standalone`, but it can only work if the source folders were uploaded.
- If the host ever blocks the image proxy, set `NEXT_IMAGE_UNOPTIMIZED=true` in the relevant `.env.production` file during deployment to fall back to direct image URLs.

## 6. Database migrations

If the backend changes require TypeORM migrations:

```bash
cd /home/<user>/apps/api
npx typeorm-ts-node-commonjs migration:run -d dist/ormconfig.js
```

Ensure the database connection details (`DATABASE_URL`) match the production PostgreSQL instance.

## 7. Smoke test

1. Hit the backend health endpoint: `curl https://api.<domain>/healthz`.
2. Load the public site (dev) and panel login page in a browser.
3. Perform a quick happy path (login → panel dashboard → create dummy appointment → cancel).

If issues appear, roll back by redeploying the previous release artifacts and restarting Passenger again.

## 8. Post-deploy housekeeping

- Clear any temporary build files left in `/tmp` or the home directory.
- Rotate SSH keys/secrets if they were temporarily exposed during upload.
- Update the release ticket with timestamps, commit identifiers, and any follow-up tasks.

Refer back to the release checklist for monitoring responsibilities immediately after deployment.
