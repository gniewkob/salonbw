# Dev release preflight — PR #1540 versus deployed dev

- **Date:** 2026-10-27 (Europe/Warsaw)
- **Agent:** Codex
- **Candidate:** `39ffbfa0df5f0bb175c803e2c205933f268de8b6`
- **PR:** #1540 (Draft); this documentation is a separate Draft follow-up.
- **Issues:** #1537 / #1530
- **Decision:** **NO-GO for deploying the candidate unchanged.** No deployment,
  restart, merge, hosted data write, Booksy operation or real message was performed.

## Finding

The candidate has green exact-SHA CI but is not a superset of deployed dev.
It would remove the existing cross-date retail deduction fix. This is a concrete
release-composition regression, not a failure of the booking transaction tests.

`git diff 4cc6faf37cd8d53db16be05e166b1c8a7c497885 39ffbfa0df5f0bb175c803e2c205933f268de8b6 -- backend/salonbw-backend/src/statistics/statistics.service.ts`
shows that deductions linked by appointment IDs become deductions restricted to
the report's sale-date range. An earlier/later sale can again inflate service
revenue when the appointment falls on another date.

Controlled verification reused the deployed commit's statistics spec in a
short-lived `statistics.preflight-regression.spec.ts`, selecting only
`cross-date retail deduction`. The temporary spec was removed after each run.

- Candidate source: **8 selected tests FAIL**; additive total 265 vs expected
  225, ranking/commission service revenue 225 vs expected 185 (synthetic values).
- Positive control using the exact deployed statistics source: **8 selected
  tests PASS**, UTC. Eight other tests are excluded by the name selector;
  these are not presented as executed or passing.
- Candidate failures reconfirmed explicitly under UTC and Europe/Warsaw.
- The deployed correction is `0ce3e5f5` plus timezone-independent test commit
  `4cc6faf3`. Neither change should be silently discarded during release assembly.

## Dependencies and exact refs

All five PRs were re-read live and remain open Drafts; their GitHub base is
`master` at `0b1732e5c6168d8f781735484de038f93bd87693`.
The descriptive backend stack is backed by Git ancestry, even though the PR
base fields all name master:

| PR | Exact HEAD | Relationship / disposition |
|---|---|---|
| #1535 | `2da1ddd73c667c954ce514f139a49a4444be0617` | Ancestor of #1540; do not deploy separately |
| #1536 | `5e50ac02720285dd768dacda8a09d1ffc6d48f68` | Ancestor of #1540; Warsaw/DST |
| #1539 | `5c53b8867dae41b628b85272a83153c704bc7acf` | Ancestor of #1540; block writers |
| #1540 | `39ffbfa0df5f0bb175c803e2c205933f268de8b6` | Backend candidate; loses deployed statistics fix |
| #1538 | `f5765c1df6fdd0a37c40344e32876f9287d38bfe` | Separate frontend patch, NOT an ancestor of #1540 |

#1538 carries registration return/service continuity and staff price changes
across 12 frontend files (implementation plus tests). Do not claim that deploying
#1540 also validates or ships those changes. Its CI `40480342227` is success;
the separate failed Claude review run is not approval. No combined release SHA
containing the deployed statistics fix, booking stack and #1538 was built,
reviewed, tested or deployed in this preflight.

## Infrastructure and privacy controls (live, read-only)

SSH access worked. Sensitive configuration was processed on the host; only
boolean comparisons, public domains, release SHAs and aggregate counts were
returned. No secrets, account addresses, password hashes, customer records or
production logs were printed. Existing dirty checkouts were preserved.

- Six canonical domain symlinks resolve to six distinct expected application
  roots. Dev targets: `salonbw`, `panelbw_dev`, `api_salonbw_dev`; production:
  `salonbw_prod`, `panelbw`, `api_salonbw` under `apps/nodejs/`.
- Parsed dev and production DATABASE_URL values have different database names,
  roles and passwords. The connected dev database/role match the dev URL and
  DEV_DATABASE_NAME startup guard. No production table data was read.
- Dev role metadata reports CONNECT on the production database. A subsequent
  read-only production catalog/privilege probe with that role returns `42501`.
  This is bounded denial evidence, not a complete database privilege audit;
  do not conflate CONNECT with table access or claim comprehensive isolation.
- Dev JWT/access and refresh signing keys differ from production. Dev uses
  `dev_` cookies scoped to `dev-panel.salon-bw.pl`, and dev frontend proxies
  point to `https://dev-api.salon-bw.pl`.
- Dev APP_ENV is development, OUTBOUND_DELIVERY_ENABLED=false and
  SMSAPI_ENABLED=false. Provider credentials/DSNs are absent in the inspected
  dev API env. Source guards disable email/SMS/push/WhatsApp in development.
  No external payment provider module/SDK was identified in the inspected
  backend dependency/module configuration; payment-method bookkeeping is not
  evidence of an external charge. No payment was attempted. No network-level
  egress firewall or complete inherited process environment was audited.
- Dev contains **5 identities, 2 appointments**. All 5 emails are under reserved
  `.test`/`.invalid`/example domains; zero nonempty phones/addresses or birth
  dates. The initial `.test`-only check flagged one address; the reserved-domain
  aggregate resolved it without disclosing the address. These checks support
  synthetic identity use, not a field-by-field certification of every free-text
  value in every table. No live data was copied, imported, cleaned or anonymized.
