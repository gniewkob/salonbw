import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentIndexes1710024000000 implements MigrationInterface {
    name = 'AddAppointmentIndexes1710024000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Index for calendar queries - most common query pattern
        // SELECT * FROM appointments WHERE startTime >= ? AND endTime <= ? AND employeeId IN (?)
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_calendar"
            ON "appointments" ("startTime", "endTime", "employeeId")
        `);

        // Index for client history - used when viewing client's appointment history
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_client"
            ON "appointments" ("clientId", "startTime" DESC)
        `);

        // Index for employee schedule - used when viewing employee's appointments
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_employee"
            ON "appointments" ("employeeId", "startTime")
        `);

        // Index for status filtering - common filter in lists
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_status"
            ON "appointments" ("status")
        `);

        // Index for date range queries (common in reports)
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_date_range"
            ON "appointments" ("startTime", "status")
        `);

        // Partial index for upcoming appointments (pending/confirmed only)
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_upcoming"
            ON "appointments" ("startTime")
            WHERE "status" IN ('scheduled', 'confirmed')
        `);

        // Index for finalized appointments (for financial reports)
        await queryRunner.query(`
            CREATE INDEX "idx_appointments_finalized"
            ON "appointments" ("finalizedAt")
            WHERE "finalizedAt" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_appointments_finalized"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_upcoming"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_date_range"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_status"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_employee"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_client"`);
        await queryRunner.query(`DROP INDEX "idx_appointments_calendar"`);
    }
}
