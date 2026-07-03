import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Deleting a product that had ANY manual stock adjustment 500'd: the
 * inventory_movements.productId FK was ON DELETE RESTRICT, so the hard
 * delete in ProductsService.remove hit a FK violation. Movements are child
 * audit rows of the product — cascade them away with it. (Other references
 * — sales/usage/recipes — still block deletion and are surfaced as a clean
 * 400 by the service.)
 */
export class InventoryMovementsCascadeOnProductDelete1761240000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                fk_name text;
            BEGIN
                IF to_regclass('public.inventory_movements') IS NULL THEN
                    RETURN;
                END IF;
                SELECT tc.constraint_name INTO fk_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = 'inventory_movements'
                    AND tc.constraint_type = 'FOREIGN KEY'
                    AND kcu.column_name = 'productId';
                IF fk_name IS NOT NULL THEN
                    EXECUTE format(
                        'ALTER TABLE public.inventory_movements DROP CONSTRAINT %I',
                        fk_name
                    );
                END IF;
                ALTER TABLE public.inventory_movements
                    ADD CONSTRAINT "FK_inventory_movements_product"
                    FOREIGN KEY ("productId") REFERENCES products (id)
                    ON DELETE CASCADE;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF to_regclass('public.inventory_movements') IS NULL THEN
                    RETURN;
                END IF;
                ALTER TABLE public.inventory_movements
                    DROP CONSTRAINT IF EXISTS "FK_inventory_movements_product";
                ALTER TABLE public.inventory_movements
                    ADD CONSTRAINT "FK_inventory_movements_product"
                    FOREIGN KEY ("productId") REFERENCES products (id)
                    ON DELETE RESTRICT;
            END $$;
        `);
    }
}
