# Database SSH Tunnel Guide

This guide explains how to open a secure tunnel to the mydevil-hosted PostgreSQL instance used by Salon Black & White. The tunnel keeps production credentials off developer machines and ensures database access requires SSH authentication.

## Prerequisites

- SSH access to the mydevil account hosting the database.
- Required environment variables (see `.env.development.local.example` or `.env.test.local.example`):
  - `MYDEVIL_SSH_HOST`
  - `MYDEVIL_SSH_USER`
  - `MYDEVIL_PG_HOST`
  - `MYDEVIL_PG_PORT` (defaults to `5432`)
  - `DB_LOCAL_PORT` (defaults to `8543`)
  - `DATABASE_URL` pointing to `localhost:${DB_LOCAL_PORT}`

## Starting the Tunnel

```bash
export NPM_TOKEN=unused          # if needed to satisfy pnpm warnings
pnpm tunnel:start
```

Under the hood this runs `scripts/db-tunnel.sh`, which checks for the required environment variables and opens an SSH tunnel in the background. A PID file is stored in `${XDG_RUNTIME_DIR:-/tmp}/salonbw-db-tunnel.pid`.

Once the tunnel is up you can run the backend in development mode and it will connect to the remote database via `localhost:${DB_LOCAL_PORT}`:

```bash
cd backend/salonbw-backend
pnpm start:dev
```

## Stopping the Tunnel

```bash
pnpm tunnel:stop
```

This runs `scripts/db-tunnel-kill.sh`, which reads the PID file and terminates the background SSH process.

## Verifying Connectivity

1. Start the tunnel (`pnpm tunnel:start`).
2. Run a quick health check with `psql`:

    ```bash
    psql "$DATABASE_URL" -c "SELECT 1;"
    ```

    Expect `?column? | 1`.

3. The backend `/health` endpoint should also report `{"status":"ok"}`.

## Troubleshooting

- **Missing variables** – The scripts exit early if required environment variables are not exported. Copy the example `.env.*.example` files and source them or export the values in your shell.
- **Tunnel already running** – If the PID file exists but the process is gone, delete `${XDG_RUNTIME_DIR:-/tmp}/salonbw-db-tunnel.pid` and restart.
- **Port in use** – Adjust `DB_LOCAL_PORT` to a free port and update `DATABASE_URL` to match.
- **SSH key prompts** – Ensure your SSH key is loaded into the agent (`ssh-add -l`). The tunnel will respect your existing SSH config.

## CI Usage (Preview)

In future CI steps (see `plan.md` P5), the same scripts will be invoked to open a tunnel before running end-to-end tests. Keep credentials in repository secrets and reuse the script to avoid duplicating logic.
