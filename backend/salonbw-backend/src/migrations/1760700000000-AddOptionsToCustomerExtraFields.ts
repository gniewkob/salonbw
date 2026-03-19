import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOptionsToCustomerExtraFields1760700000000
    implements MigrationInterface
{
    name = 'AddOptionsToCustomerExtraFields1760700000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE customer_extra_fields
            ADD COLUMN IF NOT EXISTS options text[]
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE customer_extra_fields
            DROP COLUMN IF EXISTS options
        `);
    }
}
