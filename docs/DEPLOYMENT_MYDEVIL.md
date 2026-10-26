# Deployment Runbook – mydevil hosting

## Two environments (active topology, 2026-10-25)

| Environment | Landing | Panel | API | App directories under `~/apps/nodejs/` |
| --- | --- | --- | --- | --- |
| production | salon-bw.pl | panel.salon-bw.pl | api.salon-bw.pl | salonbw_prod, panelbw, api_salonbw |
| staging (development) | dev.salon-bw.pl | dev-panel.salon-bw.pl | dev-api.salon-bw.pl | salonbw, panelbw_dev, api_salonbw_dev |

Canonical Node.js activation and isolated development acceptance completed on
2026-10-25. The final production API/panel rollout is tracked in
[journal](journal/2026-10-25-isolated-environments.md); use its run IDs/statuses
as evidence, not this topology description. /home and /usr/home are verified
aliases on this account. Link checks compare canonical targets, preserving the
original link spelling. Never use prepare_only on an already active app as a
claim that its files remain untouched: that mode uploads files and skips activation.

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

Canonical Next.js production was activated on 2026-10-25/26. The owner
explicitly retired CodeIgniter/PHP on 2026-10-26 and authorized permanent
deletion of its inactive `public_html` tree and identifiable legacy archives.
Use `scripts/mydevil/retire-legacy-php-landing.sh` with the guarded audit /
execute flow (journal: `2026-10-26-retire-legacy-php-landing.md`).
**Never revert the WWW type to PHP.** Roll back only to the previous
verified Next.js deployment. Keep permanent 301 redirects for indexed PHP URLs
inside Next middleware; those routes do not require PHP runtime.

Frontend acceptance checks HTML, running Next build ID and non-secret release
metadata; API acceptance requires the exact X-SalonBW-Release and healthy DB.
Public startup/error diagnostics are prohibited; use owner-only .diagnostics
and bounded status summaries. A backup listing is not a restoration test.


This document describes how to deploy the Salon Black & White stack to the mydevil shared hosting platform. Adapt the paths/usernames below to match the live environment.

Most teams should prefer the automated GitHub Actions workflow `Deploy (MyDevil)` at `.github/workflows/deploy.yml` (see [`docs/CI_CD.md`](./CI_CD.md)). The steps below are a manual fallback and a useful reference when debugging.

Dependency security note (2026-09-07): CI builds use the pnpm workspace, but
remote runtime installs use npm with each app's `package.json`. A workspace
override alone does not patch the running app. Applicable security fixes must
also be represented by npm `overrides` in the deployed app manifest. After
deployment, verify the affected versions with `npm22 ls <packages> --omit=dev
--all` in each deployed app directory; do not infer them from the CI lockfile.

Operational note (2026-02-14):
- Automated deploy transfers (`scp`/`rsync`) use explicit connection/transfer timeouts in workflow steps.
- If a transfer stalls, the job now fails instead of hanging indefinitely; re-run the workflow after failure.
- Frontend deploy bundles are transfer-lean (no `node_modules`, no `.next/cache` in tarball); production dependencies are installed on the FreeBSD host after extract (`npm22` fallback to `npm`).
- Remote dependency install steps are retry-guarded in workflow (`3` attempts for panel/landing/api) to absorb transient npm/network failures.
- Push-triggered deploy follow-up steps are target-aware: landing smoke/log collection only runs when landing is actually deployed, and SSH-based diagnostics are skipped when the SSH setup step did not complete.
- Push change detection reads the complete pushed commit range through
  `scripts/ci/detect-deploy-changes.sh`; the workflow checkout must remain full
  depth so batched commits do not trigger an all-app deploy.
- Before any code deploy work, the workflow resolves the requested ref to an
  immutable SHA and requires a successful `CI` run for exactly that SHA.
  Failed/cancelled CI or a 30-minute wait timeout stops the job before install,
  build, SSH upload, migrations, and restart. Manual refs need a prior CI run.
- Automatic pushes to `master` use the `production` GitHub environment and the
  same production destination selected by `DEPLOY_ENV`.
- Frontend extraction runs through
  `scripts/mydevil/extract-frontend-bundle.sh`: an invalid archive rolls back,
  while a successful release retains exactly one previous generation of
  fingerprinted `.next/static` files to protect already-open browser tabs.
- MyDevil process-limit guardrail (2026-07-20/21): do not run frontend app boot probes manually from deploy (`node app.js`, `next start`, background Node tests). Passenger is the only expected runtime starter. A temporary cleanup cron exists at `/usr/home/vetternkraft/bin/cleanup-codex-remote-payload.sh` to remove stopped `CODEX_REMOTE_PAYLOAD` shells while the external remote-exec behavior is being controlled. Immediately before termination, the script records target and parent PID metadata (PGID/SID/TTY/TPGID/state/etime/start time/wchan/xstat/command) in the owner-only `~/logs/codex-payload-cleanup.log`; process environments are deliberately excluded. On FreeBSD, `xstat` supplies the stop status needed to distinguish signals such as `SIGTTIN`. Termination is limited to PIDs captured in that diagnostic batch, with stopped state and the Codex marker revalidated immediately before TERM and KILL; newly appearing, running, or unrelated stopped processes are excluded. Run with `CODEX_PAYLOAD_CLEANUP_DRY_RUN=1` to record the complete candidate diagnostics without sending TERM or KILL. The versioned source is `scripts/mydevil/cleanup-codex-remote-payload.sh`; deploy that source to the host if the guardrail needs changes.

