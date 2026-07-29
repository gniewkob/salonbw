# Synthetic Schedule Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zapewnić, że wszystkie syntetyczne wizyty powstają wyłącznie w godzinach aktywnego grafiku Oli, a dzień wolny nie zawiera wizyt `in_progress`.

**Architecture:** Nowy czysty moduł grafiku znormalizuje rekordy TypeORM do lokalnych przedziałów pracy, a generator przydzieli do nich 30 deterministycznych wizyt. Osobny walidator sprawdzi manifest przed mutacją i rzeczywiste rekordy po insercie; adapter PostgreSQL odczyta grafik, a orkiestrator zachowa dotychczasową granicę transakcji i bramki backupu.

**Tech Stack:** TypeScript 5.9, Node.js 22+, NestJS, TypeORM 0.3, PostgreSQL, date-fns, Jest 30, pnpm.

## Global Constraints

- Jedynym źródłem prawdy są regularne godziny, przerwy i wyjątki aktywnego grafiku Oli.
- Strefa salonu to `Europe/Warsaw`; daty grafiku mają format `YYYY-MM-DD`, a zakresy są liczone w minutach od lokalnej północy.
- Horyzont obejmuje 35 dni przed `anchorDate` i 60 dni po niej.
- Brak obowiązującego grafiku, błędny wyjątek lub niewystarczająca pojemność kończą operację bez mutacji.
- Nie używać godzin oddziału ani zakodowanych dni tygodnia jako fallbacku.
- `in_progress` jest dozwolone tylko w dniu uruchomienia, gdy chwila uruchomienia przypada w godzinach pracy; w przeciwnym razie zmienia się na przyszłe `confirmed`.
- Wszystkie wizyty muszą mieścić się w jednym przedziale i nie mogą się nakładać.
- Ten sam `anchorDate`, grafik, owner i lista usług muszą dać identyczny dataset.
- `plan` i `verify` pozostają odczytowe; `apply` zachowuje jedną transakcję i rollback przy każdym błędzie.
- Wdrożenie kodu nie uruchamia resetu. Produkcyjne `apply` wymaga osobnej zgody, świeżego `pg_dump` i dokładnie jednego wykonania.
- Nie odczytywać eksportów Versum ani nie logować PII, sekretów lub surowej treści grafiku.

---

## File map

- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
  — publiczne typy grafiku, kontekstu planowania i raportów.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.ts`
  — nowy, czysty resolver tygodniowych slotów, przerw i wyjątków.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.spec.ts`
  — testy resolvera, w tym niedziela, przerwy i wyjątki.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts`
  — deterministyczna alokacja wizyt do znormalizowanych przedziałów.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.spec.ts`
  — testy dnia wolnego, konwersji statusu, pojemności i deterministyczności.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.ts`
  — nowy niezależny walidator gotowych wizyt.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.spec.ts`
  — testy ręcznie uszkodzonych manifestów.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts`
  — odczyt kont, usług, grafików i minimalnych danych wizyt z PostgreSQL.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.spec.ts`
  — testy read-only SQL, wyboru ownera oraz poweryfikacyjnych blockerów.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts`
  — nowa kolejność: kontekst → grafik → dataset → walidacja → plan/transakcja.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.spec.ts`
  — testy kolejności, braku mutacji i rollbacku.
- `backend/salonbw-backend/scripts/synthetic-prelive-data.ts`
  — spięcie zależności i bezpieczne podsumowanie grafiku.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts`
  — test publicznego JSON bez PII i surowych godzin.
- `docs/SYNTHETIC_PRELIVE_DATA.md`
  — instrukcja odczytowego planu i bramki późniejszego `apply`.
- `docs/PROJECT_STATE.md` oraz nowy wpis w `docs/journal/`
  — handoff po implementacji i po osobnym rolloutcie danych.

---

### Task 1: Czysty model i resolver grafiku

**Files:**
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts:16-20`
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.ts`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.spec.ts`

**Interfaces:**
- Consumes:
  - `anchorDate: Date`
  - `SyntheticTimetableRecord[]`
  - `SyntheticTimetableExceptionRecord[]`
