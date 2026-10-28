# SalonBW — PostgreSQL UAT: manual overlap authorization and booking races

## Scope and safety

This change does **not** modify the live DEV applications, their runtime
configuration, API routes, database schema or booking behavior. It adds
PostgreSQL regression assertions on **disposable CI data only**. Production and
Booksy are out of scope.

The suite `backend/salonbw-backend/test/appointments-concurrency.pg-spec.ts`
uses `dropSchema: true`, so it must **never** connect to MyDevil. A new
fail-closed URL guard checks the entire local destination before TypeORM even
constructs the connection: PostgreSQL, loopback host, database name
`salonbw_test`, role `salonbw_test`, and no alternative host/DB query
parameters. Both database **and** role must match, since a localhost address
can forward over SSH to a real server. Retain the existing explicit CI
PostgreSQL service.

## Evidence and remaining acceptance gates

- The controller already denies `forceOverlap:true` for
  client/employee/receptionist in
  `src/appointments/appointments.controller.spec.ts`.
- The new real-PostgreSQL service test checks those same three actors and
  verifies **zero appointments written** for their denied requests.
- The new real-PostgreSQL service test verifies that two manual bookings for
  one employee and start time cannot proceed without explicit override
  **when global calendar overlaps are disabled** (NestJS
  `ConflictException`, status 409), while an admin can deliberately request
  `forceOverlap:true`. The test restores the prior policy in `finally`.
  When `allowOverlappingAppointments=true`, ordinary staff overlap is
  allowed by the existing salon-wide policy. Only **CI synthetic fixtures**
  are created.
- Existing PostgreSQL CI tests already cover concurrent online bookings
  (one succeeds; one rejects), schedule writer races, time-block and day-off
  conflicts, DST behavior, single-connection transaction revalidation, and
  cross-date statistics in a separate DB. These are regression evidence,
  not newly executed hosted DEV API write tests.
- Existing hosted DEV **browser** UAT PR #1545 confirmed the date and
  acknowledgement flow with a **mocked** appointment POST (1/1 PASS).

**Not satisfied by this PR:** real authenticated HTTP 403/409 on the deployed
DEV API, operator desktop/mobile full journey, provider delivery isolation
re-check, negative-path rollback/restore drill, security review and owner signoff.
Do not confuse source/CI verification with hosted DEV acceptance. Keep PROD
NO-GO and do not dispatch deployments.

### CI execution (not on MyDevil)

```sh
pnpm --filter salonbw-backend exec jest \
  --config test/jest-e2e.json \
  --runInBand \
  --testRegex 'appointments-concurrency\.pg-spec\.ts$'
```

Run only with the explicit, isolated `salonbw_test` PostgreSQL service and role.
The workflow `.github/workflows/ci.yml` already provides this configuration.
Never set `TEST_DATABASE_URL` to the hosted DEV or production database.
