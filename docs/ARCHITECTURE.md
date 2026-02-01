# Architecture (Current State)

## Overview

- Monorepo with the following primary applications:
  - `apps/landing` – **public marketing site only** (`dev.salon-bw.pl`) for services, gallery, contact, CTA.
  - `apps/panel` – **Versum clone dashboard** (`panel.salon-bw.pl`) with all authenticated functionality.
  - `backend/salonbw-backend/` – NestJS 11 API server with TypeORM persistence.
  - `packages/api/` – OpenAPI TypeScript client wrapper shared by frontends.
- Development and deployments are managed via the pnpm workspace.
- PostgreSQL is the expected primary database; local development relies on `.env` configuration.

## Frontend (Next.js)

- Both `apps/landing` and `apps/panel` use the file-based router under `src/pages`.
- **Landing** serves only public pages; **panel** hosts all dashboard/Versum clone routes.
- TailwindCSS powers styling; scripts in `apps/*/scripts/` handle dev server orchestration and port management.
- Testing stack: Jest for unit tests, Cypress for E2E (mocked API responses).
- Builds target standard Next.js output (`next build`); production bootstrap handled by custom scripts.

## Backend (NestJS)

- Modular NestJS app exposing REST endpoints and WebSocket gateways.
- TypeORM manages entities and database migrations; configuration sourced from `.env`.
- Swagger (`swagger.ts`) generates `openapi.json` for API schema documentation.
- Jest powers unit/integration testing (`test/` directory).
- Redis-backed caching (optional) wraps slow-changing catalog queries (services, products). When `REDIS_URL` isn’t defined the cache falls back to an in-memory store with a configurable TTL (`CACHE_TTL_SECONDS`).
- PostgreSQL slow-query logging is enabled at startup (`DB_SLOW_QUERY_MS`), and connection pool metrics surface through the Prometheus `/metrics` endpoint.

## Cross-Cutting Concerns

- Authentication flows between frontend dashboards and backend JWT-based endpoints.
- Shared contracts currently rely on manual alignment; OpenAPI schema exists but no generated client yet.
- Logging and background jobs are not centrally documented; cron/timed tasks likely via `@nestjs/schedule`.

## Monetary Calculations

- Monetary values are normalised to integer cents in service logic to avoid floating-point drift.
- Database columns such as `services.price`, `products.unitPrice`, and `commissions.amount` still use decimals for compatibility, but service layers convert to cents before any arithmetic and only convert back when persisting or serialising responses.
- New calculations (e.g. POS sales, commission payouts) must follow the `toCents`/`fromCents` convention already used in `RetailService` and `CommissionsService`, with deterministic rounding (`Math.floor`) to keep cents consistent.

## Deployment & Operations

- No root CI/CD manifests; GitHub Actions exist only for prior workflows (see `.github/`).
- Production hosting targets MyDevil (per `plan.md` future steps) but automation is not yet codified.
- Root lacks unified Node toolchain management; sub-project `.nvmrc` pins Node 20.

## Notable Gaps Identified

- No root workspace or package manager orchestration (`pnpm`, `npm workspaces`, or `turbo`).
- Missing shared documentation under `docs/` prior to this baseline capture.
- Root `.nvmrc` absent; aligning Node 22 will require coordinated upgrade across apps.
