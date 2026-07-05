import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-channel notification preferences: split the previously combined
 * SMS/WhatsApp toggle into distinct channels and add an in-app (panel) flag.
 * notifyPanel defaults true (free in-app banner); whatsappConsent defaults
 * false (opt-in). Existing smsConsent/emailConsent are reused as-is.
 */
export class AddNotificationChannels1761300000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "notifyPanel" BOOLEAN NOT NULL DEFAULT true
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "whatsappConsent" BOOLEAN NOT NULL DEFAULT false
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "whatsappConsent"`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" DROP COLUMN IF EXISTS "notifyPanel"`,
        );
    }
}
