import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the 2026-06-20 admin full-flow audit artifacts from prod:
 *  - the test gift card 'NWHQ-BYKU-J8R3' (soft-deleted to `cancelled` during
 *    the audit; gift-card DELETE is a soft-delete by design) + its child rows
 *    (transactions), removed dynamically via information_schema so FK RESTRICT
 *    can't block,
 *  - any leftover throwaway employee user flowtest.emp@salon-bw.pl (it was
 *    hard-deleted via the API, but this is a defensive sweep) + rows
 *    referencing it.
 *
 * The created→deleted supplier and employee left no rows (hard delete) and the
 * loyalty program value was restored in-session. Audit-log rows for the test
 * admin actions are intentionally kept (append-only audit trail). Naturally
 * idempotent; irreversible by design (down is a no-op).
 */
export class CleanupAdminFlowAuditTestData1761150000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                gc_id int;
                uid int;
                r record;
            BEGIN
                -- 1. test gift card + children.
                SELECT id INTO gc_id FROM "gift_cards"
                WHERE "code" = 'NWHQ-BYKU-J8R3';
                IF gc_id IS NOT NULL THEN
                    FOR r IN
                        SELECT c.table_name
                        FROM information_schema.columns c
                        JOIN information_schema.tables t
                          ON t.table_name = c.table_name
                         AND t.table_schema = c.table_schema
                        WHERE c.column_name = 'giftCardId'
                          AND c.table_schema = 'public'
                          AND t.table_type = 'BASE TABLE'
                          AND c.table_name <> 'gift_cards'
                    LOOP
                        EXECUTE format(
                            'DELETE FROM %I WHERE "giftCardId" = $1',
                            r.table_name
                        ) USING gc_id;
                    END LOOP;
                    DELETE FROM "gift_cards" WHERE "id" = gc_id;
                END IF;

                -- 2. defensive: throwaway test employee account.
                SELECT id INTO uid FROM "users"
                WHERE "email" = 'flowtest.emp@salon-bw.pl';
                IF uid IS NOT NULL THEN
                    FOR r IN
                        SELECT c.table_name, c.column_name
                        FROM information_schema.columns c
                        JOIN information_schema.tables t
                          ON t.table_name = c.table_name
                         AND t.table_schema = c.table_schema
                        WHERE c.column_name IN
                              ('employeeId', 'userId', 'clientId', 'soldById')
                          AND c.table_schema = 'public'
                          AND t.table_type = 'BASE TABLE'
                          AND c.table_name <> 'users'
                    LOOP
                        EXECUTE format(
                            'DELETE FROM %I WHERE %I = $1',
                            r.table_name, r.column_name
                        ) USING uid;
                    END LOOP;
                    DELETE FROM "users" WHERE "id" = uid;
                END IF;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Irreversible cleanup of test data; nothing to restore.
    }
}
