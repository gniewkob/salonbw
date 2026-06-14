import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Final sweep of throwaway accounts created during the 2026-06-14 E2E
 * verification. `available-slots` requires auth, so a short-lived
 * `vcheck.*@salon-bw.pl` client was registered to confirm slot #29 was freed;
 * this removes it (and re-sweeps any `e2e.*` straggler) plus rows referencing
 * them via a userId column. Same dynamic, RESTRICT-safe approach as the
 * previous cleanup. Irreversible; down() is a no-op.
 */
export class CleanupVerificationAccount1761030000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                uids int[];
                r record;
            BEGIN
                SELECT array_agg(id) INTO uids
                FROM "users"
                WHERE "email" LIKE 'vcheck.%@salon-bw.pl'
                   OR "email" LIKE 'e2e.%@salon-bw.pl';

                IF uids IS NOT NULL THEN
                    FOR r IN
                        SELECT c.table_name
                        FROM information_schema.columns c
                        JOIN information_schema.tables t
                          ON t.table_name = c.table_name
                         AND t.table_schema = c.table_schema
                        WHERE c.column_name = 'userId'
                          AND c.table_schema = 'public'
                          AND t.table_type = 'BASE TABLE'
                          AND c.table_name <> 'users'
                    LOOP
                        EXECUTE format(
                            'DELETE FROM %I WHERE "userId" = ANY($1)',
                            r.table_name
                        ) USING uids;
                    END LOOP;
                    DELETE FROM "users" WHERE "id" = ANY(uids);
                END IF;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // No-op: verification accounts are intentionally not restored.
    }
}
