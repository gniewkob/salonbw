# Contributing Guide

## Prerequisites

- Install Node.js via `nvm` (projects currently target Node 20; future migration to Node 22 is planned).
- Use npm within each application directory (`frontend/`, `backend/salonbw-backend/`) until a root workspace is introduced.
- Copy the relevant `.env.example` files and adjust secrets locally (never commit secrets).

## Branching & Commit Style

- Create feature branches from `main` using a descriptive name (e.g. `feature/dashboard-metrics`).
- Follow Conventional Commits (`type(scope): message`) to keep history and changelogs clean.
- Rebase before opening a pull request when possible to minimise merge conflicts.

## Quality Gates

1. Run linting and formatting in the directory you touched:
   - Frontend: `pnpm --filter frontend run lint`, `pnpm --filter frontend run format`.
   - Backend: `pnpm --filter salonbw-backend run lint`, `pnpm --filter salonbw-backend run format`.
2. Execute the relevant test suites:
   - Frontend unit tests: `pnpm --filter frontend test`.
   - Backend tests: `pnpm --filter salonbw-backend test`.
   - Cypress E2E (optional pre-merge): `pnpm --filter frontend run e2e`.
   - Bundle budget: `pnpm --filter frontend run bundle:check` (mirrors the CI guard); keep `/dashboard/*` first-load JS < 300 kB.
3. Ensure CI passes before requesting review.

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

- **Security audits run automatically** on every PR via GitHub Actions
- High/critical vulnerabilities in production dependencies will fail CI
- Review Dependabot PRs within 7 days of creation
- For security patches, merge and deploy within 7 days of disclosure
- Run `pnpm audit` locally before committing new dependencies
- Use `pnpm outdated` quarterly to review available updates
- Periodically run `pnpm --filter frontend dlx depcheck` to prune unused packages; CI expects `axios`, `msw`, or other mocks only when actively used.
