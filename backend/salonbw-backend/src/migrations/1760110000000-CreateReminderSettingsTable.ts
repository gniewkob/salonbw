import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReminderSettingsTable1760110000000
    implements MigrationInterface
{
    name = 'CreateReminderSettingsTable1760110000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE reminder_channel AS ENUM ('sms', 'email', 'both')`,
        );
        await queryRunner.query(
            `CREATE TABLE reminder_settings (
                id SERIAL PRIMARY KEY,
                active BOOLEAN NOT NULL DEFAULT true,
                timing_hours INTEGER NOT NULL DEFAULT 24,
                preferred_channel reminder_channel NOT NULL DEFAULT 'sms',
                sms_template TEXT NULL,
                email_subject VARCHAR(255) NULL,
                email_template TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT now(),
                updated_at TIMESTAMP NOT NULL DEFAULT now()
            )`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE reminder_settings`);
        await queryRunner.query(`DROP TYPE reminder_channel`);
    }
}
