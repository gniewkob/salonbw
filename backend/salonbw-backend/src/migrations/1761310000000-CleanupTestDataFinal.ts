import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Final pre-release test-data hygiene (2026-07-06). Owner-approved after a live
 * inventory; account decisions confirmed via prompt.
 *
 * REMOVED (accounts + everything hanging off them):
 *   49 "Test Klient"      (test.klient@salon-bw.pl) + its ~50 seeded visits
 *   52 "Pracownik (test)" (role=employee) + any visit it staffed
 * REMOVED (appointments only — the account is KEPT):
 *   client 53 "E2E Klient Zmieniony" (e2e.client.0628@example.com) — its test
 *   appointments (online_pending #101/#102 etc. + the audit chat messages on
 *   them) pollute the admin dashboard's pending-booking count. The ACCOUNT
 *   stays because the Playwright regression CI logs in with it.
 * KEPT: 29 Aleksandra (real stylist), 53 (CI account), 54 "Test tesr"
 *   (owner's own gniewko@bodora.pl client account — owner chose to keep it).
 *
 * Uses the recursive, schema-agnostic FK cascade helper (same as the
 * 2026-06-16 QA cleanup): before deleting a parent row it removes every
 * descendant that references it, to any depth, without hardcoding table names
 * — so RESTRICT FKs without ON DELETE cannot block it. down() is a no-op;
 * deleted prod rows are only recoverable from a DB backup.
 */
const REMOVE_USER_IDS = [49, 52];
const E2E_KEEP_CLIENT_ID = 53; // account kept, its appointments removed

export class CleanupTestDataFinal1761310000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
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
              targets int[] := ARRAY[${REMOVE_USER_IDS.join(', ')}]::int[];
              e2e_client int := ${E2E_KEEP_CLIENT_ID};
              appt_ids int[];
              fk record;
            BEGIN
              -- A) Remove the e2e account's test appointments (keep the user).
              SELECT array_agg(id) INTO appt_ids
              FROM "appointments" WHERE "clientId" = e2e_client;
              PERFORM pg_temp.cleanup_cascade_del('appointments', appt_ids);
              DELETE FROM "appointments" WHERE "clientId" = e2e_client;

              -- B) Null the users self-reference (created_by, …) wherever it
              --    points at a target, so deleting the target cannot orphan a
              --    keeper it created.
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

              -- C) Recursively delete every descendant of the target users
              --    (their appointments as client OR employee, and each
              --    appointment's children), then the users themselves.
              PERFORM pg_temp.cleanup_cascade_del('users', targets);
              DELETE FROM "users" WHERE "id" = ANY(targets);
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // No-op: destructive cleanup of test rows is not reversible.
        // Restore from a database backup if these accounts are ever needed.
    }
}
