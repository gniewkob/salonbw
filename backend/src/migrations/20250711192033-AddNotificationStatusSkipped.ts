import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationStatusSkipped20250711192033 implements MigrationInterface {
    name = 'AddNotificationStatusSkipped20250711192033';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TYPE \"notification_status_enum\" AS ENUM('pending', 'sent', 'failed', 'skipped')",
        );
        await queryRunner.query(
            "UPDATE \"notification\" SET \"status\"='sent' WHERE \"status\" NOT IN ('pending','sent','failed','skipped')",
        );
        await queryRunner.query(
            'ALTER TABLE "notification" ALTER COLUMN "status" TYPE "notification_status_enum" USING "status"::text::"'
            + 'notification_status_enum"',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "notification" ALTER COLUMN "status" TYPE varchar',
        );
        await queryRunner.query('DROP TYPE "notification_status_enum"');
    }
}
