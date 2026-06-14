import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the 2026-06-14 E2E booking-flow test artifacts from production:
 *  - appointment #29 (a completed test visit polluting the real calendar/stats)
 *    and every child row referencing it,
 *  - the L2 alert email log it produced,
 *  - the three e2e.* test accounts and rows referencing them.
 *
 * Child rows are removed dynamically via information_schema (base tables only,
 * not views) so no FK — including the RESTRICT ones without ON DELETE — blocks
 * the delete, and no table name has to be hardcoded. Irreversible by design;
 * down() is a no-op.
 */
export class CleanupE2eTestArtifacts1761020000000
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
                FROM "users" WHERE "email" LIKE 'e2e.%@salon-bw.pl';

                -- 1. appointment #29 children, then the appointment
                FOR r IN
                    SELECT c.table_name
                    FROM information_schema.columns c
                    JOIN information_schema.tables t
                      ON t.table_name = c.table_name
                     AND t.table_schema = c.table_schema
                    WHERE c.column_name = 'appointmentId'
                      AND c.table_schema = 'public'
                      AND t.table_type = 'BASE TABLE'
                      AND c.table_name <> 'appointments'
                LOOP
                    EXECUTE format(
                        'DELETE FROM %I WHERE "appointmentId" = 29',
                        r.table_name
                    );
                END LOOP;
                DELETE FROM "appointments" WHERE "id" = 29;

                -- 2. the L2 alert email it generated (keep the Feb 'Smoke' row)
                DELETE FROM "email_logs"
                WHERE "subject" LIKE 'Nowa rezerwacja online%2026-06-15 13:30';

                -- 3. rows referencing the e2e users via a userId column, then the users
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
        // No-op: test artifacts are intentionally not restored.
    }
}
