# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Important: Git Sync Check

**ALWAYS check if working directory is synced with GitHub before starting any work:**

```bash
# Check current status and remote changes
git fetch origin
git status

# If behind remote, pull latest changes
git pull origin master
```

This ensures you're working with the most recent code and prevents conflicts.

## Repository Overview

Salon Black & White is a full-stack TypeScript monorepo for a salon management system. The stack consists of:

- **Frontend**: Two Next.js 14 apps (`@salonbw/landing` and `@salonbw/panel`) serving public pages and role-based dashboards (client, employee, receptionist, admin)
- **Backend**: NestJS API (`salonbw-backend`) with PostgreSQL, authentication, appointments, POS, and real-time chat via WebSocket
- **Packages**: Shared OpenAPI client (`@salonbw/api`) and utilities (RBAC)

## Development Setup

### Prerequisites
- Node.js 22 (run `nvm use` or install from `.nvmrc`)
- pnpm ≥ 10 (specified in `package.json`: `pnpm@10.14.0`)
- PostgreSQL (local or via SSH tunnel to production mydevil host)

### Installation
```bash
pnpm install
```

### Running Locally
Start backend and frontend in separate terminals:

```bash
# Terminal 1 – Backend (listens on port 3001)
pnpm --filter salonbw-backend start:dev

# Terminal 2 – Landing frontend (port 3000)
pnpm --filter @salonbw/landing dev

# Terminal 3 – Panel frontend (port 3000 or auto-selected)
pnpm --filter @salonbw/panel dev
```

Both frontends use smart port detection scripts (`scripts/start-dev-server.js`) that automatically find available ports starting at 3000.

### Database Tunnel
To connect to the production PostgreSQL database during development:

1. Copy `.env.development.local.example` to `.env.development.local` and configure mydevil credentials
2. Start tunnel: `pnpm tunnel:start`
3. Backend will connect to `localhost:8543` (forwarded to `pgsql0.mydevil.net:5432`)
4. Stop tunnel: `pnpm tunnel:stop`

See `docs/TUNNELING.md` for details.

## Common Commands

### Linting & Type Checking
```bash
# Entire workspace
pnpm lint
pnpm typecheck

# Specific package
pnpm --filter @salonbw/landing lint
pnpm --filter @salonbw/panel typecheck
pnpm --filter salonbw-backend lint
```

### Testing
```bash
# Frontend unit tests (Jest)
pnpm --filter @salonbw/landing test
pnpm --filter @salonbw/panel test

# Backend unit tests
pnpm --filter salonbw-backend test
pnpm --filter salonbw-backend test:watch
pnpm --filter salonbw-backend test:cov

# E2E tests (Cypress)
pnpm --filter @salonbw/landing e2e          # Full E2E with backend
pnpm --filter @salonbw/landing e2e:chrome   # Chrome-specific
pnpm --filter @salonbw/panel e2e:chrome:split  # Split mode (server already running)
```

### Building
```bash
# Production builds
pnpm --filter @salonbw/landing build
pnpm --filter @salonbw/panel build
pnpm --filter salonbw-backend build

# Analyze bundle size
pnpm --filter @salonbw/landing analyze
pnpm --filter @salonbw/panel analyze

# Bundle size enforcement (CI guard)
pnpm --filter @salonbw/panel bundle:check  # Fails if monitored routes exceed 330 KB first-load JS
```

### Backend-Specific
```bash
# Run single test file
pnpm --filter salonbw-backend test -- <test-file-name>

# Database migrations
pnpm --filter salonbw-backend run db:migrate

# Generate Swagger spec
pnpm --filter salonbw-backend run swagger:generate
```

## Architecture