Operational note (2026-05-26):
- API deploy env merge now preserves existing server-side `.env` keys and overrides only keys generated in CI for the current deploy.
- This prevents accidental deletion of runtime-only settings during deploy (for example logging/auth-related keys not part of the generated subset).

### Technical administrator rollout

Deploy API first so the additive `isSystemAdmin` migration exists, then panel.
Existing accounts default to false. Assign the technical flag only to the
owner-approved existing admin after verifying it has no service assignments,
appointment-provider history or timetable. Increment `authVersion` and revoke
its refresh tokens in the same transaction; do not reset passwords or erase
login attempts. Do not encode a private e-mail in migrations or application code.

`APP_RELEASE` is written from the workflow's resolved immutable source SHA;
`GET /system/status` exposes it only to system administrators. A missing value
is unknown, not a successful release proof. Smoke: regular admin/client cannot
read status, system admin can, staff selectors/booking exclude that account,
owner-stylist remains bookable. Rolling UI back does not require dropping the
column or changing passwords; the flag remains in the database for a controlled
rollout/rollback decision.

## 0. Recommended: targeted deploys (GitHub Actions)

Use the workflow inputs to deploy only the app that changed and restart only that domain:

```bash
# Panel only
gh workflow run deploy.yml -f ref=master -f target=panel -f environment=production

# Landing only
gh workflow run deploy.yml -f ref=master -f target=landing -f environment=production

# API only
gh workflow run deploy.yml -f ref=master -f target=api -f environment=production

# Everything in one dispatch (api migrations run before frontend restarts)
gh workflow run deploy.yml -f ref=master -f target=all -f environment=production
```

Canonical target names: `landing | panel | api | all | probe`. Aliases preserved for backward compatibility: `public` = `landing`, `dashboard` = `panel`, `admin` = `panel`.

On `push`, `scripts/ci/detect-deploy-changes.sh` compares the complete
`github.event.before..github.sha` range and skips apps that did not change. Its
outputs feed the same `deploy_landing` / `deploy_panel` / `deploy_api` flags
used by manual dispatches. The CI gate runs first and uses the immutable checked
out SHA, so a newer branch commit cannot replace the requested artifact.

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

### 1a. Final canonical-domain cutover

`dev.salon-bw.pl` is the public preview environment. After the landing release
has passed technical smoke tests and business acceptance, moving that accepted
release to `salon-bw.pl` requires a separate cutover and verification step.

The cutover is not complete until:

1. `salon-bw.pl` serves the accepted release and its canonical metadata points
   to `https://salon-bw.pl`.
2. `/privacy`, `/policy`, and `/data-deletion` return HTTP `200` publicly on
   `salon-bw.pl` without redirects to the preview domain or authentication.
3. The production Meta/Instagram application's legal URLs are saved as:
   - Privacy Policy URL: `https://salon-bw.pl/privacy`
   - Terms of Service URL: `https://salon-bw.pl/policy`
   - Data Deletion Instructions URL: `https://salon-bw.pl/data-deletion`
4. App Domains, Site URL, and OAuth redirect URIs are updated to
   `salon-bw.pl` only when Business Login is part of the deployed architecture.
   The read-only Instagram gallery does not require Business Login or webhook
   configuration.
5. The saved Meta links are opened from a signed-out/private browser session and
   the external configuration is checked for stale `dev.salon-bw.pl`, homepage-
   only, or third-party legal links.

Do not perform this Meta update during preview testing and do not treat a
redirect from the preview domain as the final configuration. Use the cutover
section in [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) as the release
gate.

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

Post-env-change restart note:
- After any API `.env` change, run `devil www restart api.salon-bw.pl` and immediately verify `/healthz`.
- If the new env is not picked up, force Passenger reload with:
  `touch /usr/home/vetternkraft/domains/api.salon-bw.pl/public_nodejs/tmp/restart.txt`.
- Guardrail for manual API `.env` edits: use `scripts/safe-update-api-env.sh` instead of ad-hoc shell editing.
  It creates a backup, updates a single key, blocks malformed `.env` writes (including literal `\n` serialization), and can verify `/healthz`.

```bash
# Example: update one runtime key safely (value via stdin, no shell history leak)
printf '%s' "$NEW_SECRET" | scripts/safe-update-api-env.sh --key SMTP_PASSWORD --read-stdin
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
4. If the deploy includes calendar compat/runtime changes, run the dedicated dashboard smoke:

```bash
cd apps/panel
source ../../.env
PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm test:prod:calendar --project=desktop-1366
```

Expected for a healthy calendar compat deploy:
- vendored `/calendar` loads without failed `/salonbw-calendar/*` or `/salonbw-vendor/*` requests,
- runtime exposes `window.SalonBWConfig` and keeps `window.VersumConfig` as compat alias,
- no `Unhandled response status error` caused by `POST /graphql` returning `201`.

If issues appear, roll back by redeploying the previous release artifacts and restarting Passenger again.

## 8. Post-deploy housekeeping

- Clear any temporary build files left in `/tmp` or the home directory.
- Rotate SSH keys/secrets if they were temporarily exposed during upload.
- Update the release ticket with timestamps, commit identifiers, and any follow-up tasks.

Refer back to the release checklist for monitoring responsibilities immediately after deployment.
