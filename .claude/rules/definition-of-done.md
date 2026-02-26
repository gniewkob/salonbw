# Definition of Done

## Before commit (mandatory)
- [ ] Lint passes (no errors, warnings reviewed)
- [ ] TypeScript typecheck passes (`--noEmit`)
- [ ] Manual smoke test of changed functionality
- [ ] No secrets/credentials in code or config
- [ ] If accepting a Codex commit: verify lint + typecheck were run (don't assume)
  Evidence: "commit 0e93a771 had lint errors (no-misused-promises, prettier) — Codex skipped checks"

## Before deploy
- [ ] Pre-commit checklist complete
- [ ] PR merged to master
- [ ] API deployed first if backend changed
- [ ] Frontends deployed after API
- [ ] If `package.json` or `pnpm-lock.yaml` changed: verify root `pnpm.overrides` matches workspace versions
  Evidence: "Root override `\"next\": \"14.2.32\"` blocked panel/landing upgrade to 15.5.10 despite workspace package.json declaring 15.5.10"
- [ ] If `pnpm.overrides` changed: lockfile committed after `pnpm store prune && rm -rf node_modules && pnpm install` (not incremental)
  Evidence: "Incremental pnpm install after override change resulted in CI pnpm virtual store corruption"

## After deploy (production verification)
- [ ] `curl https://api.salon-bw.pl/healthz` → 200
- [ ] Panel loads: https://panel.salon-bw.pl
- [ ] Login flow tested (if auth-related)
- [ ] Browser console: no new errors
- [ ] Navigate through affected panel modules (no white screen on navigation)
  Assumption (confidence: high). Verify: smoke test all WarehouseLayout sub-tabs and /settings, /extension after persistent shell deploy.

## For Versum-clone work
- [ ] `docs/VERSUM_CLONING_STANDARD.md` followed
- [ ] Copy-first (markup/css/assets/flow) → integration adapters → parity validation
- [ ] No module marked "100%" with stubbed/TODO actions

## For VersumShell / layout changes
- [ ] Shell components placed in `_app.tsx` (persistent), not per-page
- [ ] Tab/nav hrefs point to final destination, not intermediate redirect pages
- [ ] All hooks called before any early return (`if (!role) return null`)
- [ ] `/calendar` excluded from persistent shell scope
