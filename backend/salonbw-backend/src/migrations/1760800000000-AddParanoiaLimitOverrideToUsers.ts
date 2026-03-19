import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParanoiaLimitOverrideToUsers1760800000000
    implements MigrationInterface
{
    name = 'AddParanoiaLimitOverrideToUsers1760800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "paranoia_limit_override" integer
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "paranoia_limit_override"
        `);
    }
}