- Dev landing/panel return 401 without the access gate and 200 with the existing
  gate supplied privately on the host. Dev public service catalog returns 200
  with the gate. This is access/read evidence, not authenticated app UAT.
- Deployment resolver and workflow match master. Staging maps to dev-only
  destinations, immutable source resolution and exact-SHA CI gate. No migration,
  dependency manifest or lockfile difference exists between deployed dev API
  `4cc6faf3` and candidate `39ffbfa0`; application source nevertheless diverges.

## Runtime versions (2026-10-27)

| Application | Observed exact release | Evidence |
|---|---|---|
| Dev API | `4cc6faf37cd8d53db16be05e166b1c8a7c497885` | HTTP 200 health/header and runtime env agree |
| Dev landing | `54671baf1a24445c2b0f22eb94dc1616046a7e84` | Private runtime metadata; gate HTTP checked |
| Dev panel | `1e03005654b09b44dcbed222e6579b7b6d172000` | Private runtime metadata; gate HTTP checked |
| Production API | `328d362f101490b0e4b279c3af74eaae85968239` | HTTP 200 health/header and runtime env agree |
| Production landing/panel | `328d362f101490b0e4b279c3af74eaae85968239` | Private runtime metadata; HTTP 200 each |

Dev health: DB ok, SMTP/Instagram skipped. Production health: DB/SMTP/Instagram
ok. Frontend HTTP responses did not expose a release header; do not relabel
runtime metadata as frontend artifact attestation. No production state changed.

## Validation and UAT matrix

[Exact candidate CI 40500443961](https://github.com/gniewkob/salonbw/actions/runs/40500443961):
9/9 jobs success, run head_sha exactly equals candidate. Backend job
`122176740941` logs independently confirm **64 suites / 505 tests**, and real
PostgreSQL **25/25**, no skipped backend tests. Three frontend jobs succeeded
path selection while skipping build/tests; this is not combined frontend proof.

A fresh, exclusively owned PostgreSQL 15 container was bound only to
`127.0.0.1:62440`. No existing local/shared DB was used. Candidate verification:
backend **505/505 in UTC**, PostgreSQL business flows **25/25 in UTC** and
**25/25 in Europe/Warsaw**, no skipped tests in those runs. Notification
collaborators in PG flows are stubs; this does not certify provider delivery.

| Required flow | Evidence achieved | Hosted dev UAT |
|---|---|---|
| Registration, service continuity, online booking UI | #1538 separate, not included in candidate | NOT RUN |
| Pricing / delayed catalog / manual staff price | #1538 separate; no combined candidate | NOT RUN |
| Online booking and duplicate/stale rejection | Local real PG business-flow tests PASS | NOT RUN |
| Admin deliberate overlap create/reschedule | Local shared-lock tests PASS | NOT RUN |
| Timetable/day-off vs existing booking; 409 rollback | Local controlled PG interleavings PASS | NOT RUN |
| Europe/Warsaw spring gap / autumn fold | Three DB-backed cases within 25/25 PASS, both TZs | NOT RUN |
| Release rollback | No hosted release attempted; exact prior versions recorded | NOT RUN |
| DB restoration | Disposable synthetic local dump/restore PASS | Hosted restore NOT RUN |

## Backups / rollback limits

Host metadata identified three database dumps, one classified as dev/synthetic.
That dev dump is 1,427,706 bytes, modified 2026-10-26T11:42:54Z; `pg_restore
--list` reads **838 TOC entries**. This proves archive indexing only. No hosted
dump was transferred or restored; no current application snapshot or verified
hosted rollback artifact was prepared because release selection failed first.

Local synthetic restore drill: PostgreSQL `pg_dump -Fc` -> separate fresh DB ->
`pg_restore --no-owner --no-acl --exit-on-error`, all exit 0. Source/restored
counts match: users 45, appointments 5, services 82, migrations 104. These are
fixtures created by tests, not hosted salon counts. This is a real local
restoration exercise, not proof of hosted RPO/RTO or application rollback.
The disposable container and its local data are removed after verification.

## Change

Documentation only: this journal and the current P0 state. PR #1540 source and
all existing dirty worktrees remain unchanged. Publish through a separate Draft
PR based on #1540's branch so the two documentation files are reviewable alone.

## Rollout / decision

**NO-GO: do not deploy `39ffbfa0` unchanged, and no production release.**
No deployment run was dispatched. There is no new hosted UAT result or rollback
pass. Local booking tests pass; release composition and hosted recovery/UAT
remain open. Keep #1537 and #1530 open, keep all functional PRs Draft.

## Follow-up

1. Implementer: assemble a dev release retaining the deployed cross-date
   correction (`0ce3e5f5`/`4cc6faf3`) plus #1540, and reconcile #1538 for the
   requested end-to-end registration/pricing UAT. Preserve Booksy behavior.
2. Reviewer/CI: review the incremental integration and exact immutable SHA;
   execute frontend tests/builds, backend, PG concurrency/DST and cross-date
   unit/SQL tests under UTC and Europe/Warsaw. Do not use parent CI as release CI.
3. Operator: finish field-scoped synthetic-data/privilege checks, take private
   current dev app+DB snapshots and test restore in an approved isolated target;
   verify rollback artifacts/commands before dispatching development-only deploy.
4. Operator/UAT: API first, then reconciled frontend SHA; run required hosted
   desktop/mobile flows, 409/no-audit/no-notification cases and release rollback;
   verify dev/prod versions and outbound gates again. Production, merges, real
   messages/payments, Booksy switching/import and live cleanup remain excluded.
