# Isolated development and canonical production deployment

- Date: 2026-10-25
- Agent: Codex
- Status: production/development rollout and live acceptance complete; final regression pending
- Final runtime revision: `328d362f101490b0e4b279c3af74eaae85968239`

The checkpoints below preserve the order of investigation. Earlier pending items
were resolved by the final rollout record; they are not current blockers.

## Authorization

Owner explicitly requested the complete working production/development deployment,
separate dev panel/API/database with customer messaging disabled, and expansion
of the MyDevil plugin. Existing applications must keep the apps/nodejs directory
plus domains/.../public_nodejs symlink pattern.

## Verified infrastructure

Production API is apps/nodejs/api_salonbw; panel is apps/nodejs/panelbw.
Current development landing is apps/nodejs/salonbw. New dev domains have been
created through the extended local MyDevil adapter and linked to:

- dev-api.salon-bw.pl -> apps/nodejs/api_salonbw_dev
- dev-panel.salon-bw.pl -> apps/nodejs/panelbw_dev

Both new A records resolve publicly and Let's Encrypt CLI operations completed.
Live HTTPS/application acceptance is a later gate. Separate database actual name
is p11522_salonbw_d (MyDevil shortened the requested name); verified directly
through PostgreSQL metadata and an authenticated connection, zero public tables.
Credentials remain in the private local plugin vault, never in source or output.
Production data has not been copied to development.

## Changes and controls in progress

- Dedicated backend/frontend auth cookie namespace; CSRF client option prevents
  selecting a production token when both namespaces coexist.
- Development forces outbound delivery disabled at e-mail/SMS/push/WhatsApp
  boundaries and disables scheduled jobs. Startup requires explicit database,
  cookie namespace, delivery policy and independent signing/access secrets.
- Mobile technical dashboard release SHA wraps to avoid the 11px overflow
  identified by the production screenshot.
- Targeted fail-first auth and CSRF tests pass after changes; backend and panel
  typechecks pass. Full regression/build and deployed dev smoke remain pending.

## Acceptance required at the initial checkpoint

Finish access protection, fail-closed deployment resolution and dedicated dev
secrets; migrate/seed synthetic development only; deploy and verify both
stacks and session isolation. Merge landing schedule fix #1514, preserve legacy
site backup, promote the accepted landing to the canonical domain, verify legal
routes and external Meta URLs. Complete plugin coverage and document actual
hosting verification separately from cataloged/local-only operations.

## Deployment implementation checkpoints

- Fixed environment resolver and ordered CLI wrapper, strict running release
  checks, private diagnostics and frontend runtime configuration implemented.
- Dedicated development secrets configured in GitHub staging from local private
  references; no values emitted. Development database variables point only to
  the independently verified database above.
- Unit checks: configuration/smoke/env 14/14 plus dispatch wrapper 2/2;
  gateway middleware 3/3. SMS dotenv false parsing regression failed first,
  then all four provider-boundary checks passed without network access.
- Actual application deployment, synthetic seed, canonical activation, browser
  acceptance and native MCP reload are still pending. Do not infer completion
  from provisioning or these implementation checkpoints.

Local final checks: backend 488/488 (63 suites), panel 420/420 (102 suites),
landing 90/90 (26 suites); all three TypeScript checks and application builds
passed. Startup JS/CJS files use node --check because application tsconfig lint
does not include those entrypoints. Production/development rollout pending.

PR #1516 opened. Existing Sentry workflow guard updated to require production-only
DSN injection for both frontends, matching development telemetry isolation.

CI caught a wrapper preview regression specific to GITHUB_OUTPUT: the resolver
wrote to the runner output file instead of the displayed preview. Child output
is now explicitly console-only and the test reproduces the runner environment.
Manual full-history secret scans surfaced historical findings; no matched
values were displayed. PR change-scoped secret scan passed. No allowlist or
secret-scan gate was relaxed.

Added a guarded development-only seed: public curated services/variants, synthetic
.test identities, synthetic weekday timetable; no clients or appointments copied.
Two local tests verify production/database/delivery rejection and strict public
field projection. Seed remains unexecuted until development migrations pass.

Live prepare-only rollout caught a landing path mismatch: resolver paths are
relative to account home, while the extraction guard requires an absolute path.
The guard correctly refused extraction, leaving legacy PHP active. Landing now
uses the same explicit account-home prefix as panel. No safety guard relaxed.

Fresh FreeBSD API runtime lacked a native bcrypt build (no FreeBSD prebuilt;
install scripts intentionally disabled). Added an explicit bcrypt-only source
rebuild when require fails and a hash/compare runtime check. Other dependency
install scripts remain disabled. Development startup is not accepted until
health succeeds; production API health remains verified.

