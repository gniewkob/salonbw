import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Unified consent & communication-preference model (expand phase).
 *
 * - Creates customer_consents / communication_preferences / consent_events /
 *   consent_requests.
 * - Does NOT backfill consent rows from legacy users.smsConsent/emailConsent/
 *   whatsappConsent: those booleans carry no evidence (source, text version,
 *   actor), so they are surfaced as "legacy, unverified" and never treated as
 *   verified marketing consent. No historical events are fabricated.
 * - Legacy columns stay (contract phase only after all callers migrate).
 * - consent_events is append-only: a trigger rejects UPDATE. DELETE remains
 *   possible only via ON DELETE CASCADE from users (erasure / retention).
 */
export class CreateCommunicationConsents1762630000000 implements MigrationInterface {
    name = 'CreateCommunicationConsents1762630000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const channels = `('PANEL','SMS','EMAIL','WHATSAPP')`;
        const purposes = `('DIRECT_MARKETING','NEWSLETTER','REVIEW_REQUEST')`;
        const types = `('BOOKING_CONFIRMATION','APPOINTMENT_REMINDER','APPOINTMENT_CHANGE','APPOINTMENT_CANCELLATION','MASS_MARKETING','BIRTHDAY_WISHES','MARKETING_AUTOMATION','POST_VISIT_REVIEW','NEWSLETTER','REACTIVATION_CAMPAIGN')`;
        const sources = `('IN_PERSON_SIGNED_FORM','ELECTRONIC_SIGNED_FORM','EMAIL_CONFIRMATION','RECORDED_PHONE_CALL','STAFF_ON_CUSTOMER_REQUEST','STAFF_PREFERENCE_UPDATE','SELF_SERVICE_PANEL','REGISTRATION','LEGACY_SELF_SERVICE_FORM','LEGACY_STAFF_FORM')`;

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "consent_requests" (
                "id" SERIAL PRIMARY KEY,
                "customer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "idempotency_key" varchar(100) NOT NULL,
                "payload_hash" varchar(64) NOT NULL,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_consent_requests_key" UNIQUE ("customer_id", "idempotency_key")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "customer_consents" (
                "id" SERIAL PRIMARY KEY,
                "customer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "purpose" varchar(40) NOT NULL CHECK ("purpose" IN ${purposes}),
                "channel" varchar(20) NOT NULL CHECK ("channel" IN ${channels}),
                "status" varchar(20) NOT NULL CHECK ("status" IN ('GRANTED','WITHDRAWN')),
                "source" varchar(40) NOT NULL CHECK ("source" IN ${sources}),
                "actor_id" integer NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "actor_role" varchar(20) NOT NULL,
                "recorded_at" timestamptz NOT NULL,
                "effective_at" timestamptz NOT NULL,
                "consent_text_version" varchar(80) NULL,
                "evidence_reference" varchar(500) NULL,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "UQ_customer_consents_scope" UNIQUE ("customer_id", "purpose", "channel"),
                CONSTRAINT "CHK_customer_consents_grant_text" CHECK (
                    "status" <> 'GRANTED' OR "consent_text_version" IS NOT NULL
                )
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "communication_preferences" (
                "id" SERIAL PRIMARY KEY,
                "customer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "communication_type" varchar(40) NOT NULL CHECK ("communication_type" IN ${types}),
                "channel" varchar(20) NOT NULL CHECK ("channel" IN ${channels}),
                "enabled" boolean NOT NULL,
                "updated_at" timestamptz NOT NULL,
                "updated_by_id" integer NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "version" integer NOT NULL DEFAULT 1,
                CONSTRAINT "UQ_communication_preferences_scope" UNIQUE ("customer_id", "communication_type", "channel")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "consent_events" (
                "id" SERIAL PRIMARY KEY,
                "customer_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "actor_id" integer NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "actor_role" varchar(20) NOT NULL,
                "source" varchar(40) NOT NULL CHECK ("source" IN ${sources}),
                "purpose" varchar(40) NULL CHECK ("purpose" IS NULL OR "purpose" IN ${purposes}),
                "communication_type" varchar(40) NULL CHECK ("communication_type" IS NULL OR "communication_type" IN ${types}),
                "channel" varchar(20) NOT NULL CHECK ("channel" IN ${channels}),
                "event_type" varchar(30) NOT NULL CHECK ("event_type" IN ('GRANTED','WITHDRAWN','PREFERENCE_ENABLED','PREFERENCE_DISABLED')),
                "previous_status" varchar(20) NULL,
                "new_status" varchar(20) NOT NULL,
                "occurred_at" timestamptz NOT NULL DEFAULT now(),
                "consent_text_version" varchar(80) NULL,
                "evidence_reference" varchar(500) NULL,
                "request_id" integer NULL REFERENCES "consent_requests"("id") ON DELETE SET NULL,
                CONSTRAINT "CHK_consent_events_scope" CHECK (
                    ("event_type" IN ('GRANTED','WITHDRAWN') AND "purpose" IS NOT NULL)
                    OR ("event_type" IN ('PREFERENCE_ENABLED','PREFERENCE_DISABLED') AND "communication_type" IS NOT NULL)
                )
            )
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_consent_events_customer_time" ON "consent_events" ("customer_id", "occurred_at" DESC, "id" DESC)`,
        );

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION "consent_events_reject_update"() RETURNS trigger AS $$
            BEGIN
                -- Allow only FK ON DELETE SET NULL side effects (actor or
                -- idempotency request removed); every audited value stays.
                IF (to_jsonb(NEW) - 'actor_id' - 'request_id')
                        = (to_jsonb(OLD) - 'actor_id' - 'request_id')
                   AND (NEW.actor_id IS NULL OR NEW.actor_id = OLD.actor_id)
                   AND (NEW.request_id IS NULL OR NEW.request_id = OLD.request_id)
                THEN
                    RETURN NEW;
                END IF;
                RAISE EXCEPTION 'consent_events is append-only';
            END;
            $$ LANGUAGE plpgsql
        `);
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS "TRG_consent_events_append_only" ON "consent_events"`,
        );
        await queryRunner.query(`
            CREATE TRIGGER "TRG_consent_events_append_only"
            BEFORE UPDATE ON "consent_events"
            FOR EACH ROW EXECUTE FUNCTION "consent_events_reject_update"()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS "TRG_consent_events_append_only" ON "consent_events"`,
        );
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS "consent_events_reject_update"()`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "consent_events"`);
        await queryRunner.query(
            `DROP TABLE IF EXISTS "communication_preferences"`,
        );
        await queryRunner.query(`DROP TABLE IF EXISTS "customer_consents"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "consent_requests"`);
    }
}
