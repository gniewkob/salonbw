# WDI 2.0 — Hosted DEV Customers V18 UAT implementation plan

> **For agentic workers:** Execute scoped tests against the isolated DEV only; never merge the test runner to production without review.

**Goal:** Authenticated, automated, read-only browser UAT of the real `/studio-v18/customers` pilot using the existing DEV `uat` gateway and synthetic `stylist@salonbw.example.test` staff account.

**Architecture:** A separately scoped Playwright spec uses GitHub Actions staging secrets only in the final hosted test step. It authenticates against the real DEV panel, verifies a pinned deployed SHA and DEV API health, exercises real server-backed list/filter/sort UI and new-customer form state, and blocks browser-originated writes except the synthetic login. No customer content or credentials are uploaded in artifacts. A separate isolated branch avoids interfering with PR #1642.

**Tech Stack:** Next.js 15 panel, Playwright, TypeScript, GitHub Actions, Node.js 22, pnpm 10.14.0.

**Spec:** Existing `AGENTS.md`, `docs/HANDOFF_PROTOCOL.md`, `.claude/skills/salonbw-brand/SKILL.md`, `apps/panel/src/pages/studio-v18/customers.tsx`, existing `hosted-dev-gallery` UAT.

## Global constraints
- Only `dev-panel.salon-bw.pl` and `dev-api.salon-bw.pl`; exact release preflight and no redirects.
- Use existing `staging` secrets `DEV_ACCESS_USER`, `DEV_ACCESS_PASSWORD`, `E2E_ADMIN_PASSWORD`; never print them or embed them in code.
- Require expected gateway username `uat` and exact synthetic app identity `stylist@salonbw.example.test`, role `admin`, `isSystemAdmin=false`.
- No production requests, booking writes, customer mutations or modification of live user data. Only login POST is allowed.
- Read-only UAT does not establish full create/edit transactional parity. Synthetic-write E2E requires a separately scoped, recoverable test.
- No screenshots, videos, traces or HTML reports containing potentially real DEV data. No merge to master/production.
- Keep branch-specific workflow separate from the existing `hosted-dev-gallery` runner and existing DEV deployments.

## Review focus
1. **Incorrect release:** reject any panel build not exactly pinned to an approved immutable SHA.
2. **Auth leakage:** never follow cross-origin redirects with secrets or print request/response/customer data.
3. **Unintended writes:** fail closed on browser-side POST/PUT/PATCH/DELETE except synthetic login.
4. **Empty DEV database:** test search/sort/page controls without assuming a customer exists.
5. **Parallel deployments:** compare preflight release again after browser UAT; if changed, result is inconclusive/fail.

---

### Task 1: Read-only hosted browser spec
- [ ] Create `apps/panel/uat/hosted-dev-v18-customers.pw.ts`.
- [ ] Verify preflight rejects wrong origins/identity/credentials, production and release mismatch.
- [ ] Login via real UI, assert synthetic admin profile and V18 page.
- [ ] Check real API list request, search for reserved never-existing marker, reset, page size, server sort and group filter when options exist.
- [ ] Check desktop/mobile fit and new customer form's initial disabled save state, without submitting.
- [ ] Verify no customer writes or artifacts and re-check release at end.

### Task 2: Isolated runner
- [ ] Add `apps/panel/playwright.hosted-dev-v18.config.ts`, update `apps/panel/uat/tsconfig.json` to typecheck the new spec/config without dropping gallery coverage.
- [ ] Add branch-scoped `.github/workflows/hosted-dev-v18-customers-uat.yml`: secret-free static validation then secrets-backed hosted test in `staging`.
- [ ] Pin expected live panel SHA and enforce exact branch; secrets available only in final browser step.

### Task 3: Evidence and handoff
- [ ] Run and inspect GitHub Actions on the immutable branch HEAD.
- [ ] Record exact SHA/run IDs, PASS/FAIL and tested routes in a dedicated journal entry.
- [ ] Create a draft PR targeting the still-unmerged pilot branch, without merging or deploying to production.
- [ ] Mark full mutation UAT and independent visual critique as not tested until executed.
