import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeparateOperationalNotificationPreferences1762570000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "notifySms" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "notifyWhatsapp" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD COLUMN "notifyEmail" boolean NOT NULL DEFAULT true`,
        );
        await queryRunner.query(`
            UPDATE "users"
            SET
                "notifySms" = "receiveNotifications" AND "smsConsent",
                "notifyWhatsapp" = "receiveNotifications" AND "whatsappConsent",
                "notifyEmail" = "receiveNotifications" AND "emailConsent"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "notifyEmail"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN "notifyWhatsapp"`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "notifySms"`);
    }
}
