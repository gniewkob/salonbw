import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationChannelEnum20250711192022 implements MigrationInterface {
    name = 'NotificationChannelEnum20250711192022';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "CREATE TYPE \"notification_type_enum\" AS ENUM('sms', 'whatsapp')",
        );
        await queryRunner.query(
            "UPDATE \"notification\" SET \"type\"='whatsapp' WHERE \"type\" NOT IN ('sms','whatsapp')",
        );
        await queryRunner.query(
            'ALTER TABLE "notification" ALTER COLUMN "type" TYPE "notification_type_enum" USING "type"::text::"notification_type_enum"',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "notification" ALTER COLUMN "type" TYPE varchar',
        );
        await queryRunner.query('DROP TYPE "notification_type_enum"');
    }
}
