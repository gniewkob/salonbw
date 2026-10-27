# Integrated development booking release

- Date: 2026-10-27, Codex
- Scope: development only; no production merge/deploy, Booksy switch/import or real messages/payments.
- Parent evidence: #1541, candidate #1540 `39ffbfa0df5f0bb175c803e2c205933f268de8b6`.
- Source references: statistics `4cc6faf37cd8d53db16be05e166b1c8a7c497885`, frontend #1538 `f5765c1df6fdd0a37c40344e32876f9287d38bfe`.

## Finding

The previous preflight proved that deploying #1540 alone would remove the
statistics correction already on dev. The three dev applications have different
SHAs. Dev landing already matches #1538's landing source; dev panel has the
older booking/price changes but lacks its later safe-login redirect guard.

## Change

- Retain the reviewed #1540 booking/calendar transaction stack.
- Restore the exact statistics implementation and tests from deployed `4cc6faf3`.
- Include #1538's 12 frontend source/test files, including safe local login
  redirects, service selection across registration and manual-price preservation.
- Preserve the two UI files already deployed on dev panel (communication detail
  and its stylesheet); this introduces no new Booksy behavior relative to dev.
- CI runs landing booking tests and creates a dedicated disposable statistics
  database so SQL cases cannot silently skip. No new runtime dependency/migration.
- Unrelated formatting caused by the required broad lint autofix was discarded;
  the existing reviewed backend sources/migrations remain unchanged.

## Validation

- Fail-first: 8 selected statistics regressions FAIL before implementation restore.
- After restore: 8/8 selected regressions PASS; source/test files exactly match deployed reference.
- Backend: 64 suites / **515 tests PASS**, no skips, UTC and Europe/Warsaw,
  with the dedicated local `statistics_synthetic` database including SQL cases.
- PostgreSQL 15 controlled business flows: **25/25 PASS**, no skips, both timezones.
- Panel: **102 suites / 456 tests PASS**. Landing: **28 suites / 93 tests PASS**.
- Required lint and typecheck PASS for backend/panel/landing; backend lint has
  151 existing warnings and zero errors. Backend and panel builds PASS.
- Environment resolver tests 2/2, ops workflow checks and workflow/doc consistency PASS.
- Landing development build requires private gateway configuration; it is supplied
  process-locally from existing host configuration, never printed or committed.
- Exact-SHA GitHub CI, hosted recovery proof, synthetic write UAT and rollback:
  pending at initial integration commit. Prior CI is not this candidate's CI.

## Hosted QA inventory / acceptance gates

| Flow / state | Required evidence |
|---|---|
| Desktop 1440 and mobile 390 service booking entry | Correct service retained; first registration click works without layout shift |
| Registration -> authenticated booking | Current client role, same service, real available slot and successful persistence |
| Delayed catalog + staff finalization | Explicit manual 40/0 price remains stable; no real payment |
| Admin manual overlap | Allowed manual conflict override; online conflict still rejects |
| Existing appointment vs timetable/day-off/block | 409 rejection and unchanged persisted state |
| Stale online slot | 409, no appointment/audit/notification side effect |
| Warsaw spring gap/autumn fold | UTC/local instants and blocked ranges; local real-PG evidence remains distinct from hosted evidence |
| Host recovery and release rollback | Private snapshot restored to isolated target, exact prior app versions return, then accepted candidate restored |
| Exploratory: hostile redirect | External/protocol-relative/auth-loop routes rejected |
| Exploratory: delayed catalog at zero price | Explicit zero is retained rather than reset to catalog price |

## Rollout

Not deployed at initial integration commit. Development-only deployment is gated
on this exact commit's successful CI and positive privacy/isolation/restore checks.
Production, source PRs and Booksy remain unchanged. No GO for production follows
from a successful dev run.

## Follow-up

Finish exact-SHA CI; verify current dev runtime/database/outbound gates, private
app+DB backups and isolated restore; deploy only development, run the above UAT,
exercise rollback and publish immutable evidence on #1537/#1530.