Fresh migrations create historical test identities. Initial seed correctly
refused non-.test addresses. The development-only seed can now anonymize only
explicitly allowlisted migration fixtures whose names contain test/E2E and
whose database has zero appointments; passwords and sessions are invalidated.
Unknown identities still block initialization. Production is never a target.

GitGuardian identified exactly two literal PostgreSQL fixture URIs in the
development-seed tests (password fixture, not deployed credentials). Fixtures
now compose URLs structurally. Own feature commits are consolidated while a
local backup ref preserves the prior history; no security detector exception
was added. Fresh PR scans are required before merge.

## Final production deployment guard

Master CI 40238470376 passed. Deploy 40238470369 refused the existing panel
link before extraction because HOME=/home/... and its preserved link uses
/usr/home/.... Both resolve to the same application. The guard now compares
canonical directory targets without changing the link. Regression checks
cover an accepted alias, rejected different application and preserved directory.
Changes to this shared guard trigger all deploy targets. Final rollout pending.

## Verified live acceptance (2026-10-25)

- Dev API Deploy 40237535686 and frontends 40237130503: success at 72f82f92.
  Database: three synthetic identities, 60 public services, zero appointments.
  Desktop/mobile login renders the technical dashboard with no page errors,
  one heading and no horizontal overflow (1440/390px); secure HttpOnly session
  cookies use dev_ and dev-panel scope. Correct local sessions return 200;
  production/dev signatures and unprefixed production cookies return 401
  when deliberately crossed. Outbound services remain disabled/skipped.
- Canonical prepare 40237128081 succeeded; WWW type switched through the
  expanded MyDevil plugin with PHP files preserved. Running SHA/build checked.
  Homepage/contact hours equal public API; the only eligible booking timetable
  belongs to the owner, five non-break slots, all seven days match API.
  Landing catalog equals all 60 curated API services including prices/durations.
  Public privacy/policy/data-deletion routes return 200 without authentication.
- Production CORS now allows canonical/www/panel only; GitHub production secret
  synchronized using the safe env helper and a private backup. Health remained
  database/smtp/instagram ok. Development origins removed after isolation.
- Meta blackandwhite legal URLs saved and reloaded with canonical values.
  App Domain/Site URL updated from legacy LoginRadius and verified again after
  reopening settings. Existing Business Login redirect list was empty; no flow invented.
- MyDevil adapter 0.3.0: 150 typed operations, 84 local tests; live file fixture
  upload/download/copy/move/archive/restore/cleanup verified, cron metadata and
  15 numeric resource limits read. Native Codex reconnection confirms 17 tools,
  operations_catalog 150/ok and limits_get 15/ok. Destructive database/mail and
  interactive 2FA/password/Sieve operations were not tested against live data.
  Package excludes operator policy, config, plans and private secret resources.

## Final rollout and live acceptance (2026-10-26)

- PR #1517 merged as 328d362f. CI 40290290749 and production Deploy
  40290290857: success. The earlier symlink guard failure is resolved without
  replacing existing links or weakening rejection of unrelated targets.
- Development API 40290383892 and frontends 40291133185: success at the same
  immutable revision. Frontend attempt 1 stopped before upload in next/font's
  Google loader; attempt 2 passed unchanged source. No failed bundle activated.
- All six live applications report the expected SHA. Both frontend environments
  match running HTML build IDs, environment metadata and their own API URL.
  Production health: database/smtp/instagram ok. Development: database ok,
  smtp/instagram intentionally skipped. Three development gateways return 401
  without credentials and allow authenticated access with noindex.
- Canonical homepage and contact hours exactly match API hours. All 60 curated
  service IDs, prices, durations and price types match the landing catalog.
  Three legal routes and gallery return 200, canonical www redirect is 301.
  Gallery independently returned 12 Instagram items with fallback=false.
- Technical production dashboard: 1440px and 390px, zero page errors and zero
  horizontal overflow, exact release displayed. The read-only browser check
  used a five-minute session for the existing technical account; it did not
  change its password or create a persistent refresh session. Development
  password login passed at both sizes with dev_ Secure/HttpOnly session cookies.
- Native MyDevil plugin reconnection repeated: catalog 150/ok, resource limit
  records 15/ok; 84 local tests pass. Local source/package version is 0.3.0.
  Catalog coverage does not assert live testing of destructive operations.
- Claude review runner failed without completing a review; Codex review on the
  code change completed without findings. CI and both secret scanners passed.

## Controls and remaining owner acceptance

Legacy PHP files and the private pre-cutover archive remain preserved. Rollback
uses the documented PHP WWW type and retained public_html; frontend extraction
also retains a previous generation. Database backup indexing was verified, not
a full production restoration drill. Development contains synthetic identities
and public catalog only; no production clients were copied.

Owner still performs business UAT and confirms actual notification delivery to
an approved recipient before a wider launch or final future-Booksy migration.
These are separate from the completed environment/domain deployment.
