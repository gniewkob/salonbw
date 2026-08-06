import type { QueryRunner } from 'typeorm';
import {
    generateSyntheticDataset,
    SYNTHETIC_APPOINTMENT_COUNT,
    SYNTHETIC_CLIENT_COUNT,
} from './synthetic-data.dataset';
import {
    SYNTHETIC_FUTURE_DAYS,
    SYNTHETIC_PAST_DAYS,
} from './synthetic-data.schedule';
import {
    assertProtectedAccounts,
    buildSyntheticPlan,
    cleanupSyntheticData,
    insertSyntheticDataset,
    loadSyntheticAppointmentDateRange,
    loadSyntheticBaseContext,
    loadSyntheticWorkingDays,
    lockSyntheticSchedule,
    RESET_GROUPS,
    resetOperationalData,
    assertResetSchema,
    verifySyntheticState,
} from './synthetic-data.store';

const anchorDate = new Date('2026-07-28T12:00:00+02:00');
const workingDays = Array.from(
    { length: SYNTHETIC_PAST_DAYS + SYNTHETIC_FUTURE_DAYS + 1 },
    (_, index) => {
        const date = new Date('2026-07-28T12:00:00.000Z');
        date.setUTCDate(date.getUTCDate() + index - SYNTHETIC_PAST_DAYS);
        return {
            date: date.toISOString().slice(0, 10),
            ranges: [{ startMinute: 8 * 60, endMinute: 20 * 60 }],
        };
    },
);
const dataset = generateSyntheticDataset({
    anchorDate,
    ownerUserId: 7,
    serviceIds: [10, 11, 12],
    workingDays,
});
const expectedCounts = {
    clients: dataset.clients.length,
    appointments: dataset.appointments.length,
    products: dataset.products.length,
    warehouseDocuments:
        dataset.deliveries.length +
        dataset.orders.length +
        dataset.sales.length +
        dataset.usages.length +
        dataset.stocktakings.length,
};

function queryRunnerWithResults(results: unknown[]): QueryRunner {
    return {
        query: jest
            .fn()
            .mockImplementation(() => Promise.resolve(results.shift())),
    } as unknown as QueryRunner;
}

