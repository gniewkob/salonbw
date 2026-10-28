# SalonBW — ręczny GitHub-hosted DEV HTTP authorization UAT

## Purpose

Run the existing, **non-booking-writing** Playwright test using the
`staging` GitHub Actions environment. Operators do **not** need to retrieve or
copy the DEV gateway password from GitHub to their Macs.

Workflow: `.github/workflows/hosted-dev-http-auth-uat.yml`.
Test source is pinned to
`ae6a86cad4d636498000aa1ddc8d36b1dce00f1b` (Draft #1548).
The deployed DEV release checked by the spec is
`c4399429a7f9a7804161847f79d6d70a64a025d1`.
Neither SHA is a release/deployment request.

## Activation / GitHub UI

GitHub only enables `workflow_dispatch` when its workflow definition is
present on the **default branch** (`master`). First **review and merge the
standalone workflow PR**; this does not merge any booking feature PR, change
MyDevil, perform a deployment or enable production release.

After merging:

1. Open `gniewkob/salonbw` → **Actions**.
2. Select **SalonBW DEV - HTTP auth UAT (manual)**.
3. Select **Run workflow** → `master`.
4. Inspect the run's isolated Jest and hosted Playwright steps.
   Only the Playwright result from this exact pinned source counts as the
   hosted DEV acceptance evidence.

This workflow cannot be activated directly from its unmerged Draft PR.
The job refuses non-`master` dispatches and has no user-controlled source SHA,
target host, or test command input.

## Credentials and protections

Environment: **staging**, with GitHub environment protections applied as
configured; `deployment: false` avoids producing an unrelated deployment
record. GitHub repository-level secrets may also be resolved by the job;
review secret provenance and environment overrides separately.

Required nonempty secrets:

- `DEV_ACCESS_USER`: must be exactly `uat`, otherwise fail closed.
- `DEV_ACCESS_PASSWORD`: password for the DEV Basic Auth gateway.
- `E2E_ADMIN_PASSWORD`: current password of the **synthetic salon admin**
  `stylist@salonbw.example.test` (not a system administrator).

The admin **email** is fixed in workflow code. The initial development
seed gave the stylist a random independent password, so
`DEV_ADMIN_PASSWORD` (for `admin@salonbw.example.test`) **must not** be
substituted for the stylist password. If `E2E_ADMIN_PASSWORD` is unavailable
or doesn't authenticate, stop for separate owner-approved fixture credential
management; don't reset business accounts, disclose secrets, or switch to a
system-admin identity just to make the test pass.

Secrets appear only in the preflight and final Playwright step environments,
not dependency installation, checkout, or static checks. The presence check
prints **variable names only**. Avoid adding `set -x`, upload of reports,
raw HTTP headers/cookies, browser traces, screenshots, or videos.

Recommended: configure required reviewers for `staging`, if supported by
repository settings; this proposal does not assert reviewers are currently
configured.

## What runs

1. Verifies pinned commit, test files and presence of staging credentials.
2. Installs lockfile dependencies with no injected login credentials.
3. Runs the in-process NestJS HTTP authorization regression (Jest, synthetic).
4. Typechecks and enumerates guarded UAT tests offline.
5. Installs Chromium.
6. Runs **only** `hosted-dev-http-auth-read.pw.ts`, 1 worker, no retries.

Hosted browser test: exact `https://dev-panel.salon-bw.pl` and
`https://dev-api.salon-bw.pl` at the expected DEV release; **anonymous**
direct Nest API profile/system GET must return 401. After login, the
backend sets cookies for `dev-panel.salon-bw.pl` only; therefore, the
**authenticated** Nest profile GET 200 and system-only GET 403 must go
through the real **panel same-origin `/api/` proxy**, not directly from the
browser to the sibling API host. The test explicitly verifies HttpOnly/Secure
panel cookie scope and absence of that JWT at the sibling API origin.
Login creates a synthetic DEV authentication session.
After login all browser mutations are blocked; direct API probes are GET-only.
No appointment creation, editing, cancellation, customer updates, production
requests, MyDevil deployment or database migrations.

## Result classification

- **Missing secret / invalid gateway username:** `BLOCKED`, not app FAIL.
- **Jest or TypeScript failure:** isolated source regression, no hosted UAT PASS.
- **Hosted 401/200/403 failure:** investigate DEV session, cookie Domain/Scope,
  gateway and backend using privacy-safe summaries; no silent retriable writes.
- **Success:** isolated contracts + bounded hosted GET auth checks PASS.
  This is **not** real appointment `POST` 403, same-slot 409, booking flow,
  backup restore, business acceptance, or production GO.

Keep PR #1548 Draft and PROD NO-GO until remaining independent release gates
are satisfied.
