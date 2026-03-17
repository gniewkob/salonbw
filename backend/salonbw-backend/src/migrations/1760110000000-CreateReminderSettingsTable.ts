import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReminderSettingsTable1760110000000
    implements MigrationInterface
{
    name = 'CreateReminderSettingsTable1760110000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE \`reminder_settings\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`active\` tinyint NOT NULL DEFAULT 1,
                \`timing_hours\` int NOT NULL DEFAULT 24,
                \`preferred_channel\` enum('sms','email','both') NOT NULL DEFAULT 'sms',
                \`sms_template\` text NULL,
                \`email_subject\` varchar(255) NULL,
                \`email_template\` text NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`reminder_settings\``);
    }
}
