# Architecture (Current State)

## Overview

- Monorepo with two primary applications:
  - `frontend/` – Next.js 14 web app for public marketing pages and authenticated dashboards.
  - `backend/salonbw-backend/` – NestJS 11 API server with TypeORM persistence.
- Each application is currently managed as an independent npm project (no top-level workspace tooling).
- PostgreSQL is the expected primary database; local development relies on `.env` configuration.

## Frontend (Next.js)

- Uses the file-based router under `src/pages` with role-specific dashboard routes.
- TailwindCSS powers styling; scripts in `frontend/scripts/` handle dev server orchestration and port management.
- Testing stack: Jest for unit tests, Cypress for E2E (mocked API responses).
- Builds target standard Next.js output (`next build`); production bootstrap handled by custom scripts.

## Backend (NestJS)

- Modular NestJS app exposing REST endpoints and WebSocket gateways.
- TypeORM manages entities and database migrations; configuration sourced from `.env`.
- Swagger (`swagger.ts`) generates `openapi.json` for API schema documentation.
- Jest powers unit/integration testing (`test/` directory).

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
