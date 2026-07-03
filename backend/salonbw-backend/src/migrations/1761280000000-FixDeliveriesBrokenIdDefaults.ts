import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Third pass at POST /deliveries 500: the id column may HAVE a
 * nextval('...') default while the sequence object itself is gone
 * (dropped with a legacy table, dump restored without sequences...).
 * SELECTs work; every INSERT raises "relation ..._id_seq does not exist".
 * The previous migration only acted when the default was NULL, so it
 * skipped this case. Here: for deliveries/delivery_items, if the id
 * default is missing OR references a sequence that doesn't exist,
 * (re)create the sequence, own it, bump it past MAX(id), set the default.
 */
export class FixDeliveriesBrokenIdDefaults1761280000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                tbl text;
                col_default text;
                seq_name text;
                needs_fix boolean;
            BEGIN
                FOREACH tbl IN ARRAY ARRAY['deliveries', 'delivery_items']
                LOOP
                    IF to_regclass('public.' || tbl) IS NULL THEN
                        CONTINUE;
                    END IF;

                    SELECT column_default INTO col_default
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                        AND table_name = tbl
                        AND column_name = 'id';

                    needs_fix := false;
                    IF col_default IS NULL THEN
                        needs_fix := true;
                    ELSIF col_default LIKE 'nextval(%' THEN
                        seq_name := regexp_replace(
                            col_default,
                            'nextval\\(''([^'']+)''.*',
                            '\\1'
                        );
                        IF to_regclass(seq_name) IS NULL THEN
                            needs_fix := true;
                        END IF;
                    END IF;

                    IF needs_fix THEN
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
                        RAISE NOTICE 'Fixed id default on %', tbl;
                    END IF;
                END LOOP;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Repairing a broken identity default is not reversible by design.
    }
}
