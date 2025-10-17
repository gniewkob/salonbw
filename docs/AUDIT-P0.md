# Audit P0 – Baseline Report

Generated: 2025-03-09

## Scope

- Capture the current state of the Salon Black & White monorepo before applying further automation from `plan.md`.
- Document existing tooling, configs, and observed gaps without changing runtime behaviour.

## Repository Layout & Frameworks

- `frontend/` – Next.js 14 application (React 18, Tailwind, Jest, Cypress).
- `backend/salonbw-backend/` – NestJS 11 API server (TypeORM, Jest).
- No top-level package.json or workspace manager; each application manages dependencies independently.

## Tooling & Package Management

- Primary package manager today is **npm** (both apps contain `package-lock.json`).
- `pnpm -v` → `10.14.0` (warning: `${NPM_TOKEN}` not defined when reading `.npmrc`; expected locally).
- `pnpm install` was **not executed** because the repository lacks a root `package.json`; migrating to pnpm would require additional setup.

## Node Versions

- New root `.nvmrc` pins **Node 22** per runbook guidance.
- Frontend `.nvmrc` still targets Node 20; backend relies on local environment. Team should plan a coordinated upgrade or adjust the runbook if Node 20 must remain.

## Configuration Baseline

- Root `.editorconfig` and `.gitattributes` already present; no changes required.
- Root `.npmrc` now enforces `strict-peer-dependencies=true` while preserving existing registry settings.
- ESLint/Prettier already configured inside each project; no additional root config introduced to avoid duplication.

## Documentation Added

- `docs/ARCHITECTURE.md` – current-state overview of frontend and backend systems.
- `docs/CONTRIBUTING.md` – contribution workflow, quality gates, and branching guidance.
- `docs/SECURITY.md` – secrets handling, dependency hygiene, and incident response policies.

## Outstanding Items & Risks

- Align Node 22 requirement with existing Node 20 runtime (verify compatibility before bumping engines).
- Consider introducing a root workspace/`pnpm` configuration to satisfy future automation goals.
- Update CI/automation references once subsequent plan stages (P1–P9) are implemented.
