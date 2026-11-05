# #1578 — API recovery control-plane and release provenance review

- **Date:** 2026-10-31
- **Author:** ChatGPT (independent repository / primary-source review)
- **Status:** DESIGN REVIEW ONLY; `ROLLBACK_PREFLIGHT=BLOCKED`
- **Production changes:** none
- **Scope:** recovery architecture and acceptance conditions, **not** a runnable rollback procedure
- **Issue:** https://github.com/gniewkob/salonbw/issues/1578
- **Security candidate:** PR #1576, `1ced2e70a441389ded5a075659f8bf06b670644e`
- **Last independently verified active API release:** `b208e36ebb9df508bc8f4555346d1de9ffa5e9b7`; HTTP header verification reported by owner

## Finding

The existing `.github/workflows/deploy.yml` is a normal release installer, **not** a no-write API recovery tool:

1. The `Upload backend bundle` step uses `rsync --delete` against the active `dist/`. It changes live filesystem state before application restart.
2. The `Generate and Upload .env (api)` step writes an environment file containing `APP_RELEASE`. It does not satisfy a recovery requirement that the current `.env` remains byte-identical.
3. The `Run DB migrations (api)` step executes a migration entrypoint, falling back to `dist/migrate.js` if `dist/src/migrate.js` is missing. The host has an extra `dist/migrate.js` with no proven source SHA (owner-reported); **file existence is not provenance**.
4. The workflow's automatic file-snapshot/restore path is conditional on `DEPLOY_ENV == 'staging'`; there is no equivalent general automatic production rollback in this workflow.
5. The production `app.js` calls `dotenv.config({..., override: envFile.APP_ENV === 'development' })`. Thus a production `APP_RELEASE` supplied by the Passenger process environment can take precedence over the on-disk `.env`. An HTTP release header is an **assertion from runtime configuration**, not by itself proof that disk code and dependency graph match that SHA. A synthetic process test of this precedence is not a Passenger-host isolation test.
6. The #1576 npm policy gates verify certain package versions and manifest overrides but do **not** make the entire npm dependency resolution immutable. A passing version gate cannot prove a behavior-regression rollback for the same dependency graph.
7. MyDevil documents user-wide `~/.bash_profile` as a Passenger environment source. Setting a sentinel there risks affecting sibling applications. Upstream Passenger provides Nginx per-application `passenger_env_var`, but MyDevil's availability or delegation of this setting is **unverified**; do not assume the shared-hosting user can configure it.

### Sources

- Repository: [deploy workflow](https://github.com/gniewkob/salonbw/blob/1ced2e70a441389ded5a075659f8bf06b670644e/.github/workflows/deploy.yml), [API entrypoint](https://github.com/gniewkob/salonbw/blob/b208e36ebb9df508bc8f4555346d1de9ffa5e9b7/backend/salonbw-backend/app.js), [API dependency verifier](https://github.com/gniewkob/salonbw/blob/1ced2e70a441389ded5a075659f8bf06b670644e/scripts/ci/check-api-production-dependencies.cjs).
- [MyDevil Node.js environment](https://pomoc.mydevil.net/Node.js/), [MyDevil Mise / Passenger variables](https://pomoc.mydevil.net/Mise/).
- [Passenger Nginx configuration reference (`passenger_env_var`)](https://www.phusionpassenger.com/docs/references/config_reference/nginx/).

## Recovery design constraints

**Code regression:** Prepare a new *identifiable* recovery commit based on a known safe application source SHA, keep the approved non-vulnerable dependency policy, compile a fresh isolated artifact, then independently validate API behavior. Do not use an archive of unknown source provenance as a deployable release.

**Dependency regression:** Using the same dependency graph is not a rollback. The acceptable recovery is a separately built and tested compatible dependency version or forward-fix, which still satisfies the security advisory constraints. A functional fail-first test showing the regression and recovery PASS is mandatory.

**Runtime release identity:** An accepted candidate must attest `source SHA` + `build/artefact digest` + `installed dependency-policy digest` and expose the correct active release after starting under the real Passenger application environment. Merely changing `APP_RELEASE` in a shared `~/.bash_profile` or retaining an old on-disk `.env` value is insufficient. Develop any per-application release metadata loader and its isolation behavior on DEV before considering production. The loader may not override the app's runtime secrets or production environment identity.

**Migration and DB immutability:** A no-DB-write rollback cannot invoke `dist/src/migrate.js` or `dist/migrate.js` in either direction. Recovery must prove schema compatibility independently against a restored **synthetic/isolated** database, never by writing to production. The unknown fallback migration file stays untouched on production pending provenance investigation.

**Filesystem immutability:** Normal `rsync --delete` to the live `dist/` is not an atomic recovery plan. Build and validate a complete candidate tree in a private isolated directory first. Explicitly exclude `.env`, uploads, DB volumes/credentials, panel and landing from the recovery change set; verify scoped content digests before/after. If an atomic activation primitive is unavailable on MyDevil, mark activation safety BLOCKED rather than inventing a symlink-switch procedure.

**Restore trust:** SHA-256 on backup files and a successful partial isolated restore prove integrity/readability and partial restorability, but do not prove source provenance, complete runtime behavior, or dependency-safe reactivation.

## Independent acceptance matrix

| Gate | Required evidence | State as of 2026-10-31 |
|---|---|---|
| `ARCHIVE_INTEGRITY` | owner-only archives validate hashes and extraction in isolation | PARTIAL/PASS as reported by Work; source provenance unknown |
| `PASSENGER_ISOLATION` | live DEV Passenger test with two isolated apps, nonsecret sentinel; verify inheritance does not leak, while leaving production untouched | BLOCKED |
| `CODE_ROLLBACK` | known source SHA, newly built artifact digest, approved dependency graph, full synthetic behavior smoke including auth / DB compatibility | BLOCKED |
| `DEPENDENCY_RECOVERY` | real/synthetic fail-first dependency regression and passing compatible repaired dependency graph, no HIGH | BLOCKED |
| `CONFIG_DB_IMMUTABILITY` | pre/post private config and upload digests identical, separate DB non-write attestation, no migrations, correct release header | BLOCKED |
| `ACTIVATION_RECOVERY` | isolated DEV switch + restore-to-forward test with verified Passenger runtime, exact release metadata, no sibling impact | BLOCKED |
| `PRODUCTION_PROMOTION` | explicit owner approval + documented rollback + new exact SHA CI | NO-GO |

The previous Work operator reports a successful isolated FreeBSD npm22 installation with Sharp and bcrypt, plus backup extraction. This review **does not claim** direct access to their local/private artifacts or an executed Passenger drill.

## Proposed next execution steps (no production writes)

1. Publish the existing **local** #1578 runbook/journal in its own PR after reconciling with this independent review. Preserve the source files; do not replace the owner's unpushed local commits. It is okay to keep this independent review separate until merge.
2. On an authorized, isolated DEV Passenger app, test per-application release provenance using nonsensitive sentinels, and prove no sibling app inherits them. Abort on unexpected environment inheritance.
3. Build two separately identifiable candidates and run *two-way* recovery drills on synthetic/isolated data: (A) code rollback using patched deps, (B) dependency forward-fix after a deterministic fail-first behavior test. Prove no migrations and no .env/upload/DB mutations.

## Decision

`ROLLBACK_PREFLIGHT=BLOCKED`, `PRODUCTION_DEPLOYMENT=NO-GO`. The open #1576 candidate addresses verified HIGH advisories, while the active API dependency version is reported vulnerable. This is a time-sensitive remediation risk, not authorization to bypass release safety. Merge, production activation, any database operation and global Passenger environment modification require their respective separate gates.
