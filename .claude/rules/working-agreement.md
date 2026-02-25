# Working Agreement

## General

- Read before edit. Never propose changes to code you haven't read.
- Diff-first: propose minimal changes; unified diffs or scoped edits.
- One clarifying question max if it prevents rework.
- No narrative, no restating plans, no rephrasing requests.
- Parallel file reads for audits — read all affected files simultaneously to reduce round-trips.
  Evidence: "Parallel file reads for audits — read all affected files simultaneously to reduce round-trips" — effective pattern

## Commit hygiene (mandatory pre-commit)

- Panel: `pnpm eslint src --fix && pnpm tsc --noEmit`
- Backend: `pnpm lint --fix && pnpm tsc --noEmit`
- Landing: `pnpm eslint src --fix && pnpm tsc --noEmit`
- NEVER commit if lint or typecheck fails.
- Run checks for ALL packages that have modified files.

## Codex commit audit

- Always audit Codex-generated commits before merging: verify lint + typecheck passed.
  Evidence: "commit 0e93a771 had lint errors (no-misused-promises, prettier) — Codex skipped checks"
- Deliver audit findings as table: `Problem | Naprawiony?`
  Evidence: "user engaged positively with tabular format for fix verification"
- If Codex commit has lint errors: fix locally, run pre-commit checks, commit fix separately.

## Scope

- Pracuj w małych krokach ("small iterations"). Każdy większy cel biznesowy dziel na mniejsze, odizolowane zadania. Zamykaj każdy krok mergem do `master` (lub main), upewniając się, że aplikacja buduje się poprawnie, w celu zachowania wysokiej jakości i czystości kodu.
- Working set: max 5 files at a time unless task requires more.
- Do not create extra files unless necessary.
- Do not add features/refactors beyond what was asked.

## Deployment

- API first, then frontends.
- Use GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Confirm before pushing/deploying to production.