### Monorepo Structure
```
apps/
  landing/          # Public marketing site (@salonbw/landing)
    src/
      pages/        # Next.js pages (public routes)
      components/   # Shared UI components
      api/          # OpenAPI client wrappers
      hooks/        # React hooks
      contexts/     # React contexts (Auth, etc.)
  panel/            # Dashboard/panel app (@salonbw/panel)
    src/
      pages/        # Role-based dashboards (client, employee, receptionist, admin)
      components/   # Shared UI components
      api/          # OpenAPI client wrappers
      middleware.ts # Auth & role-based route protection

backend/
  salonbw-backend/
    src/
      appointments/  # Appointment booking & management
      auth/          # JWT-based authentication, guards, roles
      chat/          # WebSocket real-time chat module
      commissions/   # Employee commission tracking
      emails/        # Transactional email (Nodemailer + SMTP)
      logs/          # Client/server logging, Loki integration
      observability/ # Prometheus metrics, Sentry APM
      retail/        # POS (sales, inventory)
      users/         # User management, roles (client, employee, receptionist, admin)
      health.controller.ts  # Health checks (DB, Instagram token)
      main.ts        # NestJS bootstrap (CORS, cookies, Swagger)

packages/
  api/              # Generated OpenAPI types & helpers (@salonbw/api)
  rand-token/       # Custom token utility
```

### Key Backend Modules
- **Auth**: Passport JWT strategy with refresh tokens, role-based guards (`RolesGuard`), HTTP-only cookies for secure sessions
- **Appointments**: Full CRUD, calendar integration, status management (pending/confirmed/completed/cancelled), WhatsApp reminders
- **Chat**: WebSocket gateway for real-time messaging (Socket.IO), Redis adapter for multi-instance support
- **POS**: Sales recording, inventory adjustments, employee commissions (enabled via `POS_ENABLED=true`)
- **Observability**: Prometheus metrics at `/metrics`, Pino logger with Loki transport, Sentry instrumentation
- **Email**: Nodemailer integration for contact forms and notifications, `/emails/send` endpoint

### Frontend Architecture
- **Landing** (`apps/landing`): Public pages (`/`, `/services`, `/gallery`, `/contact`), marketing content, contact form submission
- **Panel** (`apps/panel`): Protected dashboards per role:
  - **Client**: View/book appointments, view profile
  - **Employee**: Manage appointments, record commissions, chat
  - **Receptionist**: Manage clients, appointments, scheduling
  - **Admin**: Full CRUD for users/services/products, POS, scheduler, analytics
- **API Client**: Generated from OpenAPI spec (`packages/api`), consumed via `@tanstack/react-query`
- **Auth Flow**: `/auth/login` and `/auth/register` redirect to `/dashboard` on success; middleware enforces role-based access
- **Shared**: Both apps use Tailwind CSS, FullCalendar for scheduling, Sentry for error tracking

### Deployment
Production hosted on mydevil.net (FreeBSD, Passenger) with separate deployments for:
- **API**: `api.salon-bw.pl` (Node.js app, restart via `devil www restart`)
- **Public**: `salon-bw.pl` (Next.js standalone via Passenger)
- **Panel/Dashboard**: `panel.salon-bw.pl` (Next.js standalone via Passenger)
- **Admin**: `admin.salon-bw.pl` (Next.js standalone via Passenger)

Deployment is automated via GitHub Actions (`.github/workflows/deploy.yml`). Manual deployment instructions are in `docs/DEPLOYMENT_MYDEVIL.md`.

### Database
PostgreSQL managed via TypeORM entities. Migrations live in `backend/salonbw-backend/src/migrations/`. Key tables:
- `users` (roles, bcrypt-hashed passwords)
- `appointments` (services, employees, clients, status)
- `services`, `products` (catalog)
- `sales`, `sale_items` (POS)
- `commissions` (employee earnings)
- `chat_messages` (real-time messaging)

## Environment Variables

Critical environment variables (see `docs/ENV.md` for comprehensive list):

### Backend (`backend/salonbw-backend/.env`)
- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: Comma-separated allowed CORS origins (production requires explicit list)
- `COOKIE_DOMAIN`: Domain for auth cookies (`.salon-bw.pl` in production)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Signing secrets for tokens
- `ENABLE_SWAGGER`: Set `false` in production (default); `true` exposes `/api/docs`
- `POS_ENABLED`: Enables POS endpoints (`true` in production since 2025-11-01)
- `SMTP_*`: Email configuration (host, port, user, password)
- `SENTRY_DSN`, `LOKI_URL`: Observability integrations
- `CLIENT_LOG_TOKEN`: Shared secret for client-side log forwarding

