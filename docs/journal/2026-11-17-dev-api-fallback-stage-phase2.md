# DEV API fallback — isolated FreeBSD stage (phase 2)

- Date: 2026-11-17.
- Project: SalonBW / Studio V18, Type B PRELAUNCH; PROD/customer data protected.
- Candidate V18: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`.
- Ops branch: `ops/v18-dev-api-artifact-20261117`, Draft PR #1711.

## Finding

Owner ran SHA-256, archive safety and non-secret metadata checks on an existing Mac-produced V18 API artifact; all PASS. However, MyDevil FreeBSD API staging and recovery were not implemented in #1701. Hosted DEV API currently reports the previous release `beee6b40e1112765cb07d481bae8f66e72cef543`. Live API deployment or in-place `rsync --delete` would be premature and potentially irreversible.

## Change

- Add `scripts/mydevil/manual-dev-api-stage.sh` with explicit `--plan` (read-only) and `--execute` (private stage) modes, exact-SHA approval variable, receipt/mirror, fixed domain symlink, 4 GiB provider+filesystem quota checks, package digest and archive entry/symlink validation.
- Enforce DEV-only environment metadata: independent DEV DB identity, `APP_ENV=development`, `dev_` cookies, outbound/SMS disabled, no schema synchronize.
- Copy DEV-only `.env` directly from the existing DEV API runtime inside MyDevil into private staging, with mode 0600; set only `APP_RELEASE` to candidate SHA. Never transport it through Mac/GitHub.
- Install dependencies using FreeBSD `npm22 --omit=dev --ignore-scripts`; verify approved dependency versions, bcrypt native smoke and sharp JPEG/PNG/WebP codecs; no application start, migration, active-root replacement or Passenger restart.
- Add `scripts/ci/manual-dev-api-stage.test.sh` (offline negative/static regression checks).

## Validation

- Previously owner-run: `API_ARTIFACT_CHECKSUM=PASS`, `API_ARTIFACT_ARCHIVE=PASS`, `API_ARTIFACT_RELEASE_METADATA=PASS`; `HOST_MUTATIONS=NONE`.
- GitHub source addition: PASS.
- New `bash -n`, offline regression tests on operator Mac: **NOT RUN** yet.
- FreeBSD `--plan`/isolated native dependency installation: **NOT RUN** yet.
- API runtime smoke/rollback: **NOT IMPLEMENTED**. This stage change does not activate a service.
- Host / database / customer data: no writes by agent.

## Rollout

**NOT STARTED.** Running `--execute` would write only to `~/.salonbw-manual/staged-api/<SHA>`, after a separate owner-authorized artifact upload and explicit SHA approval. It will not migrate, restart or change domains.

## Next

1. Operator runs `bash scripts/ci/manual-dev-api-stage.test.sh` on the branch's exact head, reports output. Fix failures first.
2. Under explicit approval of the private hosting staging operation: checksum-verified private archive transport, remote `--plan`, then remote `--execute`. Collect `DEV_API_STAGE=PASS` or sanitized failure, not secret configuration.
3. Implement/verify API activation and rollback using synthetic fixtures plus exact-SHA health checks; separate API deployment and panel DEV UAT. No PROD changes. Owner accepted deferral of #1706 PUBLIC CONNECT for DEV development without any ACL modification.
