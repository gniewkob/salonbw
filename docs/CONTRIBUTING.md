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
   - Frontend: `npm run lint`, `npm run format`.
   - Backend: `npm run lint`, `npm run format`.
2. Execute the relevant test suites:
   - Frontend unit tests: `npm test`.
   - Backend tests: `npm run test`.
   - Cypress E2E (optional pre-merge): `npm run e2e`.
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
