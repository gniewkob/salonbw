import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a mandatory terms-of-service (regulamin) consent to users, parallel to
 * the existing GDPR consent. Registration now requires BOTH gdprConsent and
 * termsConsent = true (enforced in RegisterDto via @Equals(true)); this stores
 * the acceptance + timestamp as the legal record.
 *
 * Existing rows default to false (they predate the requirement) — that's fine,
 * the gate only blocks NEW registrations.
 */
export class AddTermsConsentToUsers1761230000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users"
               ADD COLUMN IF NOT EXISTS "termsConsent" boolean NOT NULL DEFAULT false,
               ADD COLUMN IF NOT EXISTS "termsConsentDate" TIMESTAMP`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "users"
               DROP COLUMN IF EXISTS "termsConsentDate",
               DROP COLUMN IF EXISTS "termsConsent"`,
        );
    }
}
