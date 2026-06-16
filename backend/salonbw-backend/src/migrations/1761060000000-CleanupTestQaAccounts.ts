import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-shot prod data hygiene (2026-06-16): remove leftover QA / automation
 * accounts that polluted every staff list (calendar PRACOWNICY, timetable,
 * employee list) and the customer list. Approved by owner after reviewing the
 * authoritative list pulled live from the API.
 *
 * Customers and staff are both rows in `users` (differentiated by `role`).
 *
 * KEPT (NOT in the target set):
 *   29 Aleksandra Bodora (real stylist)
 *   47 test.admin@   48 test.ola@   49 test.klient@  (owner's active test logins)
 *   10 Marzena Adamska (survivor of the duplicate merge)
 *
 * REMOVED — staff:
 *   13 Admin Test (admin@salon-bw.pl)            17 imie admin… (kontakt@bodora.pl)
 *   30 Test Pracownik   31 Test Pracownik        34 Test Employee
 *   40 QA Employee 2026-05-27   41 QA Admin 2026-05-27   42 QA Receptionist 2026-05-27
 * REMOVED — customers:
 *   1 Migration Check V3   2 Browser Validator    3 Final Browser Check (gniewko@bodora.pl)
 *   4 Final Browser Check  5 Final Browser Check V2 Resume                6 Curl Verify V5
 *   7 Curl Direct V6       8 Final Verify RT V7   9 Final Success Check  11 Verify User
 *   14 Test User           15 Test User           16 Test Verifier        18 Cypress Tester
 *   25 Parity2 Customer2   28 E2E-… Test          32 Test Client          33 Test Client
 *   39 QA Client 2026-05-27
 *   12 Marzena Adamska (DUPLICATE) — its child rows are repointed to 10 first, then it is deleted.
 *
 * down() is intentionally a no-op: deleted prod rows cannot be reconstructed.
 * The full identity list above is the audit trail (rely on DB backup to restore).
 */
const REMOVE_IDS = [
    // staff
    13, 17, 30, 31, 34, 40, 41, 42,
    // customers
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 14, 15, 16, 18, 25, 28, 32, 33, 39,
    // Marzena duplicate (merged into 10 below)
    12,
];
const MERGE_FROM = 12; // duplicate Marzena Adamska
const MERGE_TO = 10; // surviving Marzena Adamska

export class CleanupTestQaAccounts1761060000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // DO blocks cannot take bind parameters; inline the numeric id literals
        // (constants, no injection surface) into the array declarations.
        const targetsLiteral = `ARRAY[${REMOVE_IDS.join(', ')}]::int[]`;

        // Recursive, schema-agnostic cascade delete. Walks the FK graph from a
        // table to any depth: before deleting rows of `p_table` whose id is in
        // `p_ids`, it removes every descendant row that references them. Skips
        // the users self-reference (e.g. created_by) — that is a soft pointer
        // handled by SET NULL below, NOT a cascade edge (it must not delete the
        // *referencing* user, who may be a keeper).
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
                  AND tc.table_name <> p_table  -- skip self-ref (handled by SET NULL)
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

        await queryRunner.query(
            `
            DO $$
            DECLARE
              targets int[] := ${targetsLiteral};
              merge_from int := ${MERGE_FROM};
              merge_to   int := ${MERGE_TO};
              fk record;
            BEGIN
              -- 1) Merge duplicate Marzena: repoint every child FK column that
              --    references users(id) from merge_from -> merge_to, so her
              --    visit history survives on the kept record. On a unique
              --    collision (junction tables keyed on (otherKey, userId)) the
              --    survivor already has the twin row, so drop the dup's.
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
                  AND tc.table_name <> 'users'
              LOOP
                BEGIN
                  EXECUTE format(
                    'UPDATE %I SET %I = $1 WHERE %I = $2',
                    fk.table_name, fk.column_name, fk.column_name
                  ) USING merge_to, merge_from;
                EXCEPTION WHEN unique_violation THEN
                  EXECUTE format(
                    'DELETE FROM %I WHERE %I = $1',
                    fk.table_name, fk.column_name
                  ) USING merge_from;
                END;
              END LOOP;

              -- 2) Null the users self-reference (created_by, …) wherever it
              --    points at a target, so deleting the target cannot orphan a
              --    keeper that it created.
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

              -- 3) Recursively delete every descendant of the target users
              --    (appointments -> commissions/invoices/formulas/…), then the
              --    users themselves.
              PERFORM pg_temp.cleanup_cascade_del('users', targets);
              DELETE FROM users WHERE id = ANY(targets);
            END $$;
            `,
        );
    }

    public async down(): Promise<void> {
        // No-op: destructive cleanup of QA/test rows is not reversible.
        // Restore from a database backup if these accounts are ever needed.
    }
}
