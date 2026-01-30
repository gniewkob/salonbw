import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWarehouseTables1710015000000 implements MigrationInterface {
    name = 'CreateWarehouseTables1710015000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create suppliers table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "suppliers" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(200) NOT NULL,
                "contactPerson" VARCHAR(200),
                "email" VARCHAR(100),
                "phone" VARCHAR(20),
                "address" TEXT,
                "nip" VARCHAR(20),
                "notes" TEXT,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Add warehouse columns to products if not exist
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'sku') THEN
                    ALTER TABLE "products" ADD COLUMN "sku" VARCHAR(50);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'barcode') THEN
                    ALTER TABLE "products" ADD COLUMN "barcode" VARCHAR(50);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'productType') THEN
                    ALTER TABLE "products" ADD COLUMN "productType" VARCHAR(20) DEFAULT 'product';
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'purchasePrice') THEN
                    ALTER TABLE "products" ADD COLUMN "purchasePrice" DECIMAL(10,2);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'minQuantity') THEN
                    ALTER TABLE "products" ADD COLUMN "minQuantity" INTEGER;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'unit') THEN
                    ALTER TABLE "products" ADD COLUMN "unit" VARCHAR(20);
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'defaultSupplierId') THEN
                    ALTER TABLE "products" ADD COLUMN "defaultSupplierId" INTEGER;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'trackStock') THEN
                    ALTER TABLE "products" ADD COLUMN "trackStock" BOOLEAN DEFAULT true;
                END IF;
            END $$;
        `);

        // Add foreign key from products to suppliers
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE constraint_name = 'FK_products_defaultSupplier'
                ) THEN
                    ALTER TABLE "products"
                    ADD CONSTRAINT "FK_products_defaultSupplier"
                    FOREIGN KEY ("defaultSupplierId")
                    REFERENCES "suppliers"("id") ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        // Create deliveries table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "deliveries" (
                "id" SERIAL PRIMARY KEY,
                "deliveryNumber" VARCHAR(50) NOT NULL UNIQUE,
                "supplierId" INTEGER,
                "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
                "deliveryDate" DATE,
                "receivedDate" DATE,
                "invoiceNumber" VARCHAR(100),
                "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
                "notes" TEXT,
                "receivedById" INTEGER,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_deliveries_supplier"
                    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_deliveries_receivedBy"
                    FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Create delivery_items table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "delivery_items" (
                "id" SERIAL PRIMARY KEY,
                "deliveryId" INTEGER NOT NULL,
                "productId" INTEGER NOT NULL,
                "quantity" INTEGER NOT NULL,
                "unitCost" DECIMAL(10,2) NOT NULL,
                "totalCost" DECIMAL(12,2) NOT NULL,
                "batchNumber" VARCHAR(50),
                "expiryDate" DATE,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_delivery_items_delivery"
                    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_delivery_items_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
            )
        `);

        // Create stocktakings table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "stocktakings" (
                "id" SERIAL PRIMARY KEY,
                "stocktakingNumber" VARCHAR(50) NOT NULL UNIQUE,
                "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
                "stocktakingDate" DATE NOT NULL,
                "notes" TEXT,
                "createdById" INTEGER,
                "completedById" INTEGER,
                "completedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_stocktakings_createdBy"
                    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_stocktakings_completedBy"
                    FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Create stocktaking_items table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "stocktaking_items" (
                "id" SERIAL PRIMARY KEY,
                "stocktakingId" INTEGER NOT NULL,
                "productId" INTEGER NOT NULL,
                "systemQuantity" INTEGER NOT NULL,
                "countedQuantity" INTEGER,
                "difference" INTEGER,
                "notes" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_stocktaking_items_stocktaking"
                    FOREIGN KEY ("stocktakingId") REFERENCES "stocktakings"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_stocktaking_items_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_stocktaking_items_stocktaking_product"
                    UNIQUE ("stocktakingId", "productId")
            )
        `);

        // Create product_movements table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product_movements" (
                "id" SERIAL PRIMARY KEY,
                "productId" INTEGER NOT NULL,
                "movementType" VARCHAR(20) NOT NULL,
                "quantity" INTEGER NOT NULL,
                "quantityBefore" INTEGER NOT NULL,
                "quantityAfter" INTEGER NOT NULL,
                "deliveryId" INTEGER,
                "stocktakingId" INTEGER,
                "appointmentId" INTEGER,
                "createdById" INTEGER,
                "notes" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_product_movements_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_product_movements_delivery"
                    FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_product_movements_stocktaking"
                    FOREIGN KEY ("stocktakingId") REFERENCES "stocktakings"("id") ON DELETE SET NULL,
                CONSTRAINT "FK_product_movements_createdBy"
                    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Create indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_deliveries_status" ON "deliveries" ("status");
            CREATE INDEX IF NOT EXISTS "IDX_deliveries_supplierId" ON "deliveries" ("supplierId");
            CREATE INDEX IF NOT EXISTS "IDX_deliveries_deliveryDate" ON "deliveries" ("deliveryDate");
            CREATE INDEX IF NOT EXISTS "IDX_delivery_items_deliveryId" ON "delivery_items" ("deliveryId");
            CREATE INDEX IF NOT EXISTS "IDX_delivery_items_productId" ON "delivery_items" ("productId");
            CREATE INDEX IF NOT EXISTS "IDX_stocktakings_status" ON "stocktakings" ("status");
            CREATE INDEX IF NOT EXISTS "IDX_stocktakings_stocktakingDate" ON "stocktakings" ("stocktakingDate");
            CREATE INDEX IF NOT EXISTS "IDX_stocktaking_items_stocktakingId" ON "stocktaking_items" ("stocktakingId");
            CREATE INDEX IF NOT EXISTS "IDX_stocktaking_items_productId" ON "stocktaking_items" ("productId");
            CREATE INDEX IF NOT EXISTS "IDX_product_movements_productId" ON "product_movements" ("productId");
            CREATE INDEX IF NOT EXISTS "IDX_product_movements_movementType" ON "product_movements" ("movementType");
            CREATE INDEX IF NOT EXISTS "IDX_product_movements_createdAt" ON "product_movements" ("createdAt");
            CREATE INDEX IF NOT EXISTS "IDX_products_sku" ON "products" ("sku");
            CREATE INDEX IF NOT EXISTS "IDX_products_barcode" ON "products" ("barcode");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_products_barcode";
            DROP INDEX IF EXISTS "IDX_products_sku";
            DROP INDEX IF EXISTS "IDX_product_movements_createdAt";
            DROP INDEX IF EXISTS "IDX_product_movements_movementType";
            DROP INDEX IF EXISTS "IDX_product_movements_productId";
            DROP INDEX IF EXISTS "IDX_stocktaking_items_productId";
            DROP INDEX IF EXISTS "IDX_stocktaking_items_stocktakingId";
            DROP INDEX IF EXISTS "IDX_stocktakings_stocktakingDate";
            DROP INDEX IF EXISTS "IDX_stocktakings_status";
            DROP INDEX IF EXISTS "IDX_delivery_items_productId";
            DROP INDEX IF EXISTS "IDX_delivery_items_deliveryId";
            DROP INDEX IF EXISTS "IDX_deliveries_deliveryDate";
            DROP INDEX IF EXISTS "IDX_deliveries_supplierId";
            DROP INDEX IF EXISTS "IDX_deliveries_status";
        `);

        // Drop tables in reverse order
        await queryRunner.query(`DROP TABLE IF EXISTS "product_movements"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stocktaking_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "stocktakings"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "delivery_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "deliveries"`);

        // Remove foreign key and columns from products
        await queryRunner.query(`
            ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_defaultSupplier"
        `);
        await queryRunner.query(`
            ALTER TABLE "products"
            DROP COLUMN IF EXISTS "trackStock",
            DROP COLUMN IF EXISTS "defaultSupplierId",
            DROP COLUMN IF EXISTS "unit",
            DROP COLUMN IF EXISTS "minQuantity",
            DROP COLUMN IF EXISTS "purchasePrice",
            DROP COLUMN IF EXISTS "productType",
            DROP COLUMN IF EXISTS "barcode",
            DROP COLUMN IF EXISTS "sku"
        `);

        await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
    }
}
