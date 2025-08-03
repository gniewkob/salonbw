import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetDefaultCommissionBase20250711192032
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "user" SET "commissionBase" = 10 WHERE "commissionBase" IS NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "commissionBase" SET DEFAULT 10`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "commissionBase" SET NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "commissionBase" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "user" ALTER COLUMN "commissionBase" DROP NOT NULL`,
        );
    }
}

