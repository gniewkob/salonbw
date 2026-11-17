# 2026-11-17 — DEV API V18 live-state verification

- Scope: SalonBW Studio V18, DEV API only
- Candidate app SHA: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`
- OPS PR: #1711, source `10b67fd0152d7f77bd0c3463a008996d7a0396a0`
- Evidence: owner-run read-only MyDevil inventory and GET endpoint diagnostics
- Host write performed by this journal task: none

## Finding

Previous command passed **8/8** local tests and fresh host preflight, but the remote activation `--plan` returned `DEV_API_ACTIVATION=BLOCKED reason=stage-missing:dist`. An earlier read-only inventory had shown a complete private stage containing 1,393 files matching the archive; therefore the missing stage needed investigation rather than a forced re-stage.

## Evidence: current host

- Fixed DEV app root is a directory; `dev-api.salon-bw.pl/public_nodejs` still maps to the correct application root.
- Live `dist`, `node_modules`, `app.js`, `package.json`, `.env` and `.salonbw-api-release.json` exist; stage equivalents are missing.
- Live release metadata **and** live `.env` `APP_RELEASE` equal the candidate SHA.
- Private recovery directory contains previous `dist`, `node_modules`, `app.js`, `package.json`, `package-lock.json`, and `.env`.
- Recovery journal exists with candidate matching and `oldNames=6`, `newNames=6`; marker `ACTIVATED` exists; `RECOVERED` absent; activation lock absent.
- HTTP `GET https://dev-api.salon-bw.pl/healthz`: **200**, `X-SalonBW-Release` = candidate SHA, `X-Robots-Tag` includes `noindex`, API status `ok`, database status `ok`.
- HTTP `GET https://dev-api.salon-bw.pl/health` without credentials: **401** with candidate SHA and `noindex`.

## Assessment

**LIVE API DEV = PASS** for correct release marker, app/database health, domain mapping and unauthenticated DEV access boundary. Stage missing code slots is consistent with an already completed release-file switch. Do not attempt another activation, restart, recovery or rebuild while API is healthy.

This evidence **does not establish** who executed the file switch, when the restart occurred, successful exercised FreeBSD recovery, full browser UAT, panel/landing release SHA or any DB migration state (only the inspection itself was read-only). The recovery generation is preserved.

## Follow-up

1. Run read-only panel/API integration smoke or targeted authenticated DEV UAT and record observed panel SHA.
2. Address any user-facing V18 failures as independent DEV changes; preserve API recovery files.
3. Review PR #1711 and adjust any stale rollout states after independent UAT; do not conflate this with PROD readiness.