### Frontend (`.env.local` in `apps/landing` and `apps/panel`)
- `NEXT_PUBLIC_API_URL`: Backend URL (e.g., `http://localhost:3001` or `https://api.salon-bw.pl`)
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry error tracking
- `NEXT_PUBLIC_LOG_TOKEN`: Must match backend `CLIENT_LOG_TOKEN` for log forwarding
- `NEXT_PUBLIC_ENABLE_DEBUG`: Enables debug mode with `X-Request-Id` header correlation
- `INSTAGRAM_ACCESS_TOKEN`: Server-side Instagram token for gallery page

Copy `.env.example` files and adjust locally. Never commit `.env*` files with real secrets.

## CI/CD

### Workflows
- **`ci.yml`**: Runs on push/PR to `main`/`master`. Executes lint, typecheck, test, and build for frontend matrix (public, dashboard, admin) and backend. Enforces 330 KB bundle budget for dashboard routes.
- **`e2e.yml`**: Full E2E with backend + SSH tunnel (manual or on push to `main`)
- **`e2e-frontend-chrome.yml`**: Chrome E2E without backend (PR validation)
- **`deploy.yml`**: Deploys to mydevil via rsync/SSH with automated smoke tests

### Deployment Process (via GitHub Actions)
```bash
# API (deploy first)
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=api

# Frontends (deploy after API)
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=public
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=dashboard
gh workflow run .github/workflows/deploy.yml -r master -F ref=master -F target=admin
```

After deployment:
- Restart each domain via Devil CLI: `devil www restart <domain>` (automated in workflow)
- If Devil reports an invalid domain type, touch `tmp/restart.txt` inside the domain root.
- Verify: `curl -I https://api.salon-bw.pl/healthz`

See `docs/AGENT_OPERATIONS.md` for complete runbook.

## Code Quality

### Pre-commit Hooks
Husky enforces lint and typecheck before commits. Lint-staged auto-fixes on staged files.

### TypeScript Standards
- Strict mode enabled (`noImplicitAny`, `strictNullChecks`)
- Never use `any`; prefer proper types, `unknown`, or interfaces
- All code must pass `pnpm typecheck` without warnings

### Frontend Performance
- Bundle budget: Dashboard routes must stay under 330 KB first-load JS (CI enforced)
- Use `next/dynamic` for heavy components (FullCalendar, Radix UI)
- Run `pnpm --filter <app> analyze` after touching dashboard/appointment routes
- Check with `pnpm --filter @salonbw/panel bundle:check` before pushing

### Security
- Dependabot runs weekly for updates
- CI blocks merges on high/critical `pnpm audit` vulnerabilities
- Rotate JWT secrets if leakage suspected
- Never commit `.env*` files

## Testing Strategy

### Unit Tests
- Frontend: Jest + React Testing Library
- Backend: Jest with NestJS testing utilities
- Run frequently during development

### E2E Tests
- Cypress (headless Chrome or Electron)
- Full E2E requires backend + SSH tunnel to production DB
- Frontend-only E2E can run with mocked API
- CI runs E2E on push to `main`

### Component Tests
- Cypress component tests available (wrap with required providers like `<AuthProvider>`)
- Clear `ELECTRON_RUN_AS_NODE` before running: `ELECTRON_RUN_AS_NODE= pnpm exec cypress run --component`

## Observability

### Logging
- **Backend**: Pino logger with Loki transport (configured via `LOKI_URL` and `LOKI_BASIC_AUTH`)
- **Frontend**: Client errors forwarded to backend `/logs/client` endpoint (requires `NEXT_PUBLIC_LOG_TOKEN`)
- **Correlation**: `X-Request-Id` header links frontend requests to backend logs and Sentry traces

