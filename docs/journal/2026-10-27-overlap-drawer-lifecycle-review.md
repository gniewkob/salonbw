# Manual-overlap drawer lifecycle review — fail-first UI regression

- **Date:** 2026-10-27 (Europe/Warsaw)
- **Agent:** ChatGPT GitHub source review
- **PR:** [#1543](https://github.com/gniewkob/salonbw/pull/1543) (Draft)
- **Regression-only:** [87fbc11e](https://github.com/gniewkob/salonbw/commit/87fbc11e9c30fdd27471f10e90f0d9cabcd35358)
- **Code fix:** [81d323a](https://github.com/gniewkob/salonbw/commit/81d323a7079437843eb6bb67c7d0c677591f57df)

## Finding

In `apps/panel/src/components/calendar/AppointmentDrawer.tsx`, the owner's
`forceOverlap` acknowledgement was keyed only by selected appointment fields.
Closing and reopening a still-mounted drawer with the *same* fields left the
previous approval active. The owner could click `Dodaj mimo to` without a
fresh conflict check. Backend role enforcement remained intact, so this was a
stale explicit-consent/UI lifecycle defect, not cross-role privilege escalation.

## Change

The conflict key now includes the drawer's `open` state. Closing and reopening
invalidates prior approval and pending best-effort conflict requests, including
when all employee, client, service and time fields remain identical. Existing
server-side `Role.Admin` gating and PostgreSQL staff-row serialization are
unchanged. A component test exercises close/reopen with unchanged fields,
checks the renewed conflict call and asserts there is no appointment POST.

## Validation

- **Fail-first confirmed:** [CI 40559136014](https://github.com/gniewkob/salonbw/actions/runs/40559136014), dashboard job `122383372315`: **1 failed, 458 passed**;
  exactly the added lifecycle test failed because the stale `Dodaj mimo to`
  button was present after reopening.
- **After fix, panel PASS:** [CI 40559470799](https://github.com/gniewkob/salonbw/actions/runs/40559470799),
  dashboard job `122384627721`: **102 suites, 459/459 tests PASS**.
- **At journal writing:** whole code-SHA CI not yet complete; do not claim
  final 9/9 CI acceptance until GitHub confirms backend + PostgreSQL.
- Existing integration [CI 40548822829](https://github.com/gniewkob/salonbw/actions/runs/40548822829)
  passed **9/9**, backend **521/521**, real PG booking **25/25**, frontend 458/458;
  it predates this regression/fix and cannot replace exact-HEAD validation.

## Other release-safety finding

Legacy `.github/workflows/e2e.yml` uses generic `MYDEVIL_DB_*` through an SSH
PostgreSQL tunnel, without a mandatory protected staging environment or an
asserted dev-only database name. Its resolved secret values were not inspected.
**Do not trigger it** for PR #1543 hosted UAT without proving isolation first.
Use the existing protected dev app/api with disabled outbound and synthetic
records. This is not evidence that the workflow actually accessed production.

## Rollout

No merge, deployment, live DB change, production action or Booksy operation.
Existing automatic MyDevil file backup confirmed by owner; isolated dev
PostgreSQL restore, application rollback and browser UAT still unverified.

## Follow-up

1. Confirm exact latest SHA CI and unskipped PostgreSQL statistics + booking runs.
2. Perform genuinely independent bounded code/security review of the combined diff.
3. One minimal Work/SSH task, *after* safety gates: verify dev DB/outbound,
   test isolated restore and application rollback, deploy approved SHA only to
   dev and conduct synthetic desktop/mobile UAT.
4. Separate owner approval for production; no Booksy switch/import/cleanup.
