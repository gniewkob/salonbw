import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Functional audit finding: POST /deliveries 500'd on prod even with a
 * minimal payload, persisting nothing, while GET worked fine. The
 * CreateWarehouseTables migration used CREATE TABLE IF NOT EXISTS, so a
 * pre-existing legacy "deliveries" table silently kept its old schema —
 * SELECTs succeed (all entity columns exist) but INSERTs die on legacy
 * NOT-NULL columns the entity doesn't populate. Reconcile defensively:
 * ensure every entity column exists, and drop NOT NULL from any legacy
 * column the entity does not manage (they keep their data, just stop
 * blocking inserts). Applies to deliveries and delivery_items.
 */
export class ReconcileDeliveriesLegacySchema1761260000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            DECLARE
                col record;
            BEGIN
                IF to_regclass('public.deliveries') IS NULL THEN
                    RETURN;
                END IF;

                ALTER TABLE "deliveries"
                    ADD COLUMN IF NOT EXISTS "deliveryNumber" VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS "supplierId" INTEGER,
                    ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
                    ADD COLUMN IF NOT EXISTS "deliveryDate" DATE,
                    ADD COLUMN IF NOT EXISTS "receivedDate" DATE,
                    ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS "notes" TEXT,
                    ADD COLUMN IF NOT EXISTS "receivedById" INTEGER,
                    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();

                -- Legacy columns the entity does not populate must not block
                -- inserts: relax NOT NULL on anything outside the entity set.
                FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                        AND table_name = 'deliveries'
                        AND is_nullable = 'NO'
                        AND column_default IS NULL
                        AND column_name NOT IN (
                            'id', 'deliveryNumber', 'supplierId', 'status',
                            'deliveryDate', 'receivedDate', 'invoiceNumber',
                            'totalCost', 'notes', 'receivedById',
                            'createdAt', 'updatedAt'
                        )
                LOOP
                    EXECUTE format(
                        'ALTER TABLE "deliveries" ALTER COLUMN %I DROP NOT NULL',
                        col.column_name
                    );
                END LOOP;

                IF to_regclass('public.delivery_items') IS NULL THEN
                    RETURN;
                END IF;

                ALTER TABLE "delivery_items"
                    ADD COLUMN IF NOT EXISTS "deliveryId" INTEGER,
                    ADD COLUMN IF NOT EXISTS "productId" INTEGER,
                    ADD COLUMN IF NOT EXISTS "quantity" DECIMAL(10,2),
                    ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(12,2),
                    ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(12,2),
                    ADD COLUMN IF NOT EXISTS "batchNumber" VARCHAR(100),
                    ADD COLUMN IF NOT EXISTS "expiryDate" DATE;

                FOR col IN
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                        AND table_name = 'delivery_items'
                        AND is_nullable = 'NO'
                        AND column_default IS NULL
                        AND column_name NOT IN (
                            'id', 'deliveryId', 'productId', 'quantity',
                            'unitCost', 'totalCost', 'batchNumber',
                            'expiryDate'
                        )
                LOOP
                    EXECUTE format(
                        'ALTER TABLE "delivery_items" ALTER COLUMN %I DROP NOT NULL',
                        col.column_name
                    );
                END LOOP;
            END $$;
        `);
    }

    public async down(): Promise<void> {
        // Irreversible schema reconciliation: we don't know which legacy
        // columns were relaxed. No-op.
    }
}