describe('synthetic-data store plan', () => {
    it('uses read-only SQL and returns no protected identities', async () => {
        const runner = queryRunnerWithResults([
            [
                { id: 7, role: 'admin' },
                { id: 20, role: 'client' },
            ],
            [{ id: 10 }, { id: 11 }, { id: 12 }],
            [
                {
                    clients: '4',
                    appointments: '11',
                    products: '822',
                    warehouseDocuments: '7',
                },
            ],
        ]);

        const context = await loadSyntheticBaseContext(runner, [
            'owner@example.invalid',
            'ci@example.invalid',
        ]);
        const plan = await buildSyntheticPlan(runner, context, expectedCounts, {
            rangeStart: '2026-06-23',
            rangeEnd: '2026-09-26',
            workingDays: 96,
            closedDays: 0,
            convertedInProgress: 0,
        });

        const sqlStatements = (runner.query as jest.Mock).mock.calls.map(
            ([sql]) => String(sql).trim().toUpperCase(),
        );
        expect(
            sqlStatements.every(
                (sql) => sql.startsWith('SELECT') || sql.startsWith('WITH'),
            ),
        ).toBe(true);
        expect(context.ownerUserId).toBe(7);
        expect(plan.protectedUserIds).toEqual([7, 20]);
        expect(plan.ownerUserId).toBe(7);
        expect(plan.serviceIds).toEqual([10, 11, 12]);
        expect(plan.deleteCounts).toEqual({
            clients: 4,
            appointments: 11,
            products: 822,
            warehouseDocuments: 7,
        });
        expect(plan.createCounts.clients).toBe(SYNTHETIC_CLIENT_COUNT);
        expect(plan.createCounts.appointments).toBe(SYNTHETIC_APPOINTMENT_COUNT);
        expect(plan.scheduleSummary?.workingDays).toBe(96);
        expect(JSON.stringify(plan)).not.toContain('@');
    });

    it('loads overlapping timetable slots and exceptions with read-only SQL', async () => {
        const timetableRows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            id: 31,
            validFrom: '2026-01-01',
            validTo: null,
            dayOfWeek,
            startTime: '09:00:00',
            endTime: '17:00:00',
            isBreak: false,
        }));
        const runner = queryRunnerWithResults([
            timetableRows,
            [
                {
                    timetableId: 31,
                    date: '2026-07-29',
                    type: 'day_off',
                    customStartTime: null,
                    customEndTime: null,
                },
            ],
        ]);

        const loadedWorkingDays = await loadSyntheticWorkingDays(
            runner,
            7,
            new Date('2026-07-29T12:00:00+02:00'),
        );

        expect(
            loadedWorkingDays.find((day) => day.date === '2026-07-29')?.ranges,
        ).toEqual([]);
        expect((runner.query as jest.Mock).mock.calls).toHaveLength(2);
        expect(
            (runner.query as jest.Mock).mock.calls.every(([sql]) =>
                /^(SELECT|WITH)/.test(String(sql).trim().toUpperCase()),
            ),
        ).toBe(true);
        expect((runner.query as jest.Mock).mock.calls[0]?.[1]).toEqual([
            7,
            '2026-06-24',
            '2026-09-27',
        ]);
        expect((runner.query as jest.Mock).mock.calls[1]?.[1]).toEqual([
            [31],
            '2026-06-24',
            '2026-09-27',
        ]);
        const selectedColumns = (runner.query as jest.Mock).mock.calls
            .map(([sql]) => String(sql).split(/\bFROM\b/i)[0])
            .join(' ');
        expect(selectedColumns).not.toMatch(
            /"name"|"description"|"title"|"reason"|"email"/i,
        );
    });

    it('loads the actual persisted synthetic appointment date range without PII', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    rangeStart: new Date('2025-12-20T09:00:00+01:00'),
                    rangeEnd: new Date('2026-01-05T17:00:00+01:00'),
                },
            ],
        ]);

        await expect(
            loadSyntheticAppointmentDateRange(runner),
        ).resolves.toEqual({
            rangeStart: '2025-12-20',
            rangeEnd: '2026-01-05',
        });
        const sql = String((runner.query as jest.Mock).mock.calls[0]?.[0]);
        expect(sql.trim().toUpperCase()).toMatch(/^SELECT/);
        expect(sql.split(/\bFROM\b/i)[0]).not.toMatch(/email|name|client/i);
    });

    it('loads schedule rows for an explicit persisted range instead of the current anchor horizon', async () => {
        const timetableRows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
            id: 31,
            validFrom: '2025-01-01',
            validTo: null,
            dayOfWeek,
            startTime: '09:00:00',
            endTime: '17:00:00',
            isBreak: false,
        }));
        const runner = queryRunnerWithResults([timetableRows, []]);
        const persistedRange = {
            rangeStart: '2025-12-20',
            rangeEnd: '2025-12-22',
        };

        const days = await loadSyntheticWorkingDays(
            runner,
            7,
            anchorDate,
            persistedRange,
        );

        expect(days.map((day) => day.date)).toEqual([
            '2025-12-20',
            '2025-12-21',
            '2025-12-22',
        ]);
        expect((runner.query as jest.Mock).mock.calls[0]?.[1]).toEqual([
            7,
            persistedRange.rangeStart,
            persistedRange.rangeEnd,
        ]);
        expect((runner.query as jest.Mock).mock.calls[1]?.[1]).toEqual([
            [31],
            persistedRange.rangeStart,
            persistedRange.rangeEnd,
        ]);
    });

    it('acquires one static write-excluding lock for every schedule table', async () => {
        const runner = {
            query: jest.fn().mockResolvedValue(undefined),
        } as unknown as QueryRunner;

        await lockSyntheticSchedule(runner);

        expect(runner.query).toHaveBeenCalledTimes(1);
        const [sql, parameters] = (runner.query as jest.Mock).mock.calls[0];
        expect(String(sql).replace(/\s+/g, ' ').trim()).toBe(
            'LOCK TABLE "timetables", "timetable_slots", "timetable_exceptions" IN SHARE MODE',
        );
        expect(parameters).toBeUndefined();
    });

    it('reports missing protected roles as blockers', async () => {
        const runner = queryRunnerWithResults([
            [{ id: 20, role: 'client' }],
            [{ id: 10 }],
            [
                {
                    clients: '0',
                    appointments: '0',
                    products: '0',
                    warehouseDocuments: '0',
                },
            ],
        ]);

        const context = await loadSyntheticBaseContext(runner, [
            'missing-admin@example.invalid',
            'ci@example.invalid',
        ]);
        const plan = await buildSyntheticPlan(runner, context, expectedCounts);

        expect(plan.protectedAdminPresent).toBe(false);
        expect(plan.blockers).toContain('Protected admin account is missing');
        expect(() => assertProtectedAccounts(plan)).toThrow(
            'Protected admin account is missing',
        );
    });

    it('builds cleanup counts without a schedule summary', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    clients: '4',
                    appointments: '11',
                    products: '822',
                    warehouseDocuments: '7',
                    unprotectedPrivileged: '0',
                },
            ],
        ]);

        const plan = await buildSyntheticPlan(
            runner,
            {
                protectedUserIds: [7, 20],
                protectedAdminPresent: true,
                protectedCiClientPresent: true,
                ownerUserId: 7,
                serviceIds: [10, 11, 12],
                blockers: [],
            },
            {
                clients: 0,
                appointments: 0,
                products: 0,
                warehouseDocuments: 0,
            },
        );

        expect(plan.deleteCounts).toEqual({
            clients: 4,
            appointments: 11,
            products: 822,
            warehouseDocuments: 7,
        });
        expect(plan.createCounts).toEqual({
            clients: 0,
            appointments: 0,
            products: 0,
            warehouseDocuments: 0,
        });
        expect(plan).not.toHaveProperty('scheduleSummary');
    });

    it('keeps a versioned explicit reset registry', () => {
        expect(RESET_GROUPS.warehouseParents).toEqual([
            'stocktakings',
            'products',
            'product_categories',
            'suppliers',
        ]);
        expect(RESET_GROUPS.warehouseChildren).toContain('product_sales');
        expect(Object.values(RESET_GROUPS).flat()).not.toContain('users');
    });

    it('deletes only explicit tables and preserves protected users', async () => {
        const runner = {
            query: jest.fn().mockResolvedValue([{ count: '1' }]),
        } as unknown as QueryRunner;

        const counts = await resetOperationalData(runner, [7, 20]);
        const calls = (runner.query as jest.Mock).mock.calls;
        const sql = calls.map(([statement]) => String(statement));

        expect(sql.every((statement) => !statement.includes('TRUNCATE'))).toBe(
            true,
        );
        expect(sql.some((statement) => statement.includes('"users"'))).toBe(
            true,
        );
        const userCall = calls.find(([statement]) =>
            String(statement).includes('DELETE FROM "users"'),
        );
        expect(userCall?.[1]).toEqual([[7, 20]]);
        expect(counts.users).toBe(1);

        const logIndex = sql.findIndex((statement) =>
            statement.includes('DELETE FROM "logs"'),
        );
        const userIndex = sql.findIndex((statement) =>
            statement.includes('DELETE FROM "users"'),
        );
        expect(logIndex).toBeGreaterThanOrEqual(0);
        expect(logIndex).toBeLessThan(userIndex);
        expect(sql[logIndex]).toContain(`log."userId" = client."id"`);
        expect(sql[logIndex]).toContain(`client."role" = 'client'`);
        expect(sql[logIndex]).toContain(`NOT (client."id" = ANY($1::int[]))`);
        expect(calls[logIndex]?.[1]).toEqual([[7, 20]]);
        expect(counts.logs).toBe(1);

        const appointmentChildIndex = sql.findIndex((statement) =>
            statement.includes('"appointment_messages"'),
        );
        const appointmentIndex = sql.findIndex((statement) =>
            statement.includes('DELETE FROM "appointments"'),
        );
        expect(appointmentChildIndex).toBeLessThan(appointmentIndex);

        const productMovementIndex = sql.findIndex((statement) =>
            statement.includes('"product_movements"'),
        );
        const productIndex = sql.findIndex((statement) =>
            statement.includes('DELETE FROM "products"'),
        );
        expect(productMovementIndex).toBeLessThan(productIndex);
    });

    it('refuses reset without protected user ids', async () => {
        const runner = {
            query: jest.fn(),
        } as unknown as QueryRunner;

        await expect(resetOperationalData(runner, [])).rejects.toThrow(
            'Protected user ids are required',
        );
        expect(runner.query).not.toHaveBeenCalled();
    });

    it('inserts the complete synthetic manifest and returns grouped counts', async () => {
        let id = 100;
        const runner = {
            query: jest.fn().mockImplementation((sql: string) => {
                if (sql.includes('RETURNING "id"')) {
                    id += 1;
                    return Promise.resolve([{ id }]);
                }
                return Promise.resolve([]);
            }),
        } as unknown as QueryRunner;

        const counts = await insertSyntheticDataset(runner, dataset, {
            ownerUserId: 7,
            clientPasswordHash: '$2b$synthetic-non-loginable',
        });

        expect(counts).toEqual(
            expect.objectContaining({
                clients: SYNTHETIC_CLIENT_COUNT,
                appointments: SYNTHETIC_APPOINTMENT_COUNT,
                products: 12,
                warehouseDocuments: 5,
                commissions: dataset.commissions.length,
                reviews: 2,
                loyaltyTransactions: 3,
                recipeItems: 1,
            }),
        );
        const serializedCalls = JSON.stringify(
            (runner.query as jest.Mock).mock.calls,
        );
        expect(serializedCalls).not.toContain('@salon-bw.pl');
        expect(serializedCalls).toContain(
            'synthetic.client.01@example.invalid',
        );
        expect(serializedCalls).toContain('SYNTH-001');

        const stocktakingCall = (runner.query as jest.Mock).mock.calls.find(
            ([sql]) => String(sql).includes('INSERT INTO "stocktakings"'),
        );
        expect(String(stocktakingCall?.[0])).toContain(
            `$3, $3, $4, now(), now())`,
        );
        expect(stocktakingCall?.[1]).toEqual([
            'SYNTHETIC-STOCKTAKING-001',
            dataset.anchorDate,
            7,
            dataset.anchorDate,
        ]);
    });

    it('returns count and actual database schedule blockers without PII', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    clients: String(SYNTHETIC_CLIENT_COUNT),
                    appointments: String(SYNTHETIC_APPOINTMENT_COUNT),
                    products: '11',
                    warehouseDocuments: '5',
                    protectedAccountsPresent: '2',
                    remainingNonSyntheticClients: '0',
                },
            ],
            [
                {
                    id: 44,
                    employeeId: 7,
                    status: 'confirmed',
                    startTime: new Date('2026-07-29T18:00:00+02:00'),
                    endTime: new Date('2026-07-29T19:00:00+02:00'),
                },
            ],
        ]);

        const report = await verifySyntheticState(
            runner,
            {
                clients: SYNTHETIC_CLIENT_COUNT,
                appointments: SYNTHETIC_APPOINTMENT_COUNT,
                products: 12,
                warehouseDocuments: 5,
            },
            [7, 20],
            {
                ownerUserId: 7,
                anchorDate,
                workingDays: [
                    {
                        date: '2026-07-29',
                        ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
                    },
                ],
            },
        );

        expect(report.actual.products).toBe(11);
        expect(report.blockers).toContain(
            'products count mismatch: expected 12, got 11',
        );
        expect(report.scheduleViolations).toBe(1);
        expect(report.blockers).toContain(
            'db-appointment-44:SYNTHETIC_APPOINTMENT_OUTSIDE_SCHEDULE',
        );
        const appointmentSelect = String(
            (runner.query as jest.Mock).mock.calls[1]?.[0],
        ).split(/\bFROM\b/i)[0];
        expect(appointmentSelect).toContain('a."id"');
        expect(appointmentSelect).toContain('a."employeeId"');
        expect(appointmentSelect).toContain('a."status"');
        expect(appointmentSelect).toContain('a."startTime"');
        expect(appointmentSelect).toContain('a."endTime"');
        expect(appointmentSelect).not.toMatch(/email|name|client/i);
        expect(JSON.stringify(report)).not.toContain('@');
    });

    it('requires schedule context when synthetic appointments are expected', async () => {
        const runner = queryRunnerWithResults([]);

        await expect(
            verifySyntheticState(
                runner,
                {
                    clients: SYNTHETIC_CLIENT_COUNT,
                    appointments: SYNTHETIC_APPOINTMENT_COUNT,
                    products: 12,
                    warehouseDocuments: 5,
                },
                [7, 20],
            ),
        ).rejects.toThrow('SYNTHETIC_SCHEDULE_CONTEXT_REQUIRED');
        expect(runner.query).not.toHaveBeenCalled();
    });

    it('keeps persisted confirmed visits valid after their original anchor passes', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    clients: String(SYNTHETIC_CLIENT_COUNT),
                    appointments: String(SYNTHETIC_APPOINTMENT_COUNT),
                    products: '12',
                    warehouseDocuments: '5',
                    protectedAccountsPresent: '2',
                    remainingNonSyntheticClients: '0',
                },
            ],
            [
                {
                    id: 44,
                    employeeId: 7,
                    status: 'confirmed',
                    startTime: new Date('2026-07-30T09:00:00+02:00'),
                    endTime: new Date('2026-07-30T10:00:00+02:00'),
                },
            ],
        ]);

        const report = await verifySyntheticState(
            runner,
            expectedCounts,
            [7, 20],
            {
                ownerUserId: 7,
                anchorDate: new Date('2026-08-01T12:00:00+02:00'),
                workingDays: [
                    {
                        date: '2026-07-30',
                        ranges: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
                    },
                ],
                validateStatusTime: false,
            },
        );

        expect(report.scheduleViolations).toBe(0);
        expect(report.blockers).toEqual([]);
    });

    it('allows cleanup verification without schedule context', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    clients: '0',
                    appointments: '0',
                    products: '0',
                    warehouseDocuments: '0',
                    protectedAccountsPresent: '2',
                    remainingNonSyntheticClients: '0',
                },
            ],
            [],
        ]);

        const report = await verifySyntheticState(
            runner,
            {
                clients: 0,
                appointments: 0,
                products: 0,
                warehouseDocuments: 0,
            },
            [7, 20],
        );

        expect(report.scheduleViolations).toBe(0);
        expect(report.blockers).toEqual([]);
    });

    it('reports every foreign key outside the explicit reset boundary', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    childTable: 'appointment_messages',
                    parentTable: 'appointments',
                },
                {
                    childTable: 'unexpected_audit_copy',
                    parentTable: 'users',
                },
                {
                    childTable: 'unexpected_export',
                    parentTable: 'products',
                },
            ],
        ]);

        await expect(assertResetSchema(runner, [7, 20])).rejects.toThrow(
            'Unexpected foreign keys: unexpected_audit_copy -> users; unexpected_export -> products',
        );
    });

    it('accepts product sales references inside the reset boundary', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    childTable: 'product_sales',
                    childColumn: 'appointmentId',
                    parentTable: 'appointments',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
                {
                    childTable: 'product_sales',
                    childColumn: 'productId',
                    parentTable: 'products',
                    parentColumn: 'id',
                    deleteRule: 'RESTRICT',
                },
                {
                    childTable: 'product_sales',
                    childColumn: 'employeeId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
            ],
            [{ count: '0' }],
        ]);

        await expect(
            assertResetSchema(runner, [7, 20]),
        ).resolves.toBeUndefined();
        expect((runner.query as jest.Mock).mock.calls).toHaveLength(2);
    });

    it('accepts inventory movement actor references inside the reset boundary', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    childTable: 'inventory_movements',
                    childColumn: 'productId',
                    parentTable: 'products',
                    parentColumn: 'id',
                    deleteRule: 'CASCADE',
                },
                {
                    childTable: 'inventory_movements',
                    childColumn: 'actorId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'SET NULL',
                },
            ],
        ]);

        await expect(
            assertResetSchema(runner, [7, 20]),
        ).resolves.toBeUndefined();
    });

    it('rejects preserved restricted references to clients selected for reset', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    childTable: 'logs',
                    childColumn: 'userId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
                {
                    childTable: 'commission_rules',
                    childColumn: 'employeeId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
            ],
            [{ count: '1' }],
        ]);

        await expect(assertResetSchema(runner, [7, 20])).rejects.toThrow(
            'Blocking foreign key data: commission_rules -> users (1 row)',
        );
    });

    it('accepts preserved restricted references with no rows selected for reset', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    childTable: 'logs',
                    childColumn: 'userId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
                {
                    childTable: 'commission_rules',
                    childColumn: 'employeeId',
                    parentTable: 'users',
                    parentColumn: 'id',
                    deleteRule: 'NO ACTION',
                },
            ],
            [{ count: '0' }],
        ]);

        await expect(
            assertResetSchema(runner, [7, 20]),
        ).resolves.toBeUndefined();
        expect((runner.query as jest.Mock).mock.calls).toHaveLength(2);
    });

    it('cleanup deletes only records selected by synthetic markers', async () => {
        const runner = {
            query: jest.fn().mockResolvedValue([{ count: '1' }]),
        } as unknown as QueryRunner;

        const counts = await cleanupSyntheticData(runner);
        const sql = (runner.query as jest.Mock).mock.calls.map(([statement]) =>
            String(statement),
        );

        expect(counts.users).toBe(1);
        expect(sql).not.toHaveLength(0);
        expect(
            sql.every(
                (statement) =>
                    statement.includes('synthetic.client.%@example.invalid') ||
                    statement.includes('SYNTHETIC-%') ||
                    statement.includes('SYNTH-%') ||
                    statement.includes("LIKE 'SYNTHETIC %'"),
            ),
        ).toBe(true);
        expect(
            sql.some((statement) =>
                statement.includes('DELETE FROM "users"\n'),
            ),
        ).toBe(true);
    });
});
