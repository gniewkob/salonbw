import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddServicePriceDurationCheck20250711192037 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "service" ADD CONSTRAINT "CHK_service_price_nonnegative" CHECK ("price" >= 0)',
        );
        await queryRunner.query(
            'ALTER TABLE "service" ADD CONSTRAINT "CHK_service_duration_positive" CHECK ("duration" > 0)',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "service" DROP CONSTRAINT "CHK_service_duration_positive"',
        );
        await queryRunner.query(
            'ALTER TABLE "service" DROP CONSTRAINT "CHK_service_price_nonnegative"',
        );
    }
}
