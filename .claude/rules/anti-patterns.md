# Anti-Patterns

## Code
- DON'T add features beyond what was asked.
- DON'T add error handling for impossible scenarios.
- DON'T create helpers/utils for one-time operations.
- DON'T use backwards-compat shims when you can just change the code.
- DON'T add docstrings/comments to unchanged code.
- DON'T engineer for hypothetical future requirements.
- DON'T mount shell/layout components per-page — put them in `_app.tsx` as persistent layout.
  Evidence: "VersumShell per-page architecture caused white screen on navigation — fundamental architectural debt"
- DON'T link tab/nav hrefs to redirect/intermediate pages — link directly to final destination.
  Evidence: "WarehouseLayout tab hrefs pointed to redirect pages (/sales, /use etc.) causing double-navigation white screen"
- DON'T call hooks after early returns (`if (!role) return null` etc.) — violates Rules of Hooks.
  Evidence: "useSetSecondaryNav hook placed after if (!role) return null early return → Rules of Hooks violation"

## Next.js / next.config.mjs
- DON'T return a flat array from `rewrites()` in next.config.mjs — always return `{beforeFiles, afterFiles, fallback}` object.
  Evidence: "Crash `routesManifest.rewrites.beforeFiles.filter(...)` — beforeFiles undefined when `return rules` (array) used; fixed to object format"
- DON'T upgrade workspace Next.js version without also updating `pnpm.overrides.next` in root package.json.
  Evidence: "Commit `d56d2c26` changed panel/landing `package.json` to `next@15.5.10` but root `pnpm.overrides` still `14.2.32`; CI `--frozen-lockfile` installed 14.2.32"
- DON'T run incremental `pnpm install` after a `pnpm.overrides` change that alters resolved versions — run clean install (`rm -rf node_modules && pnpm install`).
  Evidence: "CI pnpm virtual store corruption traced to incremental install; clean install produced correct result"
- DON'T run `pnpm store prune` for routine lockfile updates — it wipes the entire local cache (1700+ packages) and forces full re-download (~15 min). Only run when you have a confirmed store-corruption.
  Evidence: "pnpm store prune wiped 1733 packages; 15min install; user interrupted with 'za dlugo to trwa'"
- DON'T assume only one workspace package contains a dependency being removed — always `grep -r` across all apps/ before removing.
  Evidence: "`@suchipi/cypress-plugin-snapshots` was in both landing AND panel; only caught in second audit round — 'apps__panel>@suchipi/cypress-plugin-snapshots still in audit output'"
- DON'T diagnose `MODULE_NOT_FOUND` in next build by checking pnpm virtual store before reading all `prebuild`/`preinstall` scripts in the affected package — prebuild hooks can delete/replace node_modules entries after install.
  Evidence: "7+ CI runs checking pnpm virtual store (all confirmed present) while actual cause was in the `prebuild` hook; root cause found only after reading ensure-local-deps.js"
- DON'T trust `stat`/`realpath`/`ls` confirming a file exists as proof that `require()` will succeed — hooks run between install and build and can delete the file.
  Evidence: "`stat` confirmed dist/index.js existed before CI build; prebuild (ensure-local-deps.js) deleted it during the build step"
- DON'T use `node -e "require('node_modules/.pnpm/...')"` with a relative path — Node.js treats it as a module name, not a file path, always returning MODULE_NOT_FOUND. Use `require(path.resolve('node_modules/.pnpm/...'))`.
  Evidence: "Diagnostic node test with relative path → always MODULE_NOT_FOUND red herring; correct form uses path.resolve"
- DON'T upgrade a dep that has a vendor copy in `apps/*/vendor/` without updating that vendor's `package.json` version AND `dist/` contents to match.
  Evidence: "vendor @next/env@14.2.32 without dist/ caused ensure-local-deps.js to delete+replace pnpm store entry on every build; fix was updating vendor to 15.5.10 with proper dist/ (commit e74331ee)"

## Process

- DON'T commit with failing lint or typecheck.
- DON'T skip pre-commit checks "to save time".
- DON'T accept Codex commits without verifying lint — Codex (reasoning_effort=low) is known to skip checks.
  Evidence: "commit 0e93a771 had lint errors (no-misused-promises, prettier) — Codex skipped checks"
- DON'T deploy frontends before API when backend changed.
- DON'T use `devil www options <domain> nodejs_version` on this host (unsupported).
- DON'T retry a tool call that was explicitly denied; adjust approach instead.
- DON'T use background shell scripts to monitor git changes on macOS — die when parent process exits; use polling instead.
  Evidence: "Background monitoring shell scripts for git changes — die on macOS when parent process exits"
- DON'T diagnose Next.js runtime crashes without first checking `pnpm.overrides` in root package.json for version pins.
  Evidence: "Multiple previous failing runs (22418435919, 22419261772) before root cause was found in overrides"
- DON'T assess landing CI status from git log alone — verify from BOTH CI run results AND active-context.md landing line.
  Evidence: "Initial doc update incorrectly stated 'landing CI broken' — active-context.md was corrected by retro-auditor to reflect actual state (landing DEPLOYED at e74331ee)"
- DON'T update AGENT_STATUS.md or documentation with assumed-current values — always cross-verify against git log + source files first.
  Evidence: "AGENT_STATUS.md 'Current Release' table was 2 days stale (showed `9ec696ac` 2026-02-24 while actual panel was `0a1fde5f` 2026-02-26)"
- DON'T guess Versum module completion % — read VersumSecondaryNav.tsx to confirm which nav components are registered for each module key.
  Evidence: "Moduł Usługi % was 30% in docs despite ServicesNav + copy-first details view already done; should have been ~70%"

## Context & responses
- DON'T paste whole files in responses.
- DON'T restate the plan after being asked to execute.
- DON'T hallucinate rules without Evidence or Assumption tag.
- DON'T brute-force when blocked; find root cause or ask.

## Security
- DON'T commit secrets, tokens, API keys.
- DON'T log sensitive data (PII, credentials, session tokens).
- DON'T introduce command injection, XSS, SQLi, or OWASP top-10 vulns.
- DON'T push to main/master without user confirmation.
