import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Standing client discount: a percent on the client (users.discount_percent)
 * and a fallback on the customer group (customer_groups.discount_percent).
 * Resolution (in code): client's own percent, else the highest among the
 * client's groups. Auto-suggested at finalization. Both nullable; null = none.
 */
export class AddClientDiscountPercent1761190000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "discount_percent" numeric`,
        );
        await queryRunner.query(
            `ALTER TABLE "customer_groups" ADD COLUMN IF NOT EXISTS "discount_percent" numeric`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "customer_groups" DROP COLUMN IF EXISTS "discount_percent"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "discount_percent"`,
        );
    }
}
