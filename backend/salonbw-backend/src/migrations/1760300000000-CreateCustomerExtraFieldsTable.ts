import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomerExtraFieldsTable1760300000000
    implements MigrationInterface
{
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE extra_field_type AS ENUM ('text', 'number', 'date', 'checkbox', 'select')
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS customer_extra_fields (
                id SERIAL PRIMARY KEY,
                label VARCHAR(255) NOT NULL,
                type extra_field_type NOT NULL DEFAULT 'text',
                required BOOLEAN NOT NULL DEFAULT FALSE,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS customer_extra_fields`);
        await queryRunner.query(`DROP TYPE IF EXISTS extra_field_type`);
    }
}
