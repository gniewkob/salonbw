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

The commands below use **Bash** syntax. On a Mac, an interactive terminal
might run Bash even when `zsh` is the macOS default. The `read -r "VAR?Prompt"`
syntax is zsh-only and fails in Bash with `not a valid identifier`. Avoid
`set -e` in an interactive terminal, because it may close the shell on failure.

Enter synthetic DEV credentials **interactively** (password entry is silent).
Never paste their values into chat, source control, CI logs, or shell history:

```bash
cd "$HOME/Repos/salonbw-dev-uat-1545"
export PLAYWRIGHT_BASE_URL="https://dev-panel.salon-bw.pl"

read -r -p "Login bramki DEV: " DEV_ACCESS_USER
read -r -s -p "Hasło bramki DEV: " DEV_ACCESS_PASSWORD
printf '\\n'

read -r -p "Email testowego administratora: " E2E_ADMIN_EMAIL
read -r -s -p "Hasło testowego administratora: " E2E_ADMIN_PASSWORD
printf '\\n'

export DEV_ACCESS_USER DEV_ACCESS_PASSWORD E2E_ADMIN_EMAIL E2E_ADMIN_PASSWORD
```

If the first attempt failed with missing environment variables, re-enter the
credentials with this corrected Bash syntax and rerun the test; no dependency
reinstall, Git checkout, or application redeploy is needed.

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
