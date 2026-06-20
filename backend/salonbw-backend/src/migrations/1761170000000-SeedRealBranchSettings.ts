import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fills the singleton branch_settings row with the salon's real public
 * contact data (was the placeholder default "Salon Beauty & Wellness" with
 * empty address/phone/email). Values are the canonical ones already in the
 * repo (apps/landing/src/config/content.ts) and owner-authorised 2026-06-20.
 * NIP/REGON are intentionally left for the owner to enter (private tax IDs).
 *
 * The settings service auto-creates a default row on first access, so this
 * UPDATEs it; the INSERT-if-empty is a defensive fallback. Idempotent;
 * down() is a no-op (we don't restore the placeholder). The owner can still
 * edit any of these in the panel afterwards.
 */
export class SeedRealBranchSettings1761170000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "branch_settings" SET
                "company_name" = 'Salon Black & White',
                "display_name" = 'Salon Black & White',
                "street"       = 'ul. Webera 1a/13',
                "postal_code"  = '41-902',
                "city"         = 'Bytom',
                "phone"        = '+48 723 588 868',
                "email"        = 'kontakt@salon-bw.pl',
                "updated_at"   = now()
        `);
        await queryRunner.query(`
            INSERT INTO "branch_settings"
                ("company_name", "display_name", "street", "postal_code",
                 "city", "phone", "email")
            SELECT 'Salon Black & White', 'Salon Black & White',
                   'ul. Webera 1a/13', '41-902', 'Bytom',
                   '+48 723 588 868', 'kontakt@salon-bw.pl'
            WHERE NOT EXISTS (SELECT 1 FROM "branch_settings")
        `);
    }

    public async down(): Promise<void> {
        // Real public data; intentionally not reverted to the placeholder.
    }
}