- Produces:
  - `SyntheticWorkingRange`
  - `SyntheticWorkingDay`
  - `SyntheticScheduleSummary`
  - `warsawDateKey(value): string`
  - `warsawMinuteOfDay(value): number`
  - `warsawDateAtMinute(date, minute): Date`
  - `resolveSyntheticWorkingDays(input): SyntheticWorkingDay[]`
  - `summarizeSyntheticSchedule(days): Omit<SyntheticScheduleSummary, 'convertedInProgress'>`

- [ ] **Step 1: Add the public types and failing resolver tests**

Add to `synthetic-data.types.ts`:

```ts
export interface SyntheticWorkingRange {
    startMinute: number;
    endMinute: number;
}

export interface SyntheticWorkingDay {
    date: string;
    ranges: SyntheticWorkingRange[];
}

export interface SyntheticScheduleSummary {
    rangeStart: string;
    rangeEnd: string;
    workingDays: number;
    closedDays: number;
    convertedInProgress: number;
}

export interface SyntheticTimetableRecord {
    id: number;
    validFrom: string | Date;
    validTo: string | Date | null;
    slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isBreak: boolean;
    }>;
}

export interface SyntheticTimetableExceptionRecord {
    timetableId: number;
    date: string | Date;
    type: string;
    customStartTime: string | null;
    customEndTime: string | null;
}
```

Create tests with one Monday `09:00–17:00`, break `12:00–13:00`, a
`day_off`, `custom_hours=10:00–14:00`, and a scheduled Sunday. Assert:

```ts
expect(byDate.get('2026-07-27')?.ranges).toEqual([
    { startMinute: 540, endMinute: 720 },
    { startMinute: 780, endMinute: 1020 },
]);
expect(byDate.get('2026-07-29')?.ranges).toEqual([]);
expect(byDate.get('2026-07-30')?.ranges).toEqual([
    { startMinute: 600, endMinute: 840 },
]);
expect(byDate.get('2026-08-02')?.ranges).toEqual([
    { startMinute: 600, endMinute: 900 },
]);
```

- [ ] **Step 2: Run the new suite and verify RED**

Run:

```bash
pnpm --filter salonbw-backend test synthetic-data.schedule.spec.ts --runInBand
```

Expected: FAIL because `synthetic-data.schedule.ts` and its exports do not
exist.

- [ ] **Step 3: Implement date-safe normalization**

Export:

```ts
export const SYNTHETIC_PAST_DAYS = 35;
export const SYNTHETIC_FUTURE_DAYS = 60;

export function resolveSyntheticWorkingDays(input: {
    anchorDate: Date;
    timetables: SyntheticTimetableRecord[];
    exceptions: SyntheticTimetableExceptionRecord[];
}): SyntheticWorkingDay[];
```

Implementation requirements:

```ts
const SALON_TIME_ZONE = 'Europe/Warsaw';
const CLOSED_EXCEPTION_TYPES = new Set([
    'day_off',
    'holiday',
    'vacation',
    'sick_leave',
    'training',
    'other',
]);
```

- iterate local calendar dates from `-35` through `+60`, inclusive;
- for each date choose the applicable active record with the greatest
  `validFrom`, breaking ties by greater `id`;
- throw `SYNTHETIC_SCHEDULE_MISSING:<date>` if no timetable applies;
- reject more than one exception for the selected timetable and date with
  `SYNTHETIC_SCHEDULE_EXCEPTION_AMBIGUOUS`;
- for `custom_hours`, require both valid times and `end > start`;
- for closed exceptions return `ranges: []`;
- otherwise merge work ranges that overlap or touch and subtract every break;
- reject day-of-week outside `0..6`, malformed time, zero-length range and
  unknown exception type with a stable `SYNTHETIC_SCHEDULE_*` code.

Use one `Intl.DateTimeFormat` helper with `timeZone: SALON_TIME_ZONE` for date
keys, weekday and minute extraction. `warsawDateAtMinute` converts a Warsaw
wall-clock date to an instant by iteratively correcting a UTC guess against
`formatToParts`; do not assume a fixed `+01:00`/`+02:00` offset and do not add
a timezone dependency.

- [ ] **Step 4: Add malformed-input and summary assertions**

Add tests proving:

