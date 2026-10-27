# Integrated P0 development release: booking + statistics + manual overlap + frontend

- **Date:** 2026-10-27 (Europe/Warsaw)
- **Agent:** ChatGPT GitHub connector (without Work/SSH)
- **Branch:** `codex/dev-release-integrated-p0-20261027`
- **Parent:** docs-preflight #1541 `14150b0830fc4e71304d5b7d6f906a86e2887e83` (in turn parented by #1540)
- **Code commits:** `c41643be3fd65ec4a4864a76cf04ef8602c394bf`, `ccb4054037110f5f54fe4dd4f90044f98cb3207e`
- **Deployment:** **NONE**, no merge, no hosted writes or messages, no Booksy activity

## Finding

Preflight [#1541](https://github.com/gniewkob/salonbw/pull/1541) reproduced eight
cross-date retail statistics failures in backend PR #1540 while the deployed dev
statistics `4cc6faf3` passed. Booking/frontend corrections in [#1538](https://github.com/gniewkob/salonbw/pull/1538)
are independent of the backend stack; admin-only manual overlap in [#1524](https://github.com/gniewkob/salonbw/pull/1524)
was also missing from #1540. Parent CI was not a combined-release CI.

## Change

1. From currently deployed dev API `4cc6faf3`, carry forward exactly two
   dedicated statistics files: `statistics.service.ts` and
   `statistics.service.spec.ts`. Do not transplant adjacent Booksy cleanup scripts,
   UAT-plan changes or production cleanup operations.
2. From isolated #1538 HEAD `f5765c1d`, carry forward 14 narrowly scoped paths:
   12 frontend source/spec files, the CI addition for public landing booking Jest,
   and the original task journal. Blob identities for booking/register/finalization
   matched the deployed dev panel, verified using read-only GitHub fetches.
3. From #1524 HEAD `e0aa34f2`, carry forward the appointment drawer and its tests,
   controller and tests, DTO and journal. Integrate service authorization + audit
   and the service unit regression **surgically** into the newer #1540 booking
   service. The new backend service retains its same-transaction, employee-row
   lock for both normal/manual overlap; it never substitutes the older source.
4. In particular, do not import `apps/panel/src/pages/communication/[id].tsx`
   or `apps/panel/src/styles/salon-shell.css` from older dev-only branches:
   that would unintentionally bring unrelated Booksy UI removal. Those paths
   remain as in #1540 baseline.
5. Changes are additive and remain a **Draft-only integration**, not an approved
   release. No migrations, env, secret changes or destructive scripts added.

## Validation

- Confirmed branch source files and their Git blob SHA from isolated sources,
  the previous prod/dev release IDs and the dependency ancestry through the
  connected GitHub API.
- Maintained admin-only `forceOverlap` server-side authorization and the
  concurrency-safe staff lock; client self-service override is forbidden.
- **Pending:** exact integration HEAD CI, full frontend tests/build, cross-date
  statistics test and real PostgreSQL tests. Do not use earlier parent CI as
  evidence that this combined release works.
- **Pending:** independent code/security review, no hosted UAT attempted.

## Rollout

**NO-GO** for dev or production until exact-SHA CI, review, hosted dev isolation,
private snapshot and independent restore/rollback exercise are verified.
Production and Booksy remain untouched. Work/SSH resources are reserved for
hosted restore/rollback and authenticated browser UAT, not repo/CI analysis.

## Follow-up

Run CI on the new Draft PR, fix any failures on the same branch, independently
review the combined source, and only then commission one narrow Work operational
session for verified dev restore/rollback and synthetic browser UAT.
