# Working Agreement

## General
- Read before edit. Never propose changes to code you haven't read.
- Diff-first: propose minimal changes; unified diffs or scoped edits.
- One clarifying question max if it prevents rework.
- No narrative, no restating plans, no rephrasing requests.

## Commit hygiene (mandatory pre-commit)
- Panel: `pnpm eslint src --fix && pnpm tsc --noEmit`
- Backend: `pnpm lint --fix && pnpm tsc --noEmit`
- Landing: `pnpm eslint src --fix && pnpm tsc --noEmit`
- NEVER commit if lint or typecheck fails.

## Scope
- Working set: max 5 files at a time unless task requires more.
- Do not create extra files unless necessary.
- Do not add features/refactors beyond what was asked.

## Deployment
- API first, then frontends.
- Use GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Confirm before pushing/deploying to production.
