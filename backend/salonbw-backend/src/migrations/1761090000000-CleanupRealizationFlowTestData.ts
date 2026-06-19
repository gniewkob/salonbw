import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the 2026-06-18/19 visit-realization flow test artifacts from prod:
 *  - appointments 31-36 (booking/reschedule/cancel/finalize tests) + every
 *    child row referencing them,
 *  - the warehouse usages they created (and the standalone POS-probe usage
 *    U20260600001), restoring the deducted stock first,
 *  - the L2 booking-alert emails for the test online bookings,
 *  - the throwaway client account e2e-client-0618@example.com (id 50) + rows
 *    referencing it.
 *
 * Stock restore is additive (current + deducted) and scoped to the test
 * appointments' usages, so it reverses exactly what was deducted (only the
 * completed-scope usage on appt 34 actually moved stock; the planned probe
 * did not). Child rows are removed dynamically via information_schema (base
 * tables only) so FK RESTRICT can't block and no table name is hardcoded.
 *
 * Naturally idempotent: a second run finds no usages/appointments/account and
 * restores nothing. Irreversible by design; down() is a no-op. Leftover
 * product_movements audit rows for the reversed deduction are intentionally
 * kept (historical ledger; stock is corrected).
 */
export class CleanupRealizationFlowTestData1761090000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                test_appts int[] := ARRAY[31,32,33,34,35,36];
                usage_ids int[];
                cid int;
                r record;
            BEGIN
                -- 1. warehouse usages tied to the test appointments + the
                --    standalone POS-probe usage.
                SELECT array_agg(id) INTO usage_ids
                FROM "warehouse_usages"
                WHERE "appointmentId" = ANY(test_appts)
                   OR "usageNumber" = 'U20260600001';

                -- 2. restore stock from the appointment-linked usages (these
                --    deducted; the planned probe did not, and is excluded).
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
                --    the appointments.
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

                -- 5. L2 booking-alert emails for the test online bookings.
                DELETE FROM "email_logs"
                WHERE "subject" LIKE 'Nowa rezerwacja online%'
                  AND ("subject" LIKE '%2026-06-25%'
                       OR "subject" LIKE '%2026-07-02%');

                -- 6. the throwaway test client + rows referencing it.
                SELECT id INTO cid FROM "users"
                WHERE "email" = 'e2e-client-0618@example.com';
                IF cid IS NOT NULL THEN
                    DELETE FROM "email_logs" WHERE "recipientId" = cid;
                    FOR r IN
                        SELECT c.table_name, c.column_name
                        FROM information_schema.columns c
                        JOIN information_schema.tables t
                          ON t.table_name = c.table_name
                         AND t.table_schema = c.table_schema
                        WHERE c.column_name IN ('clientId', 'userId')
                          AND c.table_schema = 'public'
                          AND t.table_type = 'BASE TABLE'
                          AND c.table_name <> 'users'
                    LOOP
                        EXECUTE format(
                            'DELETE FROM %I WHERE %I = $1',
                            r.table_name, r.column_name
                        ) USING cid;
                    END LOOP;
                    DELETE FROM "users" WHERE "id" = cid;
                END IF;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Irreversible cleanup of test data; nothing to restore.
    }
}
