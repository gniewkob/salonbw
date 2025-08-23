# Salon Black & White

[![CI](https://github.com/gniewkob/salonbw/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/gniewkob/salonbw/actions/workflows/test.yml)

Salon Black & White now consists of a
[NestJS](https://nestjs.com) backend in [`backend/`](backend/) and a
[Next.js](https://nextjs.org) frontend in [`frontend/`](frontend/).
To get each part running, follow
[`backend/README.md`](backend/README.md) for backend instructions and
[`frontend/README.md`](frontend/README.md) for the frontend.

## Frontend overview

The Next.js app offers several publicly accessible marketing pages:

- `/` – home page
- `/services` – list of available services fetched from the API
- `/gallery` – photo gallery populated from Instagram
- `/contact` – contact details and a simple form

Authentication is handled under `/auth` (`/auth/login` and `/auth/register`).
After signing in, users are redirected to `/dashboard` which renders different
sub‑pages depending on the user role:

- `client` – personal appointments and profile management
- `employee` – manage bookings and availability
- `admin` – administration tools for managing users and services

The old Laravel-based frontend has been archived in
[`archive/laravel-frontend`](archive/laravel-frontend) and is no longer
maintained.

## Project structure

```
frontend/
  src/
    api/          # fetch helpers for the REST API
    components/   # shared React components
    contexts/     # React context providers
    hooks/        # custom hooks wrapping API calls
    pages/        # Next.js page routes
    app/          # Next.js app router entrypoint
    styles/       # Tailwind and global CSS
```

The NestJS backend lives in `backend/` with typical controllers,
services and entities under `src/`.

## API documentation

In development, the API is documented with Swagger and available at `/api/docs`.
Make sure to secure or disable Swagger in production.

## Prerequisites

Install [Node.js](https://nodejs.org/) and npm. The project uses Node.js 20 (see
the [`.nvmrc`](./.nvmrc) file) so any recent 20.x release should work.

## Environment setup

- **Frontend** – copy `frontend/.env.local.example` to `frontend/.env.local` and set the base API URL:

    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:3001
    ```

    `NEXT_PUBLIC_API_URL` must point to the backend API used by the frontend.

- **Backend** – copy `backend/.env.example` to `backend/.env` and adjust the
  values for your local database, JWT secrets and other settings.

## Installing dependencies

Run `npm install` once in each project directory to install all required
packages:

```bash
cd frontend && npm install
cd ../backend && npm install
```

## Developing the frontend

The Next.js development server can be started with:

```bash
cd frontend
npm install    # only required once
npm run dev
```

You can also run it in one line:

```bash
cd frontend && npm run dev
```

Then open <http://localhost:3000> in your browser.

## Common npm scripts

Use these commands inside either `frontend/` or `backend/` as needed:

```bash
npm run dev       # start the development server
npm run lint      # check for linting issues
npm run format    # format the backend codebase (backend only)
npm run e2e       # run Cypress tests (requires xvfb)
```

## Running tests

Run unit tests inside either project with Jest and collect coverage:

```bash
npm test -- --coverage
```

End-to-end tests for the frontend use Cypress:

```bash
npm run e2e
```

## Build and deployment

To create a production build of the frontend and start it locally:

```bash
cd frontend
npm run build
npm start
```

Build the backend and run it in production mode:

```bash
cd backend
npm run build
npm run start:prod
```

## Linting and formatting

Use `npm run lint` to check the code and `npm run format` to apply Prettier. A
pre‑commit hook powered by Husky runs Prettier on staged files automatically.

## Log management

Application logs can grow quickly. To keep disk usage in check, archive or
remove log files older than a set number of days (30 by default). An example
script is available in [`scripts/archive-logs.ts`](scripts/archive-logs.ts) and
can be scheduled via cron:

```bash
0 0 * * * MAX_LOG_AGE_DAYS=30 LOG_DIR=/var/log/app \
  npx ts-node /path/to/repo/scripts/archive-logs.ts
```

The script moves old logs to `ARCHIVE_DIR` if provided, or deletes them when no
archive destination is configured.

Database audit entries stored in the `logs` table can also accumulate. Remove
rows older than your retention period with
[`scripts/prune-audit-logs.ts`](scripts/prune-audit-logs.ts):

```bash
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