```ts
expect(() => resolveSyntheticWorkingDays(noTimetable)).toThrow(
    'SYNTHETIC_SCHEDULE_MISSING',
);
expect(() => resolveSyntheticWorkingDays(badCustomHours)).toThrow(
    'SYNTHETIC_SCHEDULE_CUSTOM_HOURS_INVALID',
);
expect(() => resolveSyntheticWorkingDays(duplicateException)).toThrow(
    'SYNTHETIC_SCHEDULE_EXCEPTION_AMBIGUOUS',
);
expect(summarizeSyntheticSchedule(days)).toEqual({
    rangeStart: '2026-06-24',
    rangeEnd: '2026-09-27',
    workingDays: expect.any(Number),
    closedDays: expect.any(Number),
});
```

- assert a horizon spanning the March DST transition still has exactly 96
  distinct Warsaw date keys;
- round-trip `warsawDateAtMinute(date, minute)` through `warsawDateKey` and
  `warsawMinuteOfDay`.

- [ ] **Step 5: Run GREEN and commit**

```bash
pnpm --filter salonbw-backend test synthetic-data.schedule.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.schedule.spec.ts
git commit -m "feat(backend): resolve synthetic employee schedule"
```

---

### Task 2: Deterministyczna alokacja wizyt w grafiku

**Files:**
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts:16-20,82-101`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts:20-106,161-181`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.spec.ts:3-122`

**Interfaces:**
- Consumes from Task 1: `SyntheticWorkingDay[]`.
- Produces:
  - `DatasetInput.workingDays`
  - `SyntheticDataset.generationSummary.convertedInProgress`
  - schedule-aware `generateSyntheticDataset(input): SyntheticDataset`

- [ ] **Step 1: Replace the fixture input with explicit working days**

Add:

```ts
export interface SyntheticGenerationSummary {
    convertedInProgress: number;
}

