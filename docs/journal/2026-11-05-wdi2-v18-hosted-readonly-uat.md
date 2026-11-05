# WDI 2.0 — hosted DEV Customers V18 UAT (read-only)

- **Date:** 2026-11-05
- **Agent:** ChatGPT / GitHub connector
- **Source baseline:** PR #1642 `f0dcfd273f768909d514e705e1317609bf6fe478`
- **Test code SHA:** `bcae77f95c7dd5cbf36e59e2dc82ea4ba4cc34fa`
- **PR:** #1643 (Draft, stacked on #1642)

## Finding
The WDI 2.0 skill registry exposes 26/26 expected skill instructions. This is not a browser execution result. Existing V18 browser tests were synthetic/mocked, and remote assistant browser access lacked the Basic Auth + app session needed for real hosted DEV UAT. The repository already had dedicated `uat` gateway and `stylist@salonbw.example.test` synthetic staff credentials in GitHub staging Secrets.

## Change
Added `apps/panel/uat/hosted-dev-v18-customers.pw.ts`, `apps/panel/playwright.hosted-dev-v18.config.ts`, an expanded UAT TypeScript project, and `.github/workflows/hosted-dev-v18-customers-uat.yml`.

The runner only triggers from the dedicated test branch. Secrets enter **only the final hosted test steps**. It pins the panel's exact DEV release, checks DEV API health, authenticates the synthetic non-system admin, and uses real backend requests to check list, page size, sort, group selection when groups exist, unmatched search, filter reset, modal disabled/enabled state and 1440/390px overflow. Other browser writes are explicitly blocked and checked. No screenshots, traces, videos, HTML report or customer exports.

## Validation
- **Deployed DEV panel SHA:** `f0dcfd273f768909d514e705e1317609bf6fe478`, staging deploy [#42050973549](https://github.com/gniewkob/salonbw/actions/runs/42050973549): **SUCCESS**.
- **Authenticated hosted UAT:** [#42052958152](https://github.com/gniewkob/salonbw/actions/runs/42052958152), test code SHA `bcae77f95c7dd5cbf36e59e2dc82ea4ba4cc34fa`: **SUCCESS; 1/1 Playwright pass, 8.9 s**.
- The same workflow completed locked dependency installation, TypeScript checking for both hosted specs, test discovery, Chromium installation and staging credential preflight.
- PR-triggered, secret-free Gallery UAT static check [#42053117798](https://github.com/gniewkob/salonbw/actions/runs/42053117798): **SUCCESS**. The gallery's write-enabled job was skipped.
- Independent Claude Code Review [#42053117816](https://github.com/gniewkob/salonbw/actions/runs/42053117816): **SUCCESS** (review action status, not functional acceptance).
- **No new screenshots or third-party visual judgment** were produced because this real DEV contains customer records. Browser test does not establish WCAG conformance or full legacy Customer parity.

## Rollout
No app/source deployment, DB change, customer mutation, production merge, production rollout or new test account. Only an opt-in GitHub Actions test runner was executed against an already-deployed DEV panel.

## Follow-up
1. Add separately approved synthetic create/edit/delete UAT with scoped IDs, disabled notifications and guaranteed cleanup; do not touch existing customer records.
2. Evaluate design with non-PII fixtures or locally authorized owner screenshots and independently rate actual desktop/mobile visuals.
3. Keep #1643 Draft until owner accepts integration and #1642 is reviewed; preserve the legacy `/customers` entrypoint.
