import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductUsageQuantityPositiveCheck20250711192035 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "product_usage" ADD CONSTRAINT "CHK_product_usage_quantity_positive" CHECK ("quantity" > 0)',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "product_usage" DROP CONSTRAINT "CHK_product_usage_quantity_positive"',
        );
    }
}

