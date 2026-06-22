import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the two leftover test staff accounts so only the real stylist
 * (Aleksandra) remains in PRACOWNICY (owner-authorised 2026-06-22):
 *   - 47 "Test Admin"  (test.admin@salon-bw.pl)
 *   - 48 "Ola (test)"  (test.ola@salon-bw.pl)
 *
 * Safe to run only AFTER 1761200000000 made Aleksandra (29) a working admin
 * (verified: login + admin endpoints OK), so an admin always exists.
 *
 * Uses the same schema-agnostic FK-safe cascade as the June QA cleanup:
 * null the users self-reference (created_by, …) pointing at the targets,
 * recursively delete descendants (appointments → commissions/… , timetables,
 * logs, employee_services), then the users. down() is a no-op (restore from
 * backup if ever needed).
 */
const REMOVE_IDS = [47, 48];

export class RemoveTestStaffAccounts1761210000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const targetsLiteral = `ARRAY[${REMOVE_IDS.join(', ')}]::int[]`;

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION pg_temp.cleanup_cascade_del(
              p_table text, p_ids int[]
            ) RETURNS void AS $fn$
            DECLARE
              fk record;
              child_ids int[];
              child_has_id boolean;
            BEGIN
              IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
                RETURN;
              END IF;
              FOR fk IN
                SELECT tc.table_name AS child_table, kcu.column_name AS child_col
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                  ON tc.constraint_name = ccu.constraint_name
                 AND tc.table_schema = ccu.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND ccu.table_name = p_table
                  AND ccu.column_name = 'id'
                  AND tc.table_name <> p_table
              LOOP
                SELECT EXISTS (
                  SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public'
                    AND table_name = fk.child_table
                    AND column_name = 'id'
                ) INTO child_has_id;

                IF child_has_id THEN
                  EXECUTE format(
                    'SELECT array_agg(id) FROM %I WHERE %I = ANY($1)',
                    fk.child_table, fk.child_col
                  ) INTO child_ids USING p_ids;
                  PERFORM pg_temp.cleanup_cascade_del(fk.child_table, child_ids);
                END IF;

                EXECUTE format(
                  'DELETE FROM %I WHERE %I = ANY($1)',
                  fk.child_table, fk.child_col
                ) USING p_ids;
              END LOOP;
            END;
            $fn$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            DO $$
            DECLARE
              targets int[] := ${targetsLiteral};
              fk record;
            BEGIN
              -- Null the users self-reference (created_by, …) pointing at a
              -- target so deleting it cannot orphan a keeper it created.
              FOR fk IN
                SELECT tc.table_name, kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                 AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage ccu
                  ON tc.constraint_name = ccu.constraint_name
                 AND tc.table_schema = ccu.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = 'public'
                  AND ccu.table_name = 'users'
                  AND ccu.column_name = 'id'
                  AND tc.table_name = 'users'
              LOOP
                EXECUTE format(
                  'UPDATE %I SET %I = NULL WHERE %I = ANY($1)',
                  fk.table_name, fk.column_name, fk.column_name
                ) USING targets;
              END LOOP;

              PERFORM pg_temp.cleanup_cascade_del('users', targets);
              DELETE FROM users WHERE id = ANY(targets);
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // No-op: destructive cleanup of test rows is not reversible.
        // Restore from a database backup if these accounts are ever needed.
    }
}
