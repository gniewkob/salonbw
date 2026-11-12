import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a separately evidenced recipient opt-in for appointment WhatsApp.
 *
 * Existing notifyWhatsapp flags are NOT migrated into grants. The opt-in is
 * bound to the phone number present when the customer confirms it; changing
 * the destination requires collecting permission again.
 */
export class AddWhatsAppAppointmentOptIn1794171600000 implements MigrationInterface {
    name = 'AddWhatsAppAppointmentOptIn1794171600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "customer_consents" ADD COLUMN IF NOT EXISTS "contact_value" varchar(32) NULL',
        );
        // Snapshot the recipient in append-only grant/withdrawal history.
        // Without this, a later regrant would overwrite the only number.
        await queryRunner.query(
            'ALTER TABLE "consent_events" ADD COLUMN IF NOT EXISTS "contact_value" varchar(32) NULL',
        );
        await queryRunner.query(
            'ALTER TABLE "customer_consents" DROP CONSTRAINT IF EXISTS "customer_consents_purpose_check"',
        );
        await queryRunner.query(`
            ALTER TABLE "customer_consents"
            ADD CONSTRAINT "CHK_customer_consents_purpose_v2"
            CHECK ("purpose" IN (
                'DIRECT_MARKETING', 'NEWSLETTER', 'REVIEW_REQUEST',
                'WHATSAPP_APPOINTMENT_UPDATES'
            ))
        `);

        await queryRunner.query(
            'ALTER TABLE "consent_events" DROP CONSTRAINT IF EXISTS "consent_events_purpose_check"',
        );
        await queryRunner.query(`
            ALTER TABLE "consent_events"
            ADD CONSTRAINT "CHK_consent_events_purpose_v2"
            CHECK ("purpose" IS NULL OR "purpose" IN (
                'DIRECT_MARKETING', 'NEWSLETTER', 'REVIEW_REQUEST',
                'WHATSAPP_APPOINTMENT_UPDATES'
            ))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Both operational and marketing WhatsApp consent records may bind
        // a recipient. Dropping contact_value would erase legal evidence even
        // when the purpose is not WHATSAPP_APPOINTMENT_UPDATES.
        const rows: Array<{ used: boolean }> = await queryRunner.query(`
            SELECT EXISTS(
                SELECT 1 FROM "customer_consents"
                WHERE "purpose" = 'WHATSAPP_APPOINTMENT_UPDATES'
                   OR "contact_value" IS NOT NULL
                UNION ALL
                SELECT 1 FROM "consent_events"
                WHERE "purpose" = 'WHATSAPP_APPOINTMENT_UPDATES'
                   OR "contact_value" IS NOT NULL
            ) AS used
        `);
        if (rows[0]?.used) {
            throw new Error(
                'Cannot roll back WhatsApp opt-in schema while audited permissions or recipient evidence exist',
            );
        }

        await queryRunner.query(
            'ALTER TABLE "consent_events" DROP CONSTRAINT IF EXISTS "CHK_consent_events_purpose_v2"',
        );
        await queryRunner.query(`
            ALTER TABLE "consent_events"
            ADD CONSTRAINT "consent_events_purpose_check"
            CHECK ("purpose" IS NULL OR "purpose" IN (
                'DIRECT_MARKETING', 'NEWSLETTER', 'REVIEW_REQUEST'
            ))
        `);
        await queryRunner.query(
            'ALTER TABLE "customer_consents" DROP CONSTRAINT IF EXISTS "CHK_customer_consents_purpose_v2"',
        );
        await queryRunner.query(`
            ALTER TABLE "customer_consents"
            ADD CONSTRAINT "customer_consents_purpose_check"
            CHECK ("purpose" IN (
                'DIRECT_MARKETING', 'NEWSLETTER', 'REVIEW_REQUEST'
            ))
        `);
        await queryRunner.query(
            'ALTER TABLE "customer_consents" DROP COLUMN IF EXISTS "contact_value"',
        );
        await queryRunner.query(
            'ALTER TABLE "consent_events" DROP COLUMN IF EXISTS "contact_value"',
        );
    }
}
