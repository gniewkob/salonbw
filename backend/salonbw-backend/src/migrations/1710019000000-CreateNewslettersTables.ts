import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewslettersTables1710019000000
    implements MigrationInterface
{
    name = 'CreateNewslettersTables1710019000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create newsletter_status enum
        await queryRunner.query(`
            CREATE TYPE "newsletter_status_enum" AS ENUM (
                'draft',
                'scheduled',
                'sending',
                'sent',
                'partial_failure',
                'failed',
                'cancelled'
            )
        `);

        // Create newsletter_channel enum
        await queryRunner.query(`
            CREATE TYPE "newsletter_channel_enum" AS ENUM (
                'email',
                'sms'
            )
        `);

        // Create recipient_status enum
        await queryRunner.query(`
            CREATE TYPE "recipient_status_enum" AS ENUM (
                'pending',
                'sent',
                'delivered',
                'opened',
                'clicked',
                'bounced',
                'failed',
                'unsubscribed'
            )
        `);

        // Create newsletters table
        await queryRunner.query(`
            CREATE TABLE "newsletters" (
                "id" SERIAL NOT NULL,
                "name" character varying(200) NOT NULL,
                "subject" character varying(200) NOT NULL,
                "content" text NOT NULL,
                "plainTextContent" text,
                "channel" "newsletter_channel_enum" NOT NULL DEFAULT 'email',
                "status" "newsletter_status_enum" NOT NULL DEFAULT 'draft',
                "scheduledAt" TIMESTAMP,
                "sentAt" TIMESTAMP,
                "totalRecipients" integer NOT NULL DEFAULT 0,
                "sentCount" integer NOT NULL DEFAULT 0,
                "deliveredCount" integer NOT NULL DEFAULT 0,
                "failedCount" integer NOT NULL DEFAULT 0,
                "openedCount" integer NOT NULL DEFAULT 0,
                "clickedCount" integer NOT NULL DEFAULT 0,
                "recipientFilter" text,
                "recipientIds" text,
                "createdById" integer,
                "sentById" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_newsletters" PRIMARY KEY ("id")
            )
        `);

        // Create newsletter_recipients table
        await queryRunner.query(`
            CREATE TABLE "newsletter_recipients" (
                "id" SERIAL NOT NULL,
                "newsletterId" integer NOT NULL,
                "recipientId" integer,
                "recipientEmail" character varying(255) NOT NULL,
                "recipientName" character varying(100),
                "status" "recipient_status_enum" NOT NULL DEFAULT 'pending',
                "sentAt" TIMESTAMP,
                "deliveredAt" TIMESTAMP,
                "openedAt" TIMESTAMP,
                "clickedAt" TIMESTAMP,
                "errorMessage" text,
                "externalId" character varying(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_newsletter_recipients" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "newsletters"
            ADD CONSTRAINT "FK_newsletters_createdBy"
            FOREIGN KEY ("createdById") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "newsletters"
            ADD CONSTRAINT "FK_newsletters_sentBy"
            FOREIGN KEY ("sentById") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "newsletter_recipients"
            ADD CONSTRAINT "FK_newsletter_recipients_newsletter"
            FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "newsletter_recipients"
            ADD CONSTRAINT "FK_newsletter_recipients_recipient"
            FOREIGN KEY ("recipientId") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_newsletters_status"
            ON "newsletters" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_newsletters_scheduledAt"
            ON "newsletters" ("scheduledAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_newsletter_recipients_newsletterId"
            ON "newsletter_recipients" ("newsletterId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_newsletter_recipients_status"
            ON "newsletter_recipients" ("status")
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_newsletter_recipients_unique"
            ON "newsletter_recipients" ("newsletterId", "recipientId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_newsletter_recipients_unique"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_newsletter_recipients_status"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_newsletter_recipients_newsletterId"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_newsletters_scheduledAt"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_newsletters_status"`,
        );

        // Drop foreign keys
        await queryRunner.query(`
            ALTER TABLE "newsletter_recipients"
            DROP CONSTRAINT IF EXISTS "FK_newsletter_recipients_recipient"
        `);
        await queryRunner.query(`
            ALTER TABLE "newsletter_recipients"
            DROP CONSTRAINT IF EXISTS "FK_newsletter_recipients_newsletter"
        `);
        await queryRunner.query(`
            ALTER TABLE "newsletters"
            DROP CONSTRAINT IF EXISTS "FK_newsletters_sentBy"
        `);
        await queryRunner.query(`
            ALTER TABLE "newsletters"
            DROP CONSTRAINT IF EXISTS "FK_newsletters_createdBy"
        `);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "newsletter_recipients"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "newsletters"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS "recipient_status_enum"`);
        await queryRunner.query(
            `DROP TYPE IF EXISTS "newsletter_channel_enum"`,
        );
        await queryRunner.query(`DROP TYPE IF EXISTS "newsletter_status_enum"`);
    }
}
