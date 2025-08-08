import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServiceDefaultCommissionPercentCheck20250711192034 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "service" ADD CONSTRAINT "CHK_service_defaultCommissionPercent" CHECK ("defaultCommissionPercent" >= 0 AND "defaultCommissionPercent" <= 100)',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "service" DROP CONSTRAINT "CHK_service_defaultCommissionPercent"',
        );
    }
}
