# Contributing Guide

## Prerequisites

- Install Node.js via `nvm` (projects currently target Node 20; future migration to Node 22 is planned).
- Use npm within each application directory (`apps/landing/`, `apps/panel/`, `backend/salonbw-backend/`) until a root workspace is introduced.
- Copy the relevant `.env.example` files and adjust secrets locally (never commit secrets).

## Branching & Commit Style

- Create feature branches from `main` using a descriptive name (e.g. `feature/dashboard-metrics`).
- Follow Conventional Commits (`type(scope): message`) to keep history and changelogs clean.
- Rebase before opening a pull request when possible to minimise merge conflicts.

## Quality Gates

1. Run linting and formatting in the directory you touched:
   - Landing (public): `pnpm --filter @salonbw/landing run lint`, `pnpm --filter @salonbw/landing run format`.
   - Panel (dashboard): `pnpm --filter @salonbw/panel run lint`, `pnpm --filter @salonbw/panel run format`.
   - Backend: `pnpm --filter salonbw-backend run lint`, `pnpm --filter salonbw-backend run format`.
2. Execute the relevant test suites:
   - Landing unit tests: `pnpm --filter @salonbw/landing test`.
   - Panel unit tests: `pnpm --filter @salonbw/panel test`.
   - Backend tests: `pnpm --filter salonbw-backend test`.
   - Cypress E2E (optional pre-merge): `pnpm --filter @salonbw/landing run e2e` or `pnpm --filter @salonbw/panel run e2e`.
   - Cypress component tests: clear `ELECTRON_RUN_AS_NODE` (`ELECTRON_RUN_AS_NODE= pnpm --filter @salonbw/panel exec cypress run --component`) and wrap rendered pages with the providers they expect (e.g. `<AuthProvider>` for panel screens) to avoid runtime hook errors.
   - Bundle budget (panel): `pnpm --filter @salonbw/panel run bundle:check` (mirrors the CI guard); keep `/dashboard/*` first-load JS < 300 kB.
   - Dockerised Cypress against the hosted backend (ensures headless Chrome parity):
     ```
     API_PROXY_URL=https://backend.salon-bw.pl \
     pnpm dlx start-server-and-test \
       "pnpm --filter @salonbw/panel run start:standalone" \
       http://localhost:3000 \
       "docker run --rm \
          -e CYPRESS_baseUrl=http://host.docker.internal:3000 \
          -v $PWD/apps/panel:/e2e -w /e2e \
          cypress/included:15.5.0 --browser chrome --headless"
     ```
3. Ensure CI passes before requesting review.

## Frontend Performance Playbook

- Run `pnpm --filter @salonbw/panel run analyze` after touching panel dashboard or appointments routes and review the generated reports in `.next/analyze`.
- Use `next/dynamic` with loading states for panel-only forms, modals, or components that pull in heavy dependencies (schema libraries, `@radix-ui/*`, `FullCalendar`, etc.).
- Keep the monitored panel routes under ~160 kB first-load JS locally; if a route regresses, add lazy loading or split code by role before opening a PR.
- Ensure `pnpm --filter @salonbw/panel run bundle:check` passes before pushing; this guard blocks CI when monitored routes exceed the 300 kB ceiling.

## Pull Request Checklist

- Provide context for the change and link to any issues/tasks.
- List manual verification steps (screenshots for UI changes are helpful).
- Highlight migrations or deployment considerations explicitly.
- Request review from at least one teammate familiar with the affected area.

## Code Style & Tooling

- ESLint and Prettier configs live within each project; do not override them without team consensus.
- Tailwind and shared component patterns should be followed for UI work.
- For backend changes, prefer dependency injection and modules consistent with existing NestJS patterns.

### TypeScript Standards

- **Backend**: Strict TypeScript mode is enabled (`noImplicitAny`, `strictNullChecks`, `strictBindCallApply`)
- **Never use `any`** - use proper types, `unknown`, or create interfaces
- Use TypeScript path aliases (`@/...`) consistently
- All new code must pass `pnpm typecheck` without warnings
- Pre-commit hooks will prevent commits with type errors

## Security & Secrets

- Do not commit `.env*` files with secrets or production credentials.
- Rotate tokens if a leak is suspected and document procedures in the security guide.
- Use the SSH tunnel workflow (introduced in later plans) for accessing remote databases during development.

### Dependency Management

- Dependabot opens weekly update PRs for GitHub Actions, the workspace root, `apps/landing/`, `apps/panel/`, and `backend/salonbw-backend/`. Assign an owner immediately and merge non-breaking upgrades within 7 days.
- The CI “Security Audit” job runs `pnpm audit --prod --audit-level=high` and blocks merges on high/critical vulnerabilities. Investigate failing runs before merging any branch.
- Schedule quarterly sweeps (first Monday of January, April, July, October):
  - `pnpm outdated`
  - `pnpm --filter @salonbw/landing dlx depcheck`
  - `pnpm --filter @salonbw/panel dlx depcheck`
  - `pnpm --filter salonbw-backend dlx depcheck`
- For disclosed security issues fix and deploy within 7 days; document the outcome in `docs/AGENT_STATUS.md`.
