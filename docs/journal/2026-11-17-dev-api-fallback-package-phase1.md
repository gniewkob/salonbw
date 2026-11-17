# DEV API fallback — immutable artifact packaging (phase 1)

- Date: 2026-11-17
- Scope: PRELAUNCH DEV only; BUILD / B for source and synthetic tests.
- Branch: `ops/v18-dev-api-artifact-20261117` (based on OPS fallback `d22b384bbcf786089734b6cdfdfd6dc188f67a18`).
- Candidate V18: `b5d1886b8bbd004e3c7d30a7724cae673d7879ef`.

## Finding

The OPS fallback branch has an immutable source transport, local release gate, and panel-specific package/stage/recovery code, but no corresponding API artifact packaging path. The standard Actions workflow deploys API via in-place `rsync --delete`, which is not an acceptable unreviewed manual fallback. Current hosted DEV API still reports `beee6b40e1112765cb07d481bae8f66e72cef543`. Both consent-related migrations are already recorded in DEV, but no complete pending-migration assessment or hosted V18 API test has been performed.

## Change

- Add `scripts/ci/package-manual-dev-api.sh`: exact branch/SHA check, Node 22 + pnpm 10.14.0, redacted Gitleaks, frozen install, approved backend manifest overrides, Nest build, compiled migration entrypoint verification, and private archive with SHA-256 digest.
- Archive includes only built `dist`, `app.js`, `package.json` and non-secret release metadata. It contains no `.env`, Mac `node_modules`, persistent data or customer files; archive link entries are rejected. The packaging step does not contact MyDevil.
- Add `scripts/ci/manual-dev-api-packaging.test.sh`: syntax, invalid inputs and source-contract regression checks, without network or host writes.

## Validation

- GitHub source commit and test script added to a new isolated ops branch.
- Offline tests on the operator Mac: **NOT RUN**. Neither `bash -n` nor an exact-SHA packaging execution is claimed to have passed yet.
- Prior API/panel local release gate and isolated synthetic Docker UAT applied to the V18 application SHA only, not to this new packaging script.
- CI at this ops SHA: **UNKNOWN / GitHub Actions previously unavailable**.

## Rollout

No source staged onto MyDevil by this change. No DEV or PROD application restart, database migration, file deletion or host ACL change. PUBLIC CONNECT risk #1706 has been explicitly accepted for deferral by the owner; this work does not change its technical state.

## Follow-up

Execute offline packaging checks on the operator Mac, review any failure, then implement and test a separate MyDevil FreeBSD API staging script that installs native modules and copies only the existing DEV runtime settings into a private stage. Do not activate API until its rollback and health verification path have passed synthetic tests and separate hosted deployment authorization.
