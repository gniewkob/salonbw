# Deployment Runbook – mydevil hosting

This document describes how to deploy the Salon Black & White stack to the mydevil shared hosting platform. Adapt the paths/usernames below to match the live environment.

Most teams should prefer the automated GitHub Actions workflow `Deploy (MyDevil)` at `.github/workflows/deploy.yml` (see [`docs/CI_CD.md`](./CI_CD.md)). The steps below are a manual fallback and a useful reference when debugging.

## 1. Prerequisites

- SSH access to the production account (e.g. `user@s0.mydevil.net`) with public key authentication.
- Passenger-enabled Node.js applications configured for the public site and dashboard panel(s).
- Environment variables stored outside the repo (`.env`, `.env.production`, secrets injected via deployment scripts). Review [`docs/ENV.md`](./ENV.md) for the required backend values (`FRONTEND_URL`, `COOKIE_DOMAIN`, throttler limits, Swagger flag, POS settings).
- Local machine has run through the release checklist in [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md).

Folder structure recommended on the server:

```
/home/<user>/domains/<domain>/public_nodejs/    # Passenger app root for Next.js build
/home/<user>/apps/api/                          # NestJS backend (optional separate app)
```

## 2. Build artifacts locally

```bash
# Ensure fresh installs
pnpm install

# Backend (NestJS)
pnpm --filter salonbw-backend build

# Frontend (Next.js)
pnpm --filter frontend build
```

The Next.js build outputs `.next`, and (if `output: 'standalone'` is configured) `.next/standalone`. When the standalone output is unavailable, you must ship the entire repo subtree required by Next.js (`.next`, `node_modules`, `public`).
> **Heads-up:** The runtime bootstrap (`frontend/app.cjs` / `app.js`) now auto-links both `.next/static` and `public/` into the standalone directory at startup. You still need to upload those folders with the build artifacts so the bootstrap has something to link to.

## 3. Upload to mydevil (manual reference)

Adjust the commands below to your environment. Use `rsync` for incremental uploads:

```bash
# Frontend (public site / dashboard)
rsync -avz \
  --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  frontend/.next \
  frontend/public \
  frontend/package.json \
  frontend/package-lock.json \
  <user>@s0.mydevil.net:/home/<user>/domains/<domain>/public_nodejs/

# Backend API (if hosted separately)
rsync -avz \
  --delete \
  --exclude='.git' \
  backend/salonbw-backend/dist \
  backend/salonbw-backend/node_modules \
  backend/salonbw-backend/package.json \
  backend/salonbw-backend/package-lock.json \
  <user>@s0.mydevil.net:/home/<user>/apps/api/
```

Upload environment files securely (never commit them):

```bash
scp backend/salonbw-backend/.env <user>@s0.mydevil.net:/home/<user>/apps/api/.env
scp frontend/.env.production <user>@s0.mydevil.net:/home/<user>/domains/<domain>/public_nodejs/.env.production
```

## 4. Install dependencies on the server

SSH into mydevil and run:

```bash
# Frontend (inside public_nodejs/)
cd /home/<user>/domains/<domain>/public_nodejs
npm install --production

# Backend (if separate)
cd /home/<user>/apps/api
npm install --production
```

If you generated a standalone build (`.next/standalone`), dependencies are already bundled and you may skip `npm install` for the frontend. Keep the `public` and `.next/static` directories alongside the standalone server; the bootstrap script will create symlinks (or copies as a fallback) pointing to them when Passenger starts the app.

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

You can also perform the restart from DevilWEB (WWW tab) if you prefer the GUI. Confirm the application process started cleanly by inspecting the Passenger logs (e.g. `~/logs/nodejs/<app>/passenger.log`).

## 5a. Image Optimization (Next.js)

- The frontend ships with Next.js Image Optimization enabled. The default build proxies remote images through the standalone server and respects `next.config.mjs` domain allowlists (`scontent.cdninstagram.com`, `cdninstagram.com`).
- MyDevil deployments **must** keep the `.next/image` directory and `public/` assets alongside the standalone bundle. The startup script attempts to link/copy both into `.next/standalone`, but it can only work if the source folders were uploaded.
- If the host ever blocks the image proxy, set `NEXT_IMAGE_UNOPTIMIZED=true` in the `.env.production` file during deployment to fall back to direct image URLs.

## 6. Database migrations

If the backend changes require TypeORM migrations:

```bash
cd /home/<user>/apps/api
npx typeorm-ts-node-commonjs migration:run -d dist/ormconfig.js
```

Ensure the database connection details (`DATABASE_URL`) match the production PostgreSQL instance.

## 7. Smoke test

1. Hit the backend health endpoint: `curl https://api.<domain>/healthz`.
2. Load the public site and dashboard login page in a browser.
3. Perform a quick happy path (login → dashboard → create dummy appointment → cancel).

If issues appear, roll back by redeploying the previous release artifacts and restarting Passenger again.

## 8. Post-deploy housekeeping

- Clear any temporary build files left in `/tmp` or the home directory.
- Rotate SSH keys/secrets if they were temporarily exposed during upload.
- Update the release ticket with timestamps, commit identifiers, and any follow-up tasks.

Refer back to the release checklist for monitoring responsibilities immediately after deployment.
