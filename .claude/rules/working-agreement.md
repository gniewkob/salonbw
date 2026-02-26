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

- Work in small steps ("small iterations"). Divide every major business goal into smaller, isolated tasks. Close each step with a merge to `master` (or main), ensuring the application builds correctly, to maintain high code quality.
- Working set: max 5 files at a time unless task requires more.
- Do not create extra files unless necessary.
- Do not add features/refactors beyond what was asked.

## Dependency upgrades (pnpm monorepo)

- When upgrading a workspace-wide dep (e.g. Next.js), update `pnpm.overrides` in root `package.json` to match.
  Evidence: "Root override `\"next\": \"14.2.32\"` blocked panel/landing upgrade to 15.5.10 despite workspace package.json declaring 15.5.10"
- After any `pnpm.overrides` change, clean-install before committing lockfile: `pnpm store prune && rm -rf node_modules && pnpm install`.
  Evidence: "Incremental pnpm install after override change resulted in CI pnpm virtual store corruption (`@next/env/dist/index.js` missing in CI)"
- If macOS `EPERM` on `node_modules/.modules.yaml` during pnpm install: `xattr -d com.apple.provenance node_modules/.modules.yaml`.
  Evidence: "pnpm.stdout showed `EPERM: operation not permitted, open '.../node_modules/.modules.yaml'`; fixed with `xattr -d com.apple.provenance`"

## Deployment

- API first, then frontends.
- Use GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Confirm before pushing/deploying to production.
- If `package.json` or `pnpm-lock.yaml` changes are pushed, CI marks `shared=true` and builds BOTH landing AND panel. If landing is known-broken, deploy panel-only via `gh workflow run ... -F target=dashboard`.
  Evidence: "Landing build failed CI run 22436249501; panel never deployed; fix was manual `gh workflow run ... -F target=dashboard`"
