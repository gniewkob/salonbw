# Salon Black & White

[![CI](https://github.com/gniewkob/salonbw/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/gniewkob/salonbw/actions/workflows/ci.yml)

Salon Black & White is a full-stack monorepo containing:

- a [Next.js](https://nextjs.org) frontend in [`frontend/`](frontend/)
- a [NestJS](https://nestjs.com) backend API in [`backend/salonbw-backend/`](backend/salonbw-backend/)
- shared packages (OpenAPI client, utilities) in [`packages/`](packages/)

This README summarises the essentials. For deep dives, see the living documentation in [`docs/`](docs/).

## Getting started

1. **Prerequisites**
   - Node.js 22 (see [`.nvmrc`](./.nvmrc)); install via `nvm`.
   - [pnpm](https://pnpm.io) ≥ 10.
   - macOS setup instructions: [`docs/DEV_SETUP_MAC.md`](docs/DEV_SETUP_MAC.md).

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment variables**
   - Copy samples and adjust as needed (see [`docs/ENV.md`](docs/ENV.md)):

     ```bash
     cp frontend/.env.local.example frontend/.env.local
     cp backend/salonbw-backend/.env.example backend/salonbw-backend/.env
     cp .env.development.local.example .env.development.local    # optional tunnel defaults
     ```

4. **Run the stack**

   ```bash
   # Terminal 1 – backend
   pnpm --filter salonbw-backend start:dev

   # Terminal 2 – frontend
   pnpm --filter frontend dev
   ```

   Visit <http://localhost:3000>. The frontend proxies the backend using `NEXT_PUBLIC_API_URL`.

5. **Optional: connect to production DB via tunnel**
   - Configure `.env.development.local` (mydevil host/user/db) and run:

     ```bash
     pnpm tunnel:start
     # ...start backend as above...
     pnpm tunnel:stop   # when finished
     ```

   Details live in [`docs/TUNNELING.md`](docs/TUNNELING.md).

## Repository layout

```
frontend/
  app|pages/        # Public marketing pages and dashboards per role
  components/       # Shared UI
  hooks/contexts/   # Client state
  api/              # OpenAPI-based client utilities

backend/
  salonbw-backend/
    src/            # NestJS modules, controllers, entities

packages/
  api/              # Generated OpenAPI types & helpers
  utils/            # Shared utilities (RBAC, etc.)
```

The legacy Laravel frontend has been removed; the repo now contains only the Next.js app for the UI and the NestJS backend API.

## Key documentation

- Operational status dashboard: [`docs/AGENT_STATUS.md`](docs/AGENT_STATUS.md)
- Operations runbook (deployments, restarts, CI): [`docs/AGENT_OPERATIONS.md`](docs/AGENT_OPERATIONS.md)
- CI/CD overview + secrets: [`docs/CI_CD.md`](docs/CI_CD.md)
- Deployment runbook for mydevil: [`docs/DEPLOYMENT_MYDEVIL.md`](docs/DEPLOYMENT_MYDEVIL.md)
- Release checklist: [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)

## Common scripts

```bash
pnpm lint                     # Workspace lint
pnpm typecheck                # TypeScript diagnostics
pnpm --filter frontend test   # Frontend unit tests (Jest)
pnpm --filter salonbw-backend test   # Backend unit tests
pnpm --filter frontend build  # Next.js production build (standalone)
pnpm --filter salonbw-backend build  # NestJS production build
pnpm tunnel:start|stop        # Manage SSH DB tunnel
```

Husky hooks ensure lint + typecheck run before commits.

## API & feature overview

- Public marketing pages: `/`, `/services`, `/gallery`, `/contact`.
- Auth (`/auth/login`, `/auth/register`) redirects to `/dashboard`.
- Dashboards vary per role (`client`, `employee`, `receptionist`, `admin`) with RBAC enforced via shared utilities.
- Contact form submits to the backend `/emails/send` endpoint which relays via the `kontakt@salon-bw.pl` mailbox.
- Backend health endpoint: `/healthz` (used by CI and deployment smoke tests).

Swagger is exposed in development at `/api/docs`. Disable or protect it in production.

## Deployment

Production deploys use GitHub Actions `deploy_*` workflows with standalone builds and Passenger. Manual instructions and infrastructure quirks (e.g. non-node domains require touching `tmp/restart.txt`) are documented in [`docs/DEPLOYMENT_MYDEVIL.md`](docs/DEPLOYMENT_MYDEVIL.md).

Post-deploy checks:

```bash
curl -I https://api.salon-bw.pl/healthz
curl -s -X POST https://api.salon-bw.pl/emails/send ...
```

Current deployment history and known issues are tracked in [`docs/AGENT_STATUS.md`](docs/AGENT_STATUS.md).

## Contributing

Please read [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). Pull requests should:

- include passing CI (`ci.yml`)
- update documentation when behaviour changes
- note deployment implications (runbook updates, environment variables)

For any questions or to raise bugs, open an issue with as much context as possible (command output, `pnpm` version, environment).
MAX_LOG_AGE_DAYS=90 DATABASE_URL=postgres://user:pass@host/db \
  npx ts-node -p pg scripts/prune-audit-logs.ts
```

Schedule this command via cron to keep the table size manageable.

## Instagram integration

The backend fetches the latest posts from Instagram for the gallery page.
Set a long‑lived token in `backend/.env`:

```bash
INSTAGRAM_ACCESS_TOKEN=your-instagram-token
```

Remember to refresh this token periodically so the gallery keeps working.
