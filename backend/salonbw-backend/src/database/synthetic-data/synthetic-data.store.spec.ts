import type { QueryRunner } from 'typeorm';
import { generateSyntheticDataset } from './synthetic-data.dataset';
import {
    assertProtectedAccounts,
    buildSyntheticPlan,
    cleanupSyntheticData,
    insertSyntheticDataset,
    RESET_GROUPS,
    resetOperationalData,
    assertResetSchema,
    verifySyntheticState,
} from './synthetic-data.store';

const dataset = generateSyntheticDataset({
    anchorDate: new Date('2026-07-28T12:00:00+02:00'),
    ownerUserId: 7,
    serviceIds: [10, 11, 12],
});

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

        const plan = await buildSyntheticPlan(
            runner,
            ['owner@example.invalid', 'ci@example.invalid'],
            dataset,
        );

        const sqlStatements = (runner.query as jest.Mock).mock.calls.map(
            ([sql]) => String(sql).trim().toUpperCase(),
        );
        expect(
            sqlStatements.every(
                (sql) => sql.startsWith('SELECT') || sql.startsWith('WITH'),
            ),
        ).toBe(true);
        expect(plan.protectedUserIds).toEqual([7, 20]);
        expect(plan.ownerUserId).toBe(7);
        expect(plan.serviceIds).toEqual([10, 11, 12]);
        expect(plan.deleteCounts).toEqual({
            clients: 4,
            appointments: 11,
            products: 822,
            warehouseDocuments: 7,
        });
        expect(plan.createCounts.clients).toBe(12);
        expect(plan.createCounts.appointments).toBe(30);
        expect(JSON.stringify(plan)).not.toContain('@');
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

        const plan = await buildSyntheticPlan(
            runner,
            ['missing-admin@example.invalid', 'ci@example.invalid'],
            dataset,
        );

        expect(plan.protectedAdminPresent).toBe(false);
        expect(plan.blockers).toContain('Protected admin account is missing');
        expect(() => assertProtectedAccounts(plan)).toThrow(
            'Protected admin account is missing',
        );
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
        expect(sql[logIndex]).toContain(
            `NOT (client."id" = ANY($1::int[]))`,
        );
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
                clients: 12,
                appointments: 30,
                products: 12,
                warehouseDocuments: 5,
                commissions: 4,
                reviews: 2,
                loyaltyTransactions: 3,
                recipeItems: 1,
            }),
        );
        const serializedCalls = JSON.stringify(
            (runner.query as jest.Mock).mock.calls,
        );
        expect(serializedCalls).not.toContain('@salon-bw.pl');
        expect(serializedCalls).toContain('synthetic.client.01@example.invalid');
        expect(serializedCalls).toContain('SYNTH-001');
    });

    it('returns a redacted verification report and count blockers', async () => {
        const runner = queryRunnerWithResults([
            [
                {
                    clients: '12',
                    appointments: '30',
                    products: '11',
                    warehouseDocuments: '5',
                    protectedAccountsPresent: '2',
                    remainingNonSyntheticClients: '0',
                },
            ],
        ]);

        const report = await verifySyntheticState(
            runner,
            {
                clients: 12,
                appointments: 30,
                products: 12,
                warehouseDocuments: 5,
            },
            [7, 20],
        );

        expect(report.actual.products).toBe(11);
        expect(report.blockers).toContain(
            'products count mismatch: expected 12, got 11',
        );
        expect(JSON.stringify(report)).not.toContain('@');
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
