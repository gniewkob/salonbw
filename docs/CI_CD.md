# CI/CD Overview

This document summarises the GitHub Actions workflows introduced for Salon Black & White and the secrets required to operate them.

## Workflows

### `ci.yml`

Runs on every push to `main` and on pull requests. Key behaviour:

- **Frontend matrix (`public`, `dashboard`, `admin`)** – each entry runs lint, typecheck, Jest tests, and `next build`. A change detector skips the matrix entry when the relevant routes/components are untouched.
- **Backend job** – lints, type-checks, tests, and builds the NestJS API using the pnpm workspace.
- Caching via `actions/setup-node` (pnpm cache) keeps installs fast. Supply `NPM_TOKEN` if private packages are needed.

### `e2e.yml`

Manual (`workflow_dispatch`) and automatic on pushes to `main`. Steps:

1. Installs dependencies with pnpm.
2. Configures an SSH key and opens a tunnel to the mydevil PostgreSQL host via `pnpm tunnel:start`.
3. Builds and starts the NestJS backend (listening on port `3001`).
4. Runs Cypress headless tests via `pnpm --filter frontend e2e:ci`.
5. Uploads screenshots/videos on failure and tears down the tunnel/back-end.

    Expect this workflow to require the secrets listed below; without them the tunnel/startup phase will fail.

### `e2e-frontend-chrome.yml`

Runs the frontend E2E suite against a locally started Next.js server using Chrome in headless mode. This job does not depend on the backend or the SSH tunnel and is suitable for PR validation of UI flows covered by mocks.

- Detects frontend changes via path filters and skips when unaffected.
- Installs dependencies with pnpm, builds the frontend, starts `next start`, and runs `cypress run --browser chrome`.
- Uploads videos/screenshots on failure for debugging.

Trigger manually with the GitHub CLI:

```bash
gh workflow run e2e-frontend-chrome.yml -r <branch-or-sha>
```

### Deployment workflows

- `deploy_api.yml`
- `deploy_public.yml`
- `deploy_dashboard.yml`
- `deploy_admin.yml`

These GitHub Actions deploy the production artefacts via rsync/ssh when triggered with `workflow_dispatch`. Each workflow now finishes with automated smoke checks powered by `scripts/post_deploy_checks.py`, which:

- retries failing checks up to four times with exponential backoff;
- writes pass/fail state to the job summary (`GITHUB_STEP_SUMMARY`);
- checks host-specific endpoints (API: `/healthz`, `/health`, `/emails/send`; Public/dashboard/admin: at least `/` and `robots.txt` where applicable).

Set the optional repository variable `SMOKE_EMAIL_TO` to change the API smoke-test recipient; otherwise it defaults to `kontakt@salon-bw.pl`. The script lives at [`scripts/post_deploy_checks.py`](../scripts/post_deploy_checks.py) and can be re-used locally:

```bash
TARGET_HOST=api.salon-bw.pl DEPLOY_TARGET=api python3 scripts/post_deploy_checks.py
```

## Required Secrets

| Secret | Purpose |
| --- | --- |
| `NPM_TOKEN` | Optional – authenticate against npm registry for private packages. |
| `MYDEVIL_SSH_HOST` | Hostname for SSH connections (e.g. `s0.mydevil.net`). |
| `MYDEVIL_SSH_USER` | SSH username with deployment/database tunnel rights. |
| `MYDEVIL_SSH_KEY` | Private key (PEM) used by workflows (`600` permissions required). |
| `MYDEVIL_KNOWN_HOSTS` | Optional pre-computed `known_hosts` entry; otherwise the workflow will `ssh-keyscan`. |
| `MYDEVIL_PG_HOST` / `MYDEVIL_PG_PORT` | Internal PostgreSQL hostname/port exposed via the SSH tunnel. |
| `MYDEVIL_DB_USER` / `MYDEVIL_DB_PASSWORD` / `MYDEVIL_DB_NAME` | Credentials to build the `DATABASE_URL` consumed by the backend during e2e runs. |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets required when the backend boots in CI. |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `REMINDER_HOURS_BEFORE` | Optional – populate if WhatsApp reminders are enabled in CI/E2E. |
| `MYDEVIL_DEPLOY_PATH`, `MYDEVIL_DASHBOARD_PATH`, `MYDEVIL_ADMIN_PATH` | Target directories for the deployment templates (set when you implement the actual rsync commands). |

Populate the secrets in the repository or organisation settings before enabling each workflow. For non-production environments, create separate values and reference them via GitHub environments.

## Local vs CI strategy

- Local: run only unit tests and targeted E2E specs as needed. For macOS machines where Electron verification is flaky, prefer Chrome and the split server approach:

  ```bash
  # Terminal 1
  pnpm --filter frontend build
  NEXT_PUBLIC_API_URL=/api pnpm --filter frontend start:e2e

  # Terminal 2
  pnpm --filter frontend e2e:chrome:split -- --spec cypress/e2e/access-control.cy.ts,cypress/e2e/auth.cy.ts
  ```

- CI: rely on `ci.yml` for lint/typecheck/unit/build and `e2e-frontend-chrome.yml` for UI E2E with Chrome.

## Local Verification

Before pushing changes to the workflows:

1. Run `pnpm lint`, `pnpm typecheck`, and `pnpm --filter frontend build` locally.
2. For E2E, ensure `pnpm tunnel:start` works from your machine and that the backend responds on `/healthz`.
3. Consider dry-running the templates using `act` or by temporarily pointing them at a staging environment.
