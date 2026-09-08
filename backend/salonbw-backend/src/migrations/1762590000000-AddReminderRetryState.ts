import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReminderRetryState1762590000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" ADD COLUMN "reminderAttemptCount" integer NOT NULL DEFAULT 0`,
        );
        await queryRunner.query(
            `ALTER TABLE "appointments" ADD COLUMN "reminderLastAttemptAt" timestamp`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_appointments_reminder_due" ON "appointments" ("reminderSent", "startTime")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_appointments_reminder_due"`);
        await queryRunner.query(
            `ALTER TABLE "appointments" DROP COLUMN "reminderLastAttemptAt"`,
        );
        await queryRunner.query(
            `ALTER TABLE "appointments" DROP COLUMN "reminderAttemptCount"`,
        );
    }
}
