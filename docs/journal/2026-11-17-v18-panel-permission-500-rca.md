# 2026-11-17 — V18 DEV panel HTTP 500: restrictive artifact file modes

## Owner's real MyDevil evidence

- Candidate V18: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`.
- Last known healthy live panel and rollback target: `beee6b40e1112765cb07d481bae8f66e72cef543`.
- After two DEV-only attempted activations, hosted `GET /__release.json` returned **HTTP 500 in all 20** active runtime checks; both activations reported `live-http-verification-failed` and rolled back.
- Owner independently verified the second rollback: old live SHA, V18 stage SHA, domain mapping and old `__release.json` over HTTPS PASS.
- Local Node22 tests **21/21 PASS**; staged V18 `app.js` and `app.cjs` returned valid private AF_UNIX release/login responses, so isolated startup success does not prove Passenger/webserver access.
- The earlier redacted panel error-log category scan had no matches. It does not resolve the root cause.
- Owner then measured live vs staged file modes:

| Path | Healthy LIVE | V18 stage |
| --- | --- | --- |
| Application root | 0755 | 0700 |
| public | 0755 | 0700 |
| public/__release.json | 0644 | 0600 |
| app.js and app.cjs | 0644 | 0600 |
| .next | 0755 | 0700 |
| .next/BUILD_ID | 0644 | 0600 |
| node_modules | 0755 | 0700 |
| node_modules/next/package.json | 0644 | 0600 |
| .env.runtime.json | 0600 | 0600 |

Owner's inspection returned `PUBLIC_GROUP_OTHER_ACCESS_LOST=YES` and no runtime mutations.

MyDevil's official Node.js documentation says `public_nodejs/public` is served as static files by the web server without routing through Node.js: https://pomoc.mydevil.net/Node.js/. The loss of directory traversal and file read rights for group/other is a **strong, testable cause** of the hosted 500. A successful reactivation after mode repair has **not yet been observed**, so do not label it confirmed.

## Corrections in draft ops branch

1. `scripts/mydevil/manual-dev-panel-stage.sh`: after isolated FreeBSD npm22 install, normalize code and static files to directories 0755, ordinary files 0644, executable files 0755. Preserve private `.env.runtime.json` at 0600, private `tmp` directory at 0700; reject out-of-stage links, private extra environment files or unknown file types. The stage remains beneath its private parent until activated.
2. `scripts/mydevil/manual-dev-panel-activate.mjs`: fail closed before renames when release root, `public`, `.next`, `node_modules` or required release files lack group/other access. This blocks a repeat of the same failure.
3. `scripts/ci/manual-dev-panel-activate.test.mjs`: coverage for private-mode stage refusal and private config preservation.
4. `scripts/ci/manual-dev-panel-permissions.test.cjs`: executes the exact inlined stage normalization against disposable fixtures (modes, secret protection, bad symlink, npm internal symlink). Included in `manual-dev-panel-packaging.test.sh`.

## Status and actions still required

- All new source changes are committed only on draft ops branch. **Local tests for these new commits NOT YET EXECUTED** on owner Mac; staged files on FreeBSD are **NOT YET PERMISSION-NORMALIZED**.
- No further DEV panel activation has been performed after identifying the mode differences. The old panel remains last-verified live and healthy; V18 API last-verified healthy.
- Operator sequence: pin current ops SHA; run new Node22 tests; read-only verify old live/V18 staged exact SHA, healthy host mapping, no activation lock/previous generation; normalize only the V18 staged code and static modes while preserving runtime private config; rerun read-only `--plan` and staged smoke; only then consider a separately measured DEV panel activation with existing auto-rollback and independent live verification.
- No migrations, database writes, API/landing/PROD changes, no provider backup deletion.
