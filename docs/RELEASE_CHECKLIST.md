# Release Checklist

Use this list whenever preparing a new production deployment. Check off each item (copy into your release ticket) to avoid surprises.

## 1. Pre-release sanity

- [ ] Confirm the target commit already passed the full CI pipeline (`ci.yml` and `e2e.yml`).
- [ ] Run the workspace tests locally for confidence:
    ```bash
    pnpm lint
    pnpm typecheck
    pnpm --filter frontend test
    pnpm --filter salonbw-backend test
    pnpm --filter frontend build
    pnpm --filter salonbw-backend build
    ```
- [ ] (If API changed) Regenerate the OpenAPI client and commit: `pnpm --filter @salonbw/api gen:api`.
- [ ] Review `frontend/CHANGELOG.md` (or author new entries) and ensure user-visible changes are documented.
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
- [ ] After uploading, run `devil www restart <app>` for each Passenger app (public/dashboard/admin) and watch logs for errors.
- [ ] Run database migrations if the backend introduces schema changes.
- [ ] Hit application health endpoints manually:
    - `https://<public-domain>/`
    - `https://<api-domain>/healthz`

## 4. Post-release

- [ ] Monitor logs, metrics, and Sentry (if enabled) for at least 30 minutes.
- [ ] Remove `redirectTo` cookies/login tokens used during smoke tests.
- [ ] Communicate release completion to stakeholders (Slack/Teams/email).
- [ ] Unfreeze the `main` branch and update any open PRs with rebase instructions.
- [ ] Capture lessons learned or follow-up tasks in the backlog.