export interface DatasetInput {
    anchorDate: Date;
    ownerUserId: number;
    serviceIds: number[];
    workingDays: SyntheticWorkingDay[];
}
```

In the dataset test, create a helper returning all 96 horizon days with
`09:00–17:00`, then override `2026-07-29` with `ranges: []`. Add:

```ts
it('moves every in-progress visit off a closed anchor day', () => {
    const data = generateSyntheticDataset(closedWednesdayInput);
    expect(
        data.appointments.some(
            (visit) => warsawDateKey(visit.startTime) === '2026-07-29',
        ),
    ).toBe(false);
    expect(
        data.appointments.filter((visit) => visit.status === 'in_progress'),
    ).toHaveLength(0);
    expect(data.generationSummary.convertedInProgress).toBe(4);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

```bash
pnpm --filter salonbw-backend test synthetic-data.dataset.spec.ts --runInBand
```

Expected: FAIL because `workingDays` and `generationSummary` are not handled.

- [ ] **Step 3: Replace arithmetic offsets with candidate allocation**

Delete `appointmentDayOffset`. Build non-overlapping 30-minute-grid candidates
from `workingDays`:

```ts
interface AppointmentDraft {
    key: string;
    status: SyntheticAppointmentStatus;
    durationMinutes: 30 | 60 | 90;
    preferredOffset: number;
}

function allocateAppointment(
    draft: AppointmentDraft,
    candidates: SyntheticWorkingDay[],
    occupied: Array<{ start: number; end: number }>,
): { startTime: Date; endTime: Date } | null;
```

Allocation order:

1. past statuses use completed slots before `anchorDate`, nearest preferred
   offset first;
2. `in_progress` tries the anchor day only when the anchor instant is inside
   one of its work ranges;
3. failed `in_progress` changes to `confirmed` and joins the future pool;
4. future statuses use the earliest fitting slot after `anchorDate`;
5. candidates are sorted by local date, start minute and draft key;
6. a candidate is accepted only if its full duration fits and does not overlap
   `occupied`;
7. throw `SYNTHETIC_SCHEDULE_CAPACITY` if any draft cannot be allocated.

Keep client/service/price selection unchanged. Add:

```ts
generationSummary: {
    convertedInProgress,
},
```

- [ ] **Step 4: Cover workday, break, Sunday, capacity and determinism**

Add exact assertions that:

- an anchor inside `09:00–17:00` preserves at least one `in_progress`;
- no interval crosses `12:00–13:00`;
- a Sunday explicitly present in `workingDays` can receive a visit;
- 96 closed days throw `SYNTHETIC_SCHEDULE_CAPACITY`;
- two calls with cloned inputs are deeply equal;
- sorting all owner intervals yields `current.endTime <= next.startTime`.

- [ ] **Step 5: Run GREEN and commit**

```bash
pnpm --filter salonbw-backend test synthetic-data.dataset.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.spec.ts
git commit -m "feat(backend): align synthetic visits with schedule"
```

---

### Task 3: Niezależny walidator terminów

**Files:**
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.ts`
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.spec.ts`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts:40-59,145-157`

**Interfaces:**
- Consumes:
  - `SyntheticAppointmentWindow[]`
  - `SyntheticWorkingDay[]`
  - `ownerUserId`
  - `anchorDate`
- Produces:
  - `collectSyntheticScheduleViolations(input): string[]`
  - `assertSyntheticScheduleValid(input): void`

- [ ] **Step 1: Define the minimal validation DTO and failing tests**

```ts
export interface SyntheticAppointmentWindow {
    key: string;
    employeeId: number;
    status: SyntheticAppointmentStatus;
    startTime: Date;
    endTime: Date;
}
```

Create one valid fixture and mutate it separately to test:

```ts
expect(collectSyntheticScheduleViolations(outsideHours)).toContain(
    'appointment-01:SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
);
expect(collectSyntheticScheduleViolations(duringBreak)).toContain(
    'appointment-01:SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
);
expect(collectSyntheticScheduleViolations(overlap)).toContain(
    'appointment-02:SYNTHETIC_APPOINTMENT_OVERLAP',
);
expect(collectSyntheticScheduleViolations(wrongEmployee)).toContain(
    'appointment-01:SYNTHETIC_APPOINTMENT_EMPLOYEE',
);
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter salonbw-backend test synthetic-data.validation.spec.ts --runInBand
```

Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement validation without allocator imports**

`synthetic-data.validation.ts` may import types and the Warsaw date/time
conversion helpers from `synthetic-data.schedule.ts`. It must not import
`synthetic-data.dataset.ts` or reuse its candidate-selection functions.

For each appointment:

- require finite dates and `start < end`;
- require `employeeId === ownerUserId`;
- locate exactly one day by the appointment's Warsaw date key;
- require start and end inside one range (`endMinute` is exclusive);
- validate temporal status:
  - historical statuses end before `anchorDate`;
  - future statuses start after `anchorDate`;
  - `in_progress` uses the anchor date and requires `anchorDate` inside a work
    range;
- after sorting by start, report overlap on the later appointment key.

`assertSyntheticScheduleValid` throws one message joined from stable violation
codes; it must not include e-mail, customer name or raw timetable rows.

- [ ] **Step 4: Add missing-day and status-boundary tests**

Assert:

```ts
expect(collectSyntheticScheduleViolations(missingDay)).toContain(
    'appointment-01:SYNTHETIC_APPOINTMENT_SCHEDULE_DAY_MISSING',
);
expect(collectSyntheticScheduleViolations(pastConfirmed)).toContain(
    'appointment-01:SYNTHETIC_APPOINTMENT_STATUS_TIME',
);
expect(() => assertSyntheticScheduleValid(validInput)).not.toThrow();
```

- [ ] **Step 5: Run GREEN and commit**

```bash
pnpm --filter salonbw-backend test synthetic-data.validation.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.validation.spec.ts
git commit -m "feat(backend): validate synthetic visit schedule"
```

---

### Task 4: Odczyt grafiku i poweryfikacyjna kontrola bazy

**Files:**
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts:134-157`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts:180-269,322-388`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.spec.ts:1-104`

**Interfaces:**
- Consumes from Tasks 1 and 3:
  - `resolveSyntheticWorkingDays`
  - `assertSyntheticScheduleValid`
- Produces:
  - `loadSyntheticBaseContext(queryRunner, protectedEmails)`
  - `loadSyntheticWorkingDays(queryRunner, ownerUserId, anchorDate)`
  - `buildSyntheticPlan(queryRunner, context, dataset, scheduleSummary)`
  - schedule-aware `verifySyntheticState(...)`

- [ ] **Step 1: Write failing read-only context and schedule tests**

Define:

```ts
export interface SyntheticBaseContext {
    protectedUserIds: number[];
    protectedAdminPresent: boolean;
    protectedCiClientPresent: boolean;
    ownerUserId: number | null;
    serviceIds: number[];
    blockers: string[];
}
```

Mock `QueryRunner.query` for protected users, services, timetable/slot rows and
exception rows. Assert:

```ts
expect(context.ownerUserId).toBe(7);
expect(workingDays.find((day) => day.date === '2026-07-29')?.ranges).toEqual(
    [],
);
expect(
    (runner.query as jest.Mock).mock.calls.every(([sql]) =>
        /^(SELECT|WITH)/.test(String(sql).trim().toUpperCase()),
    ),
).toBe(true);
```

- [ ] **Step 2: Run store tests and verify RED**

```bash
pnpm --filter salonbw-backend test synthetic-data.store.spec.ts --runInBand
```

Expected: FAIL because the new store functions do not exist.

- [ ] **Step 3: Split base context from plan counts**

Move the first two queries from `buildSyntheticPlan` into
`loadSyntheticBaseContext`. Keep protected identities out of returned data.
Change plan construction to:

```ts
export interface SyntheticPlan {
    // preserve the current account, service and count fields
    scheduleSummary?: SyntheticScheduleSummary;
}

export async function buildSyntheticPlan(
    queryRunner: QueryRunner,
    context: SyntheticBaseContext,
    dataset: SyntheticDataset | null,
    scheduleSummary?: SyntheticScheduleSummary,
): Promise<SyntheticPlan>;
```

For `dataset === null` (cleanup), return zero `createCounts` and omit
`scheduleSummary`. Preserve current delete counts and account blockers.

- [ ] **Step 4: Load overlapping timetables and exceptions**

`loadSyntheticWorkingDays` performs exactly two read-only queries:

```sql
SELECT t."id", t."validFrom", t."validTo",
       s."dayOfWeek", s."startTime", s."endTime", s."isBreak"
FROM "timetables" t
LEFT JOIN "timetable_slots" s ON s."timetableId" = t."id"
WHERE t."employeeId" = $1
  AND t."isActive" = true
  AND t."validFrom" <= $3
  AND (t."validTo" IS NULL OR t."validTo" >= $2)
ORDER BY t."validFrom" DESC, t."id" DESC, s."id" ASC
```

```sql
SELECT e."timetableId", e."date", e."type",
       e."customStartTime", e."customEndTime"
FROM "timetable_exceptions" e
WHERE e."timetableId" = ANY($1::int[])
  AND e."date" BETWEEN $2 AND $3
ORDER BY e."date", e."id"
```

Group flat slot rows by timetable ID, pass them to
`resolveSyntheticWorkingDays`, and never return timetable name, description,
exception title or reason. Do not add an `isPending` filter: the existing
`CalendarService.getEmployeeDayRanges` applies the matching exception without
that filter, and this task must preserve the current production contract.

- [ ] **Step 5: Extend database verification with actual appointment windows**

Extend `verifySyntheticState` parameters:

```ts
verifySyntheticState(
    queryRunner,
    expected,
    protectedUserIds,
    scheduleContext?: {
        ownerUserId: number;
        anchorDate: Date;
        workingDays: SyntheticWorkingDay[];
    },
): Promise<SyntheticVerificationReport>
```

Add one query selecting only synthetic appointment `id`, `employeeId`,
`status`, `startTime`, `endTime`. Convert `id` to key `db-appointment-<id>`,
call `collectSyntheticScheduleViolations`, append returned codes to
`blockers`, and add `scheduleViolations: number` to
`SyntheticVerificationReport`. Do not select client e-mail or name.

The optional context is accepted only when `expected.appointments === 0`,
which is the cleanup verification path. Throw
`SYNTHETIC_SCHEDULE_CONTEXT_REQUIRED` for a non-zero expected appointment
count without schedule context.

- [ ] **Step 6: Run GREEN and commit**

```bash
pnpm --filter salonbw-backend test synthetic-data.store.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.spec.ts
git commit -m "feat(backend): load and verify synthetic schedule"
```

---

### Task 5: Orkiestracja przed transakcją

**Files:**
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts:1-180`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.spec.ts:1-190`
- Modify: `backend/salonbw-backend/scripts/synthetic-prelive-data.ts:7-145`

**Interfaces:**
- Consumes all interfaces from Tasks 1–4.
- Produces:
  - schedule-aware `runSyntheticDataCommand`
  - unchanged public command modes
  - no database mutation before schedule validation.

- [ ] **Step 1: Update the service harness and write failing order tests**

Replace `buildSyntheticPlan`-only dependencies with:

```ts
loadSyntheticBaseContext(queryRunner, protectedEmails);
loadSyntheticWorkingDays(queryRunner, ownerUserId, anchorDate);
generateDataset({ anchorDate, ownerUserId, serviceIds, workingDays });
assertSyntheticScheduleValid({
    appointments: dataset.appointments,
    workingDays,
    ownerUserId,
    anchorDate,
});
buildSyntheticPlan(queryRunner, context, dataset, scheduleSummary);
```

Add a test where `assertSyntheticScheduleValid` throws and assert:

```ts
expect(queryRunner.startTransaction).not.toHaveBeenCalled();
expect(deps.resetOperationalData).not.toHaveBeenCalled();
expect(deps.insertSyntheticDataset).not.toHaveBeenCalled();
```

Add a cleanup test asserting that neither `loadSyntheticWorkingDays` nor
`generateDataset` is called.

Add an apply test where post-insert `verifySyntheticState` reports a schedule
blocker and assert `rollbackTransaction` is called once while
`commitTransaction` is never called.

- [ ] **Step 2: Run service tests and verify RED**

```bash
pnpm --filter salonbw-backend test synthetic-data.service.spec.ts --runInBand
```

Expected: FAIL on the old dependency contract and old call order.

- [ ] **Step 3: Implement the new orchestration**

After `queryRunner.connect()`:

```ts
const context = await dependencies.loadSyntheticBaseContext(
    queryRunner,
    config.protectedEmails,
);
dependencies.assertProtectedAccounts(context);

if (config.mode === 'cleanup') {
    // build count-only plan, schema check, transaction, cleanup, verify counts
}

const ownerUserId = context.ownerUserId;
if (!ownerUserId) throw new Error('Protected owner account is missing');
const workingDays = await dependencies.loadSyntheticWorkingDays(
    queryRunner,
    ownerUserId,
    dependencies.anchorDate,
);
const dataset = dependencies.generateDataset({
    anchorDate: dependencies.anchorDate,
    ownerUserId,
    serviceIds: context.serviceIds,
    workingDays,
});
dependencies.assertSyntheticScheduleValid({
    appointments: dataset.appointments,
    workingDays,
    ownerUserId,
    anchorDate: dependencies.anchorDate,
});
```

Build `scheduleSummary` from the resolver summary plus
`dataset.generationSummary.convertedInProgress`, then build the plan.

For `apply`, run the same validator before `startTransaction`; after insert,
call schedule-aware `verifySyntheticState` inside the transaction. For
`verify`, perform database schedule verification without a transaction.

- [ ] **Step 4: Wire real dependencies in the CLI**

Import and pass:

```ts
loadSyntheticBaseContext,
loadSyntheticWorkingDays,
assertSyntheticScheduleValid,
summarizeSyntheticSchedule,
```

Remove the obsolete dummy manifest path using `ownerUserId: 1`.

- [ ] **Step 5: Run service, store and dataset suites**

```bash
pnpm --filter salonbw-backend test \
  synthetic-data.service.spec.ts \
  synthetic-data.store.spec.ts \
  synthetic-data.dataset.spec.ts \
  synthetic-data.schedule.spec.ts \
  synthetic-data.validation.spec.ts \
  --runInBand
```

Expected: all focused suites PASS and the apply test still proves commit only
after post-insert verification.

- [ ] **Step 6: Commit**

```bash
git add backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.spec.ts \
  backend/salonbw-backend/scripts/synthetic-prelive-data.ts
git commit -m "refactor(backend): validate synthetic schedule before writes"
```

---

### Task 6: Bezpieczny raport, dokumentacja i pełna bramka

**Files:**
- Modify: `backend/salonbw-backend/scripts/synthetic-prelive-data.ts:129-145`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts:1-92`
- Modify: `docs/SYNTHETIC_PRELIVE_DATA.md`
- Modify: `docs/PROJECT_STATE.md`
- Create: `docs/journal/2026-07-29-synthetic-schedule-implementation.md`

**Interfaces:**
- Consumes: `SyntheticPlan.scheduleSummary` and
  `SyntheticVerificationReport.scheduleViolations`.
- Produces: operator-visible, zanonimizowany raport oraz kompletny handoff.

- [ ] **Step 1: Write the failing CLI redaction test**

Extend the harness plan with:

```ts
scheduleSummary: {
    rangeStart: '2026-06-24',
    rangeEnd: '2026-09-27',
    workingDays: 54,
    closedDays: 42,
    convertedInProgress: 4,
},
```

Assert output contains these aggregate values but does not contain:

```ts
expect(serialized).not.toMatch(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/);
expect(serialized).not.toContain('owner@example.invalid');
expect(serialized).not.toContain('timetable');
```

- [ ] **Step 2: Run the CLI test and verify RED**

```bash
pnpm --filter salonbw-backend test synthetic-prelive-data.cli.spec.ts --runInBand
```

Expected: FAIL because `publicReport` does not expose `scheduleSummary`.

- [ ] **Step 3: Add aggregate-only reporting and operator instructions**

Expose only:

```ts
scheduleSummary: report.plan.scheduleSummary,
scheduleViolations: report.verification?.scheduleViolations,
```

Update `docs/SYNTHETIC_PRELIVE_DATA.md` with:

- grafik Oli as the sole source of truth;
- meaning of `convertedInProgress`;
- commands for read-only `pnpm synthetic:data:plan` and
  `pnpm synthetic:data:verify`;
- explicit statement that deploy never runs `apply`;
- production order: approval → fresh `pg_dump` → one `apply` → `verify` →
  `/healthz` → calendar check → database password rotation.

- [ ] **Step 4: Run full backend validation**

```bash
pnpm --filter salonbw-backend test --runInBand
pnpm --filter salonbw-backend typecheck
pnpm --filter salonbw-backend lint
pnpm --filter salonbw-backend build
git diff --check
```

Expected: all commands exit `0`. Record exact Jest suite/test counts in the
journal.

- [ ] **Step 5: Update handoff documents**

Journal must record:

- original Wednesday finding;
- fail-first evidence per task;
- changed files and business rule;
- exact validation results;
- no production data mutation;
- next step: deploy code, read-only production `plan`, then request separate
  approval for dump/apply.

Update `PROJECT_STATE.md` so the next action is the read-only production plan,
not an automatic reset.

- [ ] **Step 6: Run repository handoff check and commit**

```bash
scripts/handoff-check.sh
git add backend/salonbw-backend/scripts/synthetic-prelive-data.ts \
  backend/salonbw-backend/src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts \
  docs/SYNTHETIC_PRELIVE_DATA.md \
  docs/PROJECT_STATE.md \
  docs/journal/2026-07-29-synthetic-schedule-implementation.md
git commit -m "docs: document schedule-aware synthetic data"
```

- [ ] **Step 7: Push and monitor**

```bash
git push origin master
scripts/monitor-master-runs.sh
```

Expected: `CI` and `Deploy (MyDevil)` both finish `completed/success`.

- [ ] **Step 8: Perform read-only production verification**

Using existing secret-safe environment handling:

```bash
pnpm --dir backend/salonbw-backend synthetic:data:plan
pnpm --dir backend/salonbw-backend synthetic:data:verify
curl -fsS https://api.salon-bw.pl/healthz
```

Expected:

- `plan.blockers` is empty;
- `convertedInProgress` reflects the anchor day's schedule;
- `verify.scheduleViolations = 0` only after the corrected dataset exists;
- `/healthz` reports API and database healthy.

If the current production dataset still contains the known Wednesday
violations, `verify` is expected to fail closed. Record that as evidence; do
not run `apply` in this task.

---

## Production data follow-up — separate approval gate

This section is deliberately not part of implementation execution.

After code deploy and read-only `plan`, present the aggregate report to the
owner. Only after a new explicit approval:

1. create a fresh `pg_dump` using the existing guarded procedure;
2. verify that the dump is a non-empty regular file younger than 30 minutes;
3. execute exactly one `synthetic:data:apply`;
4. run `synthetic:data:verify` and require `scheduleViolations = 0`;
5. verify `/healthz`, the closed day and representative working-day visits;
6. rotate the temporary database password again;
7. update a separate rollout journal with backup metadata, counts and run IDs,
   never with secrets or PII.
