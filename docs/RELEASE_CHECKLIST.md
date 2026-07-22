# Release Checklist

Use this list whenever preparing a new production deployment. Check off each item (copy into your release ticket) to avoid surprises.

## 1. Pre-release sanity

- [ ] Confirm the target commit already passed the full CI pipeline (`ci.yml` and `e2e.yml`).
- [ ] Run the workspace tests locally for confidence:
    ```bash
    pnpm lint
    pnpm typecheck
    pnpm --filter @salonbw/landing test
    pnpm --filter @salonbw/panel test
    pnpm --filter salonbw-backend test
    pnpm --filter @salonbw/landing build
    pnpm --filter @salonbw/panel build
    pnpm --filter salonbw-backend build
    ```
- [ ] (If API changed) Regenerate the OpenAPI client and commit: `pnpm --filter @salonbw/api gen:api`.
- [ ] Review `apps/landing/CHANGELOG.md` and `apps/panel/CHANGELOG.md` (or author new entries) and ensure user-visible changes are documented.
- [ ] Verify environment variables in `docs/ENV.md` match the expected production configuration.
- [ ] Audit secrets in GitHub → Settings → Secrets (tunnel credentials, JWT secrets, WhatsApp tokens) and update if rotations occurred.
- [ ] Smoke-test the app locally with Staging/Prod configuration if possible (set `NEXT_PUBLIC_API_URL`, use the SSH tunnel).

## 2. Release coordination

- [ ] Announce downtime/maintenance window if database migrations or long-running tasks are planned.
- [ ] Freeze merges into `main` until the release tag is cut.
- [ ] Create a release branch (e.g. `release/2025-03-09`) if you need to stabilise before tagging.
- [ ] Update version numbers where relevant (package.json files, docs).
- [ ] Tag the release using the format `vYYYY.MM.DD` (or your agreed scheme) after final merge:
    ```bash
    git tag v2025.03.09
    git push origin v2025.03.09
    ```
- [ ] Draft GitHub release notes pointing at the changelog section and any breaking changes.

## 3. Deployment (mydevil)

- [ ] Follow [`docs/DEPLOYMENT_MYDEVIL.md`](./DEPLOYMENT_MYDEVIL.md) to build and upload the frontend + backend.
- [ ] Ensure the SSH tunnel secrets (`MYDEVIL_*`) are loaded in the deployment environment.
- [ ] After uploading, run `devil www restart <app>` for each Passenger app (public/dev + panel). (`admin` target is legacy.)
- [ ] Run database migrations if the backend introduces schema changes.
- [ ] Hit application health endpoints manually:
    - `https://<public-domain>/`
    - `https://<api-domain>/healthz`

## 4. Post-release

- [ ] Monitor logs, metrics, and Sentry (if enabled) for at least 30 minutes.
- [ ] If the dashboard release touches calendar compat/runtime, run:
    ```bash
    cd apps/panel
    source ../../.env
    PLAYWRIGHT_BASE_URL=https://panel.salon-bw.pl pnpm test:prod:calendar --project=desktop-1366
    ```
    Confirm the smoke passes with `salonbw-*` assets, `SalonBWConfig` + `VersumConfig` alias, and no `Unhandled response status error` from vendored calendar GraphQL calls.
- [ ] Remove `redirectTo` cookies/login tokens used during smoke tests.
- [ ] Communicate release completion to stakeholders (Slack/Teams/email).
- [ ] Unfreeze the `main` branch and update any open PRs with rebase instructions.
- [ ] Capture lessons learned or follow-up tasks in the backlog.

## 5. Final public-domain cutover (`dev.salon-bw.pl` -> `salon-bw.pl`)

Complete this section only after the landing release on the preview domain has
passed business acceptance and the same release has been moved to the canonical
production domain. These steps are part of the cutover close condition, not a
preview deployment.

- [ ] Confirm the accepted landing release is served from `https://salon-bw.pl`
  and that canonical metadata no longer points to `dev.salon-bw.pl`.
- [ ] Confirm these public routes return HTTP `200` without authentication:
    - `https://salon-bw.pl/privacy`
    - `https://salon-bw.pl/policy`
    - `https://salon-bw.pl/data-deletion`
- [ ] In the production Meta/Instagram application connected to `salon_bw`,
  replace preview, legacy, homepage-only, and third-party legal links with:
    - Privacy Policy URL: `https://salon-bw.pl/privacy`
    - Terms of Service URL: `https://salon-bw.pl/policy`
    - Data Deletion Instructions URL: `https://salon-bw.pl/data-deletion`
- [ ] If Business Login is actually enabled, update App Domains, Site URL, and
  every valid OAuth redirect URI to the canonical domain. Do not configure an
  unused login flow solely for the gallery integration.
- [ ] Re-open the saved Meta settings and verify the canonical values persisted;
  test all three links from a signed-out/private browser session.
- [ ] Search Meta settings and repository/runtime configuration for remaining
  `dev.salon-bw.pl` references. Keep only references that are intentionally
  preview-specific and record each exception.
- [ ] Do not rely on redirects from `dev.salon-bw.pl` as the final state. Meta
  must store the canonical `salon-bw.pl` URLs directly.
