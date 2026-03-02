# Working Agreement

## General

- Read before edit. Never propose changes to code you haven't read.
- Diff-first: propose minimal changes; unified diffs or scoped edits.
- One clarifying question max if it prevents rework.
- No narrative, no restating plans, no rephrasing requests.
- Parallel file reads for audits — read all affected files simultaneously to reduce round-trips.
  Evidence: "Parallel file reads for audits — read all affected files simultaneously to reduce round-trips" — effective pattern
- For Versum clone status checks: read git log + VersumSecondaryNav.tsx simultaneously — git log alone misses which navs are actually wired up.
  Evidence: "Read git log + VersumSecondaryNav.tsx simultaneously to get full picture of what's integrated" — effective pattern 2026-02-26

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
- When any dep has a vendor copy in `apps/*/vendor/` (ensure-local-deps.js pattern): keep vendor `package.json` version AND `dist/` in sync with workspace dep version. Version mismatch triggers destructive pnpm store replacement at build time.
  Evidence: "vendor @next/env@14.2.32 without dist/ caused ensure-local-deps.js to delete+replace pnpm store entry on every build; fix: update vendor to 15.5.10 with proper dist/ (commit e74331ee)"

## MODULE_NOT_FOUND diagnosis (next build)

- Read `package.json` `prebuild`/`preinstall` scripts immediately when `next build` fails with MODULE_NOT_FOUND — before checking pnpm virtual store.
  Evidence: "Read `package.json` scripts (especially `prebuild`) early when diagnosing next build failures — effective pattern from 2026-02-26 session"
- `tryPackage` in Node.js MODULE_NOT_FOUND stack with `path: '.../package.json'` + `requestPath: 'package-name'` means: package.json was found but its `"main"` file is missing. Narrows cause to: (a) wrong `main` field, or (b) `main` file deleted after install.
  Evidence: "`tryPackage` error with `path: package.json, requestPath: @next/env` proved package.json found but dist/index.js missing; vendor package.json confirmed 14.2.32 without dist/"

## Deployment

- API first, then frontends.
- Use GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Confirm before pushing/deploying to production.
- If `package.json` or `pnpm-lock.yaml` changes are pushed, CI marks `shared=true` and builds BOTH landing AND panel. If landing is known-broken, deploy panel-only via `gh workflow run ... -F target=dashboard`.
  Evidence: "Landing build failed CI run 22436249501; panel never deployed; fix was manual `gh workflow run ... -F target=dashboard`"
