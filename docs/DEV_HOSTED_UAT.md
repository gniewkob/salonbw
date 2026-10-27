# SalonBW hosted DEV drawer UAT (no-write browser test)

This test runs against an **already deployed** DEV release. It checks the real
browser UI and real DEV login, but **intercepts** the collision GET and
**fulfills appointment POST locally**: it does not create an appointment in DB.

**Required exact release:** `c4399429a7f9a7804161847f79d6d70a64a025d1`.
The test fails before login unless the panel+API report this same SHA and DEV
environment. It refuses production/non-DEV URLs or missing credentials.

Run from a clean worktree at the test PR commit. Do NOT run the old
`.github/workflows/e2e.yml` with generic database credentials. In your own
terminal set these variables without copying their values into ChatGPT/GitHub:

- `PLAYWRIGHT_BASE_URL=https://dev-panel.salon-bw.pl`
- `DEV_ACCESS_USER`, `DEV_ACCESS_PASSWORD`: DEV Basic Auth gateway
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`: synthetic DEV admin account

The test file is `apps/panel/uat/hosted-dev-drawer-guard.pw.ts`.
It is **outside the normal Jest and Playwright discovery paths**.

From a separate clean local worktree at the UAT test PR commit, install
workspace dependencies and Chromium if not already available:

```sh
pnpm install --frozen-lockfile
pnpm --dir apps/panel exec playwright install chromium
```

On macOS Terminal (zsh), enter secrets interactively, not in a command you
paste into chat, source control, CI logs or shell history:

```sh
export PLAYWRIGHT_BASE_URL=https://dev-panel.salon-bw.pl
read -r "DEV_ACCESS_USER?DEV Basic user: "
read -rs "DEV_ACCESS_PASSWORD?DEV Basic password: "; echo
read -r "E2E_ADMIN_EMAIL?Synthetic DEV administrator email: "
read -rs "E2E_ADMIN_PASSWORD?Synthetic DEV administrator password: "; echo
export DEV_ACCESS_USER DEV_ACCESS_PASSWORD E2E_ADMIN_EMAIL E2E_ADMIN_PASSWORD
```

Then run **only this opt-in suite** (it cannot reach production and never
sends an appointment POST to the hosted API):

```sh
pnpm --dir apps/panel exec playwright test \
  --config=playwright.hosted-dev.config.ts \
  --project=hosted-dev-uat \
  --workers=1 \
  --reporter=list
echo "Kod zakończenia UAT: $?"
```

The test verifies: known live DEV SHA, DB health, FAB resets to current time,
reasserting 4 Nov 2026 09:00 Europe/Warsaw before submission, first conflict
warning with **zero** appointment POSTs, close/reopen clearing acknowledgement,
second fresh check, explicit admin `forceOverlap:true`, correct UTC request
`2026-11-04T08:00:00.000Z`, and **one mocked POST**.

It is **not** equivalent to persisted UAT, server authorization (403), real
concurrency (409), timetable/day-off, DST or cross-date financial statistics.
Those remain gated separately. Never upload raw Playwright traces or screenshots:
they can contain synthetic customer records, HTTP headers and sessions.
Share only the final test summary and sanitized errors.

If the Playwright test fails, leave healthy DEV deployments in place; diagnose
test fixture/selector versus application state. Do not rerun deployment or
create DB data to make a test pass.
