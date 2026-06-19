import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the 2026-06-19 staff-flow audit test artifacts from prod:
 *  - appointments 37 (finalized w/ material), 38 (cancelled), 39 (finalized
 *    by employee) — all FLOW-TEST visits for test client 49 — plus every
 *    child row referencing them (commissions, warehouse usages, etc.),
 *  - restores the stock the finalize deducted (only appt 37 used 30 ml of
 *    product 80) before deleting the usages,
 *  - reverts the test employee Ola's (id 48) phone back to NULL (a profile
 *    edit was exercised during the audit).
 *
 * Child rows are removed dynamically via information_schema (base tables only)
 * so FK RESTRICT can't block and no table name is hardcoded. Stock restore is
 * additive and scoped to these appointments' usages, reversing exactly what
 * was deducted. Naturally idempotent; irreversible by design (down is a
 * no-op). The kept test accounts (29/47/48/49) and Ola's now-inactive
 * timetable (id 3, deliberately deactivated so it no longer pollutes the
 * public opening-hours union) are intentionally left in place.
 */
export class CleanupStaffFlowAuditTestData1761120000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                test_appts int[] := ARRAY[37,38,39];
                usage_ids int[];
                r record;
            BEGIN
                -- 1. warehouse usages tied to the test appointments.
                SELECT array_agg(id) INTO usage_ids
                FROM "warehouse_usages"
                WHERE "appointmentId" = ANY(test_appts);

                -- 2. restore stock from those usages before deleting them.
                UPDATE "products" p
                SET "stock" = p."stock" + sub.qty
                FROM (
                    SELECT wui."productId" AS pid, SUM(wui."quantity") AS qty
                    FROM "warehouse_usage_items" wui
                    JOIN "warehouse_usages" wu ON wu."id" = wui."usageId"
                    WHERE wu."appointmentId" = ANY(test_appts)
                      AND wui."productId" IS NOT NULL
                    GROUP BY wui."productId"
                ) sub
                WHERE p."id" = sub.pid;

                -- 3. delete usage items + usages.
                IF usage_ids IS NOT NULL THEN
                    DELETE FROM "warehouse_usage_items"
                    WHERE "usageId" = ANY(usage_ids);
                    DELETE FROM "warehouse_usages"
                    WHERE "id" = ANY(usage_ids);
                END IF;

                -- 4. delete appointment child rows (dynamic, FK-safe), then
                --    the appointments themselves.
                FOR r IN
                    SELECT c.table_name
                    FROM information_schema.columns c
                    JOIN information_schema.tables t
                      ON t.table_name = c.table_name
                     AND t.table_schema = c.table_schema
                    WHERE c.column_name = 'appointmentId'
                      AND c.table_schema = 'public'
                      AND t.table_type = 'BASE TABLE'
                      AND c.table_name NOT IN
                          ('appointments', 'warehouse_usages')
                LOOP
                    EXECUTE format(
                        'DELETE FROM %I WHERE "appointmentId" = ANY($1)',
                        r.table_name
                    ) USING test_appts;
                END LOOP;
                DELETE FROM "appointments" WHERE "id" = ANY(test_appts);

                -- 5. revert the test employee's audited profile edit.
                UPDATE "users" SET "phone" = NULL, "updatedAt" = now()
                WHERE "email" = 'test.ola@salon-bw.pl';
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Irreversible cleanup of test data; nothing to restore.
    }
}
