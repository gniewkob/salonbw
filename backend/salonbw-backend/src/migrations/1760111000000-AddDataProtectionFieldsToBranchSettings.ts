import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataProtectionFieldsToBranchSettings1760111000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE branch_settings
            ADD COLUMN IF NOT EXISTS paranoia_mode BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS paranoia_limit INTEGER NOT NULL DEFAULT 20,
            ADD COLUMN IF NOT EXISTS paranoia_email VARCHAR(255) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE branch_settings
            DROP COLUMN IF EXISTS paranoia_mode,
            DROP COLUMN IF EXISTS paranoia_limit,
            DROP COLUMN IF EXISTS paranoia_email
        `);
    }
}
