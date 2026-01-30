import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAutomaticMessageRulesTable1710018000000
    implements MigrationInterface
{
    name = 'CreateAutomaticMessageRulesTable1710018000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`
            CREATE TYPE "automatic_message_trigger_enum" AS ENUM (
                'appointment_reminder',
                'appointment_confirmation',
                'appointment_cancellation',
                'follow_up',
                'birthday',
                'inactive_client',
                'new_client',
                'review_request'
            )
        `);

        await queryRunner.query(`
            CREATE TYPE "automatic_message_channel_enum" AS ENUM (
                'sms',
                'email',
                'whatsapp'
            )
        `);

        // Create automatic_message_rules table
        await queryRunner.query(`
            CREATE TABLE "automatic_message_rules" (
                "id" SERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "description" text,
                "trigger" "automatic_message_trigger_enum" NOT NULL,
                "channel" "automatic_message_channel_enum" NOT NULL DEFAULT 'sms',
                "offsetHours" integer NOT NULL DEFAULT 0,
                "inactivityDays" integer,
                "sendWindowStart" TIME NOT NULL DEFAULT '09:00:00',
                "sendWindowEnd" TIME NOT NULL DEFAULT '20:00:00',
                "templateId" integer,
                "content" text,
                "serviceIds" text,
                "employeeIds" text,
                "requireSmsConsent" boolean NOT NULL DEFAULT false,
                "requireEmailConsent" boolean NOT NULL DEFAULT false,
                "isActive" boolean NOT NULL DEFAULT true,
                "sentCount" integer NOT NULL DEFAULT 0,
                "lastSentAt" TIMESTAMP,
                "createdById" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_automatic_message_rules" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "automatic_message_rules"
            ADD CONSTRAINT "FK_automatic_message_rules_template"
            FOREIGN KEY ("templateId") REFERENCES "message_templates"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "automatic_message_rules"
            ADD CONSTRAINT "FK_automatic_message_rules_createdBy"
            FOREIGN KEY ("createdById") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_automatic_message_rules_trigger"
            ON "automatic_message_rules" ("trigger")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_automatic_message_rules_isActive"
            ON "automatic_message_rules" ("isActive")
        `);

        // Insert default rules (inactive by default - admin needs to configure and activate)
        await queryRunner.query(`
            INSERT INTO "automatic_message_rules"
                ("name", "description", "trigger", "channel", "offsetHours", "content", "isActive")
            VALUES
                (
                    'Przypomnienie o wizycie (24h)',
                    'Wysyłane 24 godziny przed wizytą',
                    'appointment_reminder',
                    'sms',
                    -24,
                    'Dzień dobry {{client_first_name}}! Przypominamy o Twojej wizycie jutro o {{time}} w {{salon_name}}. Usługa: {{service_name}}. Do zobaczenia!',
                    false
                ),
                (
                    'Przypomnienie o wizycie (2h)',
                    'Wysyłane 2 godziny przed wizytą',
                    'appointment_reminder',
                    'sms',
                    -2,
                    'Hej {{client_first_name}}! Przypominamy - Twoja wizyta już za 2 godziny ({{time}}) w {{salon_name}}. Do zobaczenia!',
                    false
                ),
                (
                    'Potwierdzenie rezerwacji',
                    'Wysyłane natychmiast po zarezerwowaniu wizyty',
                    'appointment_confirmation',
                    'sms',
                    0,
                    'Dzień dobry {{client_first_name}}! Potwierdzamy rezerwację: {{service_name}} dnia {{date}} o {{time}} w {{salon_name}}. Dziękujemy!',
                    false
                ),
                (
                    'Życzenia urodzinowe',
                    'Wysyłane w dniu urodzin klienta',
                    'birthday',
                    'sms',
                    0,
                    'Wszystkiego najlepszego z okazji urodzin {{client_first_name}}! 🎂 Życzymy wspaniałego dnia! Zapraszamy na wizytę ze specjalnym rabatem -10%. Zespół {{salon_name}}',
                    false
                ),
                (
                    'Prośba o opinię',
                    'Wysyłane 24 godziny po wizycie',
                    'review_request',
                    'sms',
                    24,
                    'Dzień dobry {{client_first_name}}! Dziękujemy za wizytę w {{salon_name}}. Będziemy wdzięczni za podzielenie się opinią. Twoja opinia pomaga nam się rozwijać!',
                    false
                ),
                (
                    'Reaktywacja nieaktywnych klientów',
                    'Wysyłane po 60 dniach bez wizyty',
                    'inactive_client',
                    'sms',
                    0,
                    'Hej {{client_first_name}}! Dawno Cię nie widzieliśmy w {{salon_name}}. Tęsknimy! Zapraszamy na wizytę - mamy dla Ciebie -15% na wszystkie usługi!',
                    false
                )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_automatic_message_rules_isActive"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_automatic_message_rules_trigger"
        `);

        // Drop foreign keys
        await queryRunner.query(`
            ALTER TABLE "automatic_message_rules"
            DROP CONSTRAINT IF EXISTS "FK_automatic_message_rules_createdBy"
        `);
        await queryRunner.query(`
            ALTER TABLE "automatic_message_rules"
            DROP CONSTRAINT IF EXISTS "FK_automatic_message_rules_template"
        `);

        // Drop table
        await queryRunner.query(`DROP TABLE IF EXISTS "automatic_message_rules"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE IF EXISTS "automatic_message_channel_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "automatic_message_trigger_enum"`);
    }
}
