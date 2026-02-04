import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVersumWarehouseViewTables1760090000000
    implements MigrationInterface
{
    name = 'CreateVersumWarehouseViewTables1760090000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product_categories" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(120) NOT NULL,
                "parentId" INTEGER,
                "sortOrder" INTEGER NOT NULL DEFAULT 0,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_product_categories_parent'
                ) THEN
                    ALTER TABLE "product_categories"
                    ADD CONSTRAINT "FK_product_categories_parent"
                    FOREIGN KEY ("parentId") REFERENCES "product_categories"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_product_categories_parentId" ON "product_categories" ("parentId")`,
        );

        await queryRunner.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "categoryId" INTEGER`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 23`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packageSize" DECIMAL(10,3)`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "packageUnit" VARCHAR(20)`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "manufacturer" VARCHAR(100)`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_products_categoryId" ON "products" ("categoryId")`,
        );

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_products_category'
                ) THEN
                    ALTER TABLE "products"
                    ADD CONSTRAINT "FK_products_category"
                    FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product_commission_rules" (
                "id" SERIAL PRIMARY KEY,
                "productId" INTEGER NOT NULL,
                "employeeId" INTEGER NOT NULL,
                "commissionPercent" DECIMAL(5,2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_product_commission_rules_product_employee" UNIQUE ("productId", "employeeId")
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_product_commission_rules_product'
                ) THEN
                    ALTER TABLE "product_commission_rules"
                    ADD CONSTRAINT "FK_product_commission_rules_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id")
                    ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_product_commission_rules_employee'
                ) THEN
                    ALTER TABLE "product_commission_rules"
                    ADD CONSTRAINT "FK_product_commission_rules_employee"
                    FOREIGN KEY ("employeeId") REFERENCES "users"("id")
                    ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_product_commission_rules_productId" ON "product_commission_rules" ("productId")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_product_commission_rules_employeeId" ON "product_commission_rules" ("employeeId")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_sales" (
                "id" SERIAL PRIMARY KEY,
                "saleNumber" VARCHAR(60) NOT NULL UNIQUE,
                "soldAt" TIMESTAMP NOT NULL DEFAULT now(),
                "clientName" VARCHAR(200),
                "clientId" INTEGER,
                "employeeId" INTEGER,
                "appointmentId" INTEGER,
                "discountGross" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "totalNet" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "totalGross" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "paymentMethod" VARCHAR(30),
                "notes" TEXT,
                "createdById" INTEGER,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_sales_employee'
                ) THEN
                    ALTER TABLE "warehouse_sales"
                    ADD CONSTRAINT "FK_warehouse_sales_employee"
                    FOREIGN KEY ("employeeId") REFERENCES "users"("id")
                    ON DELETE SET NULL;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_sales_createdBy'
                ) THEN
                    ALTER TABLE "warehouse_sales"
                    ADD CONSTRAINT "FK_warehouse_sales_createdBy"
                    FOREIGN KEY ("createdById") REFERENCES "users"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_sales_soldAt" ON "warehouse_sales" ("soldAt")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_sale_items" (
                "id" SERIAL PRIMARY KEY,
                "saleId" INTEGER NOT NULL,
                "productId" INTEGER,
                "productName" VARCHAR(200) NOT NULL,
                "quantity" INTEGER NOT NULL DEFAULT 1,
                "unit" VARCHAR(20) NOT NULL DEFAULT 'op.',
                "unitPriceNet" DECIMAL(10,2) NOT NULL,
                "unitPriceGross" DECIMAL(10,2) NOT NULL,
                "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 23,
                "discountGross" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "totalNet" DECIMAL(10,2) NOT NULL,
                "totalGross" DECIMAL(10,2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_sale_items_sale'
                ) THEN
                    ALTER TABLE "warehouse_sale_items"
                    ADD CONSTRAINT "FK_warehouse_sale_items_sale"
                    FOREIGN KEY ("saleId") REFERENCES "warehouse_sales"("id")
                    ON DELETE CASCADE;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_sale_items_product'
                ) THEN
                    ALTER TABLE "warehouse_sale_items"
                    ADD CONSTRAINT "FK_warehouse_sale_items_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_sale_items_saleId" ON "warehouse_sale_items" ("saleId")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_usages" (
                "id" SERIAL PRIMARY KEY,
                "usageNumber" VARCHAR(60) NOT NULL UNIQUE,
                "usedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "clientName" VARCHAR(200),
                "clientId" INTEGER,
                "employeeId" INTEGER,
                "appointmentId" INTEGER,
                "notes" TEXT,
                "createdById" INTEGER,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_usages_employee'
                ) THEN
                    ALTER TABLE "warehouse_usages"
                    ADD CONSTRAINT "FK_warehouse_usages_employee"
                    FOREIGN KEY ("employeeId") REFERENCES "users"("id")
                    ON DELETE SET NULL;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_usages_createdBy'
                ) THEN
                    ALTER TABLE "warehouse_usages"
                    ADD CONSTRAINT "FK_warehouse_usages_createdBy"
                    FOREIGN KEY ("createdById") REFERENCES "users"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_usages_usedAt" ON "warehouse_usages" ("usedAt")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_usage_items" (
                "id" SERIAL PRIMARY KEY,
                "usageId" INTEGER NOT NULL,
                "productId" INTEGER,
                "productName" VARCHAR(200) NOT NULL,
                "quantity" INTEGER NOT NULL DEFAULT 1,
                "unit" VARCHAR(20) NOT NULL DEFAULT 'op.',
                "stockBefore" INTEGER NOT NULL DEFAULT 0,
                "stockAfter" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_usage_items_usage'
                ) THEN
                    ALTER TABLE "warehouse_usage_items"
                    ADD CONSTRAINT "FK_warehouse_usage_items_usage"
                    FOREIGN KEY ("usageId") REFERENCES "warehouse_usages"("id")
                    ON DELETE CASCADE;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_usage_items_product'
                ) THEN
                    ALTER TABLE "warehouse_usage_items"
                    ADD CONSTRAINT "FK_warehouse_usage_items_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_usage_items_usageId" ON "warehouse_usage_items" ("usageId")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_orders" (
                "id" SERIAL PRIMARY KEY,
                "orderNumber" VARCHAR(60) NOT NULL UNIQUE,
                "supplierId" INTEGER,
                "status" VARCHAR(40) NOT NULL DEFAULT 'draft',
                "sentAt" TIMESTAMP,
                "receivedAt" TIMESTAMP,
                "notes" TEXT,
                "createdById" INTEGER,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_orders_supplier'
                ) THEN
                    ALTER TABLE "warehouse_orders"
                    ADD CONSTRAINT "FK_warehouse_orders_supplier"
                    FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id")
                    ON DELETE SET NULL;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_orders_createdBy'
                ) THEN
                    ALTER TABLE "warehouse_orders"
                    ADD CONSTRAINT "FK_warehouse_orders_createdBy"
                    FOREIGN KEY ("createdById") REFERENCES "users"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_orders_status" ON "warehouse_orders" ("status")`,
        );

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "warehouse_order_items" (
                "id" SERIAL PRIMARY KEY,
                "orderId" INTEGER NOT NULL,
                "productId" INTEGER,
                "productName" VARCHAR(200) NOT NULL,
                "quantity" INTEGER NOT NULL DEFAULT 1,
                "unit" VARCHAR(20) NOT NULL DEFAULT 'op.',
                "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_order_items_order'
                ) THEN
                    ALTER TABLE "warehouse_order_items"
                    ADD CONSTRAINT "FK_warehouse_order_items_order"
                    FOREIGN KEY ("orderId") REFERENCES "warehouse_orders"("id")
                    ON DELETE CASCADE;
                END IF;

                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'FK_warehouse_order_items_product'
                ) THEN
                    ALTER TABLE "warehouse_order_items"
                    ADD CONSTRAINT "FK_warehouse_order_items_product"
                    FOREIGN KEY ("productId") REFERENCES "products"("id")
                    ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_warehouse_order_items_orderId" ON "warehouse_order_items" ("orderId")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "warehouse_order_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_order_items_product"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_order_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_order_items_order"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_order_items"`);

        await queryRunner.query(
            `ALTER TABLE "warehouse_orders" DROP CONSTRAINT IF EXISTS "FK_warehouse_orders_createdBy"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_orders" DROP CONSTRAINT IF EXISTS "FK_warehouse_orders_supplier"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_orders"`);

        await queryRunner.query(
            `ALTER TABLE "warehouse_usage_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_usage_items_product"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_usage_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_usage_items_usage"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_usage_items"`);

        await queryRunner.query(
            `ALTER TABLE "warehouse_usages" DROP CONSTRAINT IF EXISTS "FK_warehouse_usages_createdBy"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_usages" DROP CONSTRAINT IF EXISTS "FK_warehouse_usages_employee"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_usages"`);

        await queryRunner.query(
            `ALTER TABLE "warehouse_sale_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_sale_items_product"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_sale_items" DROP CONSTRAINT IF EXISTS "FK_warehouse_sale_items_sale"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_sale_items"`);

        await queryRunner.query(
            `ALTER TABLE "warehouse_sales" DROP CONSTRAINT IF EXISTS "FK_warehouse_sales_createdBy"`,
        );
        await queryRunner.query(
            `ALTER TABLE "warehouse_sales" DROP CONSTRAINT IF EXISTS "FK_warehouse_sales_employee"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouse_sales"`);

        await queryRunner.query(
            `ALTER TABLE "product_commission_rules" DROP CONSTRAINT IF EXISTS "FK_product_commission_rules_employee"`,
        );
        await queryRunner.query(
            `ALTER TABLE "product_commission_rules" DROP CONSTRAINT IF EXISTS "FK_product_commission_rules_product"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "product_commission_rules"`);

        await queryRunner.query(
            `ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "FK_products_category"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" DROP COLUMN IF EXISTS "manufacturer"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" DROP COLUMN IF EXISTS "packageUnit"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" DROP COLUMN IF EXISTS "packageSize"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" DROP COLUMN IF EXISTS "vatRate"`,
        );
        await queryRunner.query(
            `ALTER TABLE "products" DROP COLUMN IF EXISTS "categoryId"`,
        );

        await queryRunner.query(
            `ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "FK_product_categories_parent"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
    }
}
