# Definition of Done

## Before commit (mandatory)
- [ ] Lint passes (no errors, warnings reviewed)
- [ ] TypeScript typecheck passes (`--noEmit`)
- [ ] Manual smoke test of changed functionality
- [ ] No secrets/credentials in code or config

## Before deploy
- [ ] Pre-commit checklist complete
- [ ] PR merged to master
- [ ] API deployed first if backend changed
- [ ] Frontends deployed after API

## After deploy (production verification)
- [ ] `curl https://api.salon-bw.pl/healthz` → 200
- [ ] Panel loads: https://panel.salon-bw.pl
- [ ] Login flow tested (if auth-related)
- [ ] Browser console: no new errors

## For Versum-clone work
- [ ] `docs/VERSUM_CLONING_STANDARD.md` followed
- [ ] Copy-first (markup/css/assets/flow) → integration adapters → parity validation
- [ ] No module marked "100%" with stubbed/TODO actions
