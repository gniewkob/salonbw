# Synthetic Pre-live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zbudować bezpieczny CLI, który planuje, tworzy, weryfikuje i usuwa deterministyczny dataset pre-live bez danych klientów z Versum i bez realnych cen magazynowych.

**Architecture:** Logika zostanie podzielona na cztery małe jednostki: walidację bramek, czysty generator manifestu, adapter PostgreSQL oraz orkiestrator transakcji. Cienki skrypt CLI połączy te jednostki, ale domyślnie wykona tylko odczytowy `plan`; wdrożenie kodu nie uruchomi resetu.

**Tech Stack:** TypeScript 5.9, Node.js 22+, TypeORM 0.3, PostgreSQL, Jest 30, pnpm.

## Global Constraints

- Nie odczytywać ani nie importować eksportów Versum.
- Nie logować e-maili, telefonów, hashy haseł, sekretów ani surowych rekordów.
- `plan` jest trybem domyślnym i nie wykonuje zapisów.
- `apply` oraz `cleanup` wymagają `SYNTHETIC_DATA_ALLOWED=true`, `APP_LIFECYCLE=prelive`, frazy `RESET_PRELIVE_DATA` i świeżego backupu.
- Backup musi być zwykłym, niepustym plikiem, nie starszym niż 30 minut.
- Chronione konto admina i konto klienta CI muszą istnieć przed transakcją.
- Reset zachowuje konfigurację salonu, katalog usług, grafiki i chronione konta.
- Dane syntetyczne używają `example.invalid`, prefiksu nazw `SYNTHETIC` oraz SKU `SYNTH-`.
- `apply` działa w jednej transakcji; każdy błąd powoduje rollback.
- Wdrożenie narzędzia i wykonanie resetu produkcyjnej bazy są osobnymi zadaniami.

---

## File map

- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
  — współdzielone typy konfiguracji, manifestu, planu i raportu.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.config.ts`
  — parsowanie argumentów oraz bramki środowiska, backupu i chronionych kont.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts`
  — czysty, deterministyczny generator klientów, wizyt i magazynu.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts`
  — jawne zapytania plan/reset/insert/verify wykonywane przez `QueryRunner`.
- `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts`
  — orkiestracja trybów i granicy transakcji.
- `backend/salonbw-backend/scripts/synthetic-prelive-data.ts`
  — entrypoint CLI i bezpieczne raportowanie.
- `backend/salonbw-backend/src/database/synthetic-data/*.spec.ts`
  — testy jednostkowe oraz transakcyjne.
- `backend/salonbw-backend/package.json`
  — skrypty `synthetic:data:*`.
- `docs/SYNTHETIC_PRELIVE_DATA.md`
  — instrukcja operatora i bramka wykonania.

---

### Task 1: Typy i bramki fail-closed

**Files:**
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.config.ts`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.config.spec.ts`

**Interfaces:**
- Produces:
  - `type SyntheticMode = 'plan' | 'apply' | 'verify' | 'cleanup'`
  - `interface SyntheticRunConfig`
  - `interface FileMetadata`
  - `parseSyntheticRunConfig(argv, env, fileMetadata): SyntheticRunConfig`
- Consumes: wyłącznie jawne argumenty, wybrane zmienne środowiska oraz zanonimizowane metadane pliku.

- [ ] **Step 1: Write failing configuration tests**

```ts
describe('parseSyntheticRunConfig', () => {
    it('defaults to read-only plan', () => {
        expect(parseSyntheticRunConfig([], {}, () => null).mode).toBe('plan');
    });

    it.each(['apply', 'cleanup'] as const)(
        'rejects %s without every write gate',
        (mode) => {
            expect(() =>
                parseSyntheticRunConfig([mode], {}, () => null),
            ).toThrow('Synthetic write blocked');
        },
    );

    it('accepts apply with pre-live flags, protected accounts and fresh backup', () => {
        const config = parseSyntheticRunConfig(
            [
                'apply',
                '--confirm',
                'RESET_PRELIVE_DATA',
                '--backup-file',
                '/safe/backup.dump',
                '--protect',
                'admin@example.invalid',
                '--protect',
                'ci@example.invalid',
            ],
            {
                SYNTHETIC_DATA_ALLOWED: 'true',
                APP_LIFECYCLE: 'prelive',
            },
            () => ({ isFile: true, size: 1024, ageMs: 60_000 }),
        );
        expect(config.protectedEmails).toHaveLength(2);
    });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
pnpm --filter salonbw-backend test -- synthetic-data.config.spec.ts --runInBand
```

Expected: FAIL because the module and parser do not exist.

- [ ] **Step 3: Implement minimal types and parser**

The parser must normalize protected e-mails to lowercase, reject duplicates,
require at least two protected addresses for write modes and never copy password
environment variables into the returned/reportable config.

```ts
export interface FileMetadata {
    isFile: boolean;
    size: number;
    ageMs: number;
}

export interface SyntheticRunConfig {
    mode: SyntheticMode;
    protectedEmails: string[];
    backupFile?: string;
    reportJson: boolean;
}

export function parseSyntheticRunConfig(
    argv: string[],
    env: NodeJS.ProcessEnv,
    getFileMetadata: (path: string) => FileMetadata | null,
): SyntheticRunConfig;
```

- [ ] **Step 4: Run tests and verify GREEN**

Run the same Jest command. Expected: all configuration tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/salonbw-backend/src/database/synthetic-data
git commit -m "feat(backend): add synthetic data safety gates"
```

---

### Task 2: Deterministyczny manifest danych

**Files:**
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.ts`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.dataset.spec.ts`

**Interfaces:**
- Consumes: `anchorDate: Date`, identyfikatory chronionego ownera i istniejących usług.
- Produces:
  - `interface SyntheticDataset`
  - `generateSyntheticDataset(input: DatasetInput): SyntheticDataset`
  - dokładnie 12 klientów, około 30 wizyt, 4 kategorie i 12 produktów.

- [ ] **Step 1: Write failing determinism and privacy tests**

```ts
describe('generateSyntheticDataset', () => {
    const input = {
        anchorDate: new Date('2026-07-28T00:00:00+02:00'),
        ownerUserId: 7,
        serviceIds: [10, 11, 12],
    };

    it('is deterministic for the same local day', () => {
        expect(generateSyntheticDataset(input)).toEqual(
            generateSyntheticDataset(input),
        );
    });

    it('uses only synthetic identity markers', () => {
        const data = generateSyntheticDataset(input);
        expect(data.clients).toHaveLength(12);
        expect(
            data.clients.every(
                (client) =>
                    client.name.startsWith('SYNTHETIC') &&
                    client.email.endsWith('@example.invalid') &&
                    client.receiveNotifications === false,
            ),
        ).toBe(true);
        expect(data.products.every((p) => p.sku.startsWith('SYNTH-'))).toBe(
            true,
        );
    });

    it('covers calendar and stock edge states', () => {
        const data = generateSyntheticDataset(input);
        expect(new Set(data.appointments.map((a) => a.status))).toEqual(
            new Set([
                'scheduled',
                'confirmed',
                'in_progress',
                'cancelled',
                'completed',
                'no_show',
                'online_pending',
                'rescheduled_pending',
            ]),
        );
        expect(data.products.some((p) => p.stock === 0)).toBe(true);
        expect(data.products.some((p) => p.stock < p.minQuantity)).toBe(true);
    });
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter salonbw-backend test -- synthetic-data.dataset.spec.ts --runInBand
```

Expected: FAIL because the generator does not exist.

- [ ] **Step 3: Implement a dependency-free seeded generator**

Use a small internal linear-congruential generator seeded with a fixed integer;
do not add Faker or another dependency. Normalize `anchorDate` once, then create:

- 12 clients with non-routable identities;
- 30 appointments containing every required status;
- 4 product categories, 12 products, 2 suppliers;
- one delivery, order, sale, usage and completed stocktaking;
- review/commission/loyalty descriptors for a representative subset.

The generator returns values only; it must not import TypeORM, environment
variables or filesystem APIs.

- [ ] **Step 4: Strengthen assertions for exact coverage**

Assert exact appointment status counts, unique e-mails/SKU, valid start/end
ordering, positive fictional amounts and absence of strings matching
`@salon-bw.pl`.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm --filter salonbw-backend test -- synthetic-data.dataset.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data
git commit -m "feat(backend): generate deterministic synthetic dataset"
```

---

### Task 3: Odczytowy plan oraz jawny rejestr tabel

**Files:**
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.ts`
- Modify: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.types.ts`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.store.spec.ts`

**Interfaces:**
- Consumes: `QueryRunner`, chronione e-maile, `SyntheticDataset`.
- Produces:
  - `buildSyntheticPlan(queryRunner, protectedEmails): Promise<SyntheticPlan>`
  - `assertProtectedAccounts(plan): void`
  - `resetOperationalData(queryRunner, protectedUserIds): Promise<TableCounts>`
  - `insertSyntheticDataset(queryRunner, dataset, context): Promise<TableCounts>`
  - `verifySyntheticState(queryRunner, expected): Promise<VerificationReport>`

- [ ] **Step 1: Write failing read-only plan tests**

Use a mocked `QueryRunner.query` and assert that:

- every statement issued by `buildSyntheticPlan` starts with `SELECT` or
  `WITH`;
- report rows contain only table/group names and counts;
- raw e-mails returned by the database are reduced to booleans/IDs before the
  report is built;
- missing admin or CI account throws before transaction start.

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter salonbw-backend test -- synthetic-data.store.spec.ts --runInBand
```

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Add explicit reset registry**

Create a readonly registry grouped by deletion boundary. It must include the
current appointment/CRM tables and warehouse tables, including:

```ts
export const RESET_GROUPS = {
    appointmentChildren: [
        'appointment_messages',
        'appointment_extra_services',
        'commissions',
        'reviews',
    ],
    customerChildren: [
        'customer_group_members',
        'customer_tag_assignments',
        'customer_notes',
        'customer_files',
        'customer_gallery_images',
        'loyalty_transactions',
        'loyalty_balances',
        'newsletter_recipients',
        'push_subscriptions',
    ],
    warehouseChildren: [
        'service_recipe_items',
        'warehouse_sale_items',
        'warehouse_sales',
        'warehouse_usage_items',
        'warehouse_usages',
        'warehouse_order_items',
        'warehouse_orders',
        'stocktaking_items',
        'product_movements',
        'inventory_movements',
        'delivery_items',
        'deliveries',
    ],
    warehouseParents: [
        'stocktakings',
        'products',
        'product_categories',
        'suppliers',
    ],
} as const;
```

Before writes, inspect table metadata and reject an unexpected foreign key
referencing `users`, `appointments` or `products`. The metadata check may use
`QueryRunner.getTables()`; deletion itself must not be generated from
`information_schema`.

- [ ] **Step 4: Implement counts, protected-account checks and redacted report**

`SyntheticPlan` contains:

```ts
interface SyntheticPlan {
    protectedUserIds: number[];
    protectedAdminPresent: boolean;
    protectedCiClientPresent: boolean;
    deleteCounts: Record<string, number>;
    createCounts: Record<string, number>;
    blockers: string[];
}
```

No identity string may be exposed by this interface.

- [ ] **Step 5: Run tests and commit**

```bash
pnpm --filter salonbw-backend test -- synthetic-data.store.spec.ts --runInBand
git add backend/salonbw-backend/src/database/synthetic-data
git commit -m "feat(backend): add synthetic data plan and store"
```

---

### Task 4: Transakcyjny orkiestrator apply/verify/cleanup

**Files:**
- Create: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.ts`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-data.service.spec.ts`

**Interfaces:**
- Consumes: `DataSource`, `SyntheticRunConfig`, generator i store z Tasks 1–3.
- Produces:
  - `runSyntheticDataCommand(deps, config): Promise<SyntheticCommandReport>`

- [ ] **Step 1: Write failing transaction tests**

```ts
it('rolls back when insert verification fails', async () => {
    store.verifySyntheticState.mockRejectedValue(new Error('count mismatch'));

    await expect(runSyntheticDataCommand(deps, applyConfig)).rejects.toThrow(
        'count mismatch',
    );
    expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
});

it('never starts a transaction for plan', async () => {
    await runSyntheticDataCommand(deps, planConfig);
    expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    expect(store.resetOperationalData).not.toHaveBeenCalled();
});
```

Add cases for successful commit, `verify`, synthetic-only `cleanup` and release
of the query runner in `finally`.

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter salonbw-backend test -- synthetic-data.service.spec.ts --runInBand
```

- [ ] **Step 3: Implement orchestration**

Required flow:

```ts
switch (config.mode) {
    case 'plan':
        return buildReadOnlyReport();
    case 'verify':
        return verifyWithoutWrites();
    case 'apply':
        return runInTransaction(resetThenInsertThenVerify);
    case 'cleanup':
        return runInTransaction(removeSyntheticOnlyThenVerify);
}
```

Do not call `process.exit`, `console.log` or filesystem APIs in the service.

- [ ] **Step 4: Run all synthetic-data tests and commit**

```bash
pnpm --filter salonbw-backend test -- synthetic-data --runInBand
git add backend/salonbw-backend/src/database/synthetic-data
git commit -m "feat(backend): orchestrate synthetic pre-live reset"
```

---

### Task 5: CLI, package scripts and redacted output

**Files:**
- Create: `backend/salonbw-backend/scripts/synthetic-prelive-data.ts`
- Modify: `backend/salonbw-backend/package.json`
- Test: `backend/salonbw-backend/src/database/synthetic-data/synthetic-prelive-data.cli.spec.ts`

**Interfaces:**
- Consumes: `parseSyntheticRunConfig`, backend `DataSource`,
  `runSyntheticDataCommand`.
- Produces package commands:
  - `pnpm synthetic:data:plan`
  - `pnpm synthetic:data:verify`
  - `pnpm synthetic:data:apply -- ...`
  - `pnpm synthetic:data:cleanup -- ...`

- [ ] **Step 1: Write failing CLI tests**

Extract and export:

```ts
export async function main(
    argv: string[],
    env: NodeJS.ProcessEnv,
    deps: CliDependencies,
): Promise<number>;
```

Tests must assert:

- empty argv invokes `plan`;
- output JSON contains counts/statuses but no protected e-mail;
- thrown errors produce exit code `1` and a redacted message;
- the `DataSource` is always destroyed after initialization.

- [ ] **Step 2: Run tests and verify RED**

```bash
pnpm --filter salonbw-backend test -- synthetic-prelive-data.cli.spec.ts --runInBand
```

- [ ] **Step 3: Implement CLI and scripts**

Add to `package.json`:

```json
"synthetic:data:plan": "ts-node --transpile-only scripts/synthetic-prelive-data.ts plan",
"synthetic:data:verify": "ts-node --transpile-only scripts/synthetic-prelive-data.ts verify",
"synthetic:data:apply": "ts-node --transpile-only scripts/synthetic-prelive-data.ts apply",
"synthetic:data:cleanup": "ts-node --transpile-only scripts/synthetic-prelive-data.ts cleanup"
```

Use the same TypeORM connection environment names as the existing
`scripts/seed-test-data.ts`, but do not provide `postgres`/`salonbw` password
defaults in production-capable code. Missing DB configuration must fail before
connection.

- [ ] **Step 4: Verify help/plan parsing without a database connection**

Add `--help` that prints arguments and guard names only. Run:

```bash
pnpm --filter salonbw-backend synthetic:data:plan -- --help
```

Expected: exit `0`, no environment values printed.

- [ ] **Step 5: Commit**

```bash
git add backend/salonbw-backend/scripts/synthetic-prelive-data.ts \
  backend/salonbw-backend/package.json \
  backend/salonbw-backend/src/database/synthetic-data
git commit -m "feat(backend): expose synthetic pre-live data CLI"
```

---

### Task 6: Operator documentation and complete validation

**Files:**
- Create: `docs/SYNTHETIC_PRELIVE_DATA.md`
- Create: `docs/journal/2026-07-28-synthetic-prelive-data.md`
- Modify: `docs/PROJECT_STATE.md`

**Interfaces:**
- Consumes: final CLI contract.
- Produces: exact operator runbook and auditable handoff.

- [ ] **Step 1: Write the operator runbook**

Document separate phases:

1. local unit validation;
2. production-like read-only `plan`;
3. review of counts;
4. `pg_dump`;
5. explicit approval;
6. guarded `apply`;
7. `verify`, health and UI regression;
8. later `cleanup`.

State explicitly that Versum exports remain outside Git and are not inputs to
the command.

- [ ] **Step 2: Run backend quality gates**

```bash
cd backend/salonbw-backend
pnpm lint
pnpm typecheck
pnpm test -- --runInBand
pnpm build
```

Expected: exit `0`; record exact test counts and any pre-existing warnings.

- [ ] **Step 3: Run secret and diff checks**

```bash
git diff --check
rg -n 'test123|@salon-bw\\.pl|DB_PASSWORD.*postgres' \
  backend/salonbw-backend/src/database/synthetic-data \
  backend/salonbw-backend/scripts/synthetic-prelive-data.ts
```

Expected: no embedded password/default credential; any `@salon-bw.pl` match
must be an assertion forbidding that domain, not fixture data.

- [ ] **Step 4: Prove plan is read-only**

Use the unit test spy over `QueryRunner.query` and include the passing test name
in the journal. Do not point the unfinished CLI at production during
implementation validation.

- [ ] **Step 5: Update handoff files**

Journal must include Finding, Change, exact validation output, rollout status
and next action: production `plan` only. `PROJECT_STATE.md` must distinguish
“narzędzie gotowe” from “reset wykonany”.

- [ ] **Step 6: Run handoff check and commit**

```bash
scripts/handoff-check.sh
git add docs/SYNTHETIC_PRELIVE_DATA.md \
  docs/journal/2026-07-28-synthetic-prelive-data.md \
  docs/PROJECT_STATE.md
git commit -m "docs: hand off synthetic pre-live tooling"
```

- [ ] **Step 7: Rebase, push and monitor**

```bash
git fetch origin master
git rebase origin/master
git push origin master
scripts/monitor-master-runs.sh
```

Do not dispatch or execute `synthetic:data:apply`. Production `plan`, backup
and reset require a separate owner approval after reviewing current counts.
