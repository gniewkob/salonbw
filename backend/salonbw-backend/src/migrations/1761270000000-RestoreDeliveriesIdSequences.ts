import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * POST /deliveries still 500'd after the NOT-NULL reconcile: SELECTs work,
 * INSERTs fail, table has zero rows — the classic signature of a legacy
 * table whose id column lost its SERIAL default (table restored/created
 * without its sequence). TypeORM inserts omit id and rely on the default;
 * with none, Postgres raises a not-null violation on id. Restore a proper
 * sequence-backed default on deliveries and delivery_items ids, idempotently.
 */
export class RestoreDeliveriesIdSequences1761270000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                tbl text;
            BEGIN
                FOREACH tbl IN ARRAY ARRAY['deliveries', 'delivery_items']
                LOOP
                    IF to_regclass('public.' || tbl) IS NULL THEN
                        CONTINUE;
                    END IF;
                    IF (
                        SELECT column_default
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                            AND table_name = tbl
                            AND column_name = 'id'
                    ) IS NULL THEN
                        EXECUTE format(
                            'CREATE SEQUENCE IF NOT EXISTS %I_id_seq',
                            tbl
                        );
                        EXECUTE format(
                            'ALTER SEQUENCE %I_id_seq OWNED BY %I.id',
                            tbl, tbl
                        );
                        EXECUTE format(
                            'SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %I), 0) + 1, false)',
                            tbl || '_id_seq', tbl
                        );
                        EXECUTE format(
                            'ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)',
                            tbl, tbl || '_id_seq'
                        );
                    END IF;
                END LOOP;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Restoring a missing identity default is not something to undo.
    }
}