### Metrics
- Prometheus metrics exposed at `https://api.salon-bw.pl/metrics`
- Includes HTTP request counts, durations, email send status, appointment creation
- Example: `salonbw_http_server_requests_total`, `salonbw_emails_sent_total`

### APM
- Sentry instrumentation for backend (traces, profiles, slow request alerts)
- Sentry browser SDK for frontend (Web Vitals, session replays, error tracking)
- Slow requests (>1000ms) create Sentry issues with `request_id` tag for log correlation

### Uptime Monitoring
- UptimeRobot monitors `/healthz` endpoints and public pages (60s intervals, US-East + EU-West)
- Alerts via Slack `#ops-alerts` and SMS on-call list
- See `docs/AGENT_OPERATIONS.md` for incident response template

## Documentation

- `docs/AGENT_OPERATIONS.md`: Operations runbook (deployments, restarts, observability)
- `docs/CI_CD.md`: CI/CD workflows, secrets, local verification
- `docs/DEPLOYMENT_MYDEVIL.md`: Manual deployment steps for mydevil hosting
- `docs/ENV.md`: Comprehensive environment variable reference
- `docs/TUNNELING.md`: SSH tunnel setup for remote DB access
- `docs/CONTRIBUTING.md`: Branching, commit style, quality gates
- `docs/RELEASE_CHECKLIST.md`: Pre-deployment checklist
- `docs/AGENT_STATUS.md`: Operational status, deployment history, known issues

## Common Patterns

### Adding a New Backend Module
1. Generate via NestJS CLI: `pnpm --filter salonbw-backend exec nest g module <name>`
2. Create DTOs with `class-validator` decorators
3. Use TypeORM entities with repository pattern
4. Add Swagger decorators (`@ApiTags`, `@ApiResponse`)
5. Write unit tests (`*.spec.ts`)

### Adding a New Frontend Page
1. Create page in `apps/landing/src/pages` (public) or `apps/panel/src/pages` (protected)
2. Use OpenAPI client from `@salonbw/api` with `@tanstack/react-query`
3. Wrap protected routes with role guards in `middleware.ts` (panel only)
4. Add Cypress E2E test if user-facing workflow
5. Run bundle check if adding to dashboard: `pnpm --filter @salonbw/panel bundle:check`

### Database Migration
1. Create migration: Backend changes auto-detected by TypeORM (or manual via CLI)
2. Migrations stored in `backend/salonbw-backend/src/migrations/`
3. Apply locally: `pnpm --filter salonbw-backend run db:migrate`
4. In production: SSH to mydevil and run `npx typeorm-ts-node-commonjs migration:run -d dist/ormconfig.js`

## Project-Specific Constraints

- **Hosting**: FreeBSD shared hosting (mydevil.net) with Passenger for Node.js apps
- **No `set -euo` in scripts**: Breaks SSH connections on mydevil (use alternative error handling)
- **Passenger Restart**: Touch `tmp/restart.txt` or use `devil www restart <domain>`
- **Node Version**: Mydevil runs Node 18; local dev uses Node 22; CI uses Node 22
- **Port Detection**: Frontends automatically detect available ports starting at 3000 to avoid conflicts

## Additional Notes

- Instagram integration: Backend fetches posts for gallery page (requires `INSTAGRAM_ACCESS_TOKEN`)
- WhatsApp reminders: Optional appointment reminders via WhatsApp Cloud API (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`)
- Multi-role dashboards: Single panel app serves different UIs based on user role (client/employee/receptionist/admin)
- Standalone builds: Next.js apps use `output: 'standalone'` for minimal production bundles
- Image optimization: Enabled in production; disable with `NEXT_IMAGE_UNOPTIMIZED=true` if host blocks proxy

## Getting Help

- Check `docs/` directory for detailed guides
- Review existing tests and modules for patterns
- Open issues with context (command output, pnpm version, environment)
- For deployment issues, consult `docs/AGENT_STATUS.md` for known issues and recent changes
