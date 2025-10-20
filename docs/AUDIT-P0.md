# Audit P0 – Baseline Report

Generated: 2025-03-09 (last refreshed 2025-03-09)

## Scope

- Capture the current state of the Salon Black & White monorepo before applying further automation from `plan.md`.
- Document existing tooling, configs, and observed gaps without changing runtime behaviour.

## Repository Layout & Frameworks

- `frontend/` – Next.js 14 application (React 18, Tailwind, Jest, Cypress).
- `backend/salonbw-backend/` – NestJS 11 API server (TypeORM, Jest).
- Root `package.json` with a pnpm workspace (`pnpm-workspace.yaml`) orchestrates all packages (`frontend`, `backend/salonbw-backend`, `packages/*`).

## Tooling & Package Management

- Primary package manager: **pnpm 10.14.0** (see root `package.json` and `.npmrc`).
- Each workspace retains `package-lock.json` for compatibility, but development scripts rely on pnpm (`pnpm install`, `pnpm lint`, etc.).
- Running `pnpm install` succeeds; when `NPM_TOKEN` is not exported locally, set `NPM_TOKEN=unused` to silence auth warnings from `.npmrc`.

## Node Versions

- Root `.nvmrc` pins **Node 22**; frontend `.nvmrc` still specifies Node 20. Backend relies on ambient Node version.
- Coordinate a Node upgrade across apps or update the runbook before toggling CI/tooling to Node 22 only.

## Configuration Baseline

- `.editorconfig`, `.gitattributes`, `.npmrc`, and `.nvmrc` live at the repo root.
- ESLint/Prettier configurations remain project-local; no root overrides needed at this stage.

## Documentation Added

- `docs/ARCHITECTURE.md` – current-state overview of frontend and backend systems.
- `docs/CONTRIBUTING.md` – contribution workflow, quality gates, and branching guidance.
- `docs/SECURITY.md` – secrets handling, dependency hygiene, and incident response policies.

## Outstanding Items & Risks

- Align Node 22 requirement with the existing Node 20 usage in the frontend before enforcing a hard upgrade.
- Ensure `NPM_TOKEN` guidance is communicated to developers and CI (set to a dummy value locally when private registry auth is not required).
- Keep this report updated as additional plan steps (P1–P11) land to avoid stale baseline notes.
