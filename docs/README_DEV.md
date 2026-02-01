# Developer Quickstart

This guide helps new contributors get a working environment in less than 15 minutes. For deep dives, follow the links to the detailed docs already in the repo.

## 1. Clone & prerequisites

1. Install the tooling listed in [`docs/DEV_SETUP_MAC.md`](./DEV_SETUP_MAC.md) (Homebrew, `nvm`, `pnpm`, SSH keys).
2. Clone the repository and install dependencies:

    ```bash
    git clone git@github.com:gniewkob/salonbw.git
    cd salonbw
    pnpm install
    ```

The workspace contains four projects:

```
apps/landing/           # Next.js public site (dev)
apps/panel/             # Next.js dashboard (panel)
backend/salonbw-backend # NestJS API
packages/api/           # Shared OpenAPI client + types
```

## 2. Environment variables

Copy the sample files and set local values. Reference [`docs/ENV.md`](./ENV.md) for the complete variable list.

```bash
cp apps/landing/.env.local.example apps/landing/.env.local
cp apps/panel/.env.local.example apps/panel/.env.local
cp backend/salonbw-backend/.env.example backend/salonbw-backend/.env
cp .env.development.local.example .env.development.local   # optional, for DB tunnel defaults
```

When working with the production database through SSH, fill in the `MYDEVIL_*` values in `.env.development.local` and use the tunnel scripts (see below).

## 3. Start the stack

### Without remote DB access

```bash
# Terminal 1 – backend
pnpm --filter salonbw-backend start:dev

# Terminal 2 – landing (public site)
pnpm --filter @salonbw/landing dev

# Terminal 3 – panel (dashboard)
pnpm --filter @salonbw/panel dev
```

Visit the URLs printed by the dev servers (landing typically 3000, panel on the next free port). Both apps proxy requests to the backend via `NEXT_PUBLIC_API_URL`.

### With mydevil database tunnel

1. Configure the values in `.env.development.local` (host, user, credentials).
2. Run:

    ```bash
    pnpm tunnel:start
    pnpm --filter salonbw-backend start:dev
    ```

3. When done, stop the tunnel with `pnpm tunnel:stop`.

Detailed instructions and troubleshooting live in [`docs/TUNNELING.md`](./TUNNELING.md).

## 4. Shared tools

| Task                      | Command / Reference                                 |
| ------------------------- | --------------------------------------------------- |
| Lint whole repo           | `pnpm lint` (uses workspace-aware scripts)         |
| Type check                | `pnpm typecheck`                                   |
| Landing tests             | `pnpm --filter @salonbw/landing test`              |
| Panel tests               | `pnpm --filter @salonbw/panel test`                |
| Backend tests             | `pnpm --filter salonbw-backend test`               |
| OpenAPI client generation| `pnpm --filter @salonbw/api gen:api`               |
| CI/CD overview           | [`docs/CI_CD.md`](./CI_CD.md)                      |
| Security headers         | [`docs/SECURITY_HEADERS.md`](./SECURITY_HEADERS.md)|
| Operational status       | [`docs/AGENT_STATUS.md`](./AGENT_STATUS.md)        |
| Deployment runbook       | [`docs/AGENT_OPERATIONS.md`](./AGENT_OPERATIONS.md)|

Before pushing, run at least:

```bash
pnpm lint
pnpm --filter @salonbw/landing test
pnpm --filter @salonbw/panel test
pnpm --filter salonbw-backend test
```

## 5. Learning the architecture

- [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) – current system layout.
- [`docs/API_CLIENT.md`](./API_CLIENT.md) – how the shared OpenAPI client works.
- [`docs/CI_CD.md`](./CI_CD.md) – GitHub Actions, secrets, deployment templates.

For any questions, drop them in the project issue tracker or attach notes to upcoming runbook prompts in `plan.md`.
