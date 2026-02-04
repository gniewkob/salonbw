import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignProductsTableWithEntity1760080000000
    implements MigrationInterface
{
    name = 'AlignProductsTableWithEntity1760080000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'description'
                ) THEN
                    ALTER TABLE "products" ADD COLUMN "description" TEXT;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'isActive'
                ) THEN
                    ALTER TABLE "products" ADD COLUMN "isActive" BOOLEAN DEFAULT true;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'createdAt'
                ) THEN
                    ALTER TABLE "products" ADD COLUMN "createdAt" TIMESTAMP DEFAULT now();
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'products' AND column_name = 'updatedAt'
                ) THEN
                    ALTER TABLE "products" ADD COLUMN "updatedAt" TIMESTAMP DEFAULT now();
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            UPDATE "products" SET "isActive" = true WHERE "isActive" IS NULL;
            UPDATE "products" SET "productType" = 'product' WHERE "productType" IS NULL;
            UPDATE "products" SET "trackStock" = true WHERE "trackStock" IS NULL;
            UPDATE "products" SET "createdAt" = now() WHERE "createdAt" IS NULL;
            UPDATE "products" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "products" ALTER COLUMN "brand" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "productType" SET DEFAULT 'product';
            ALTER TABLE "products" ALTER COLUMN "productType" SET NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "trackStock" SET DEFAULT true;
            ALTER TABLE "products" ALTER COLUMN "trackStock" SET NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "isActive" SET DEFAULT true;
            ALTER TABLE "products" ALTER COLUMN "isActive" SET NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "createdAt" SET DEFAULT now();
            ALTER TABLE "products" ALTER COLUMN "createdAt" SET NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "updatedAt" SET DEFAULT now();
            ALTER TABLE "products" ALTER COLUMN "updatedAt" SET NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products" ALTER COLUMN "productType" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "trackStock" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "isActive" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "createdAt" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "updatedAt" DROP NOT NULL;
            ALTER TABLE "products" ALTER COLUMN "productType" DROP DEFAULT;
            ALTER TABLE "products" ALTER COLUMN "trackStock" DROP DEFAULT;
            ALTER TABLE "products" ALTER COLUMN "isActive" DROP DEFAULT;
            ALTER TABLE "products" ALTER COLUMN "createdAt" DROP DEFAULT;
            ALTER TABLE "products" ALTER COLUMN "updatedAt" DROP DEFAULT;
            ALTER TABLE "products" DROP COLUMN IF EXISTS "description";
            ALTER TABLE "products" DROP COLUMN IF EXISTS "isActive";
            ALTER TABLE "products" DROP COLUMN IF EXISTS "createdAt";
            ALTER TABLE "products" DROP COLUMN IF EXISTS "updatedAt";
        `);
    }
}
