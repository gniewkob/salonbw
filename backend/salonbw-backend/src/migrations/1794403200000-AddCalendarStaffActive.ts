import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A real stylist can be shown in operational calendar/booking independently
 * of her login role. Defaults to true to preserve existing schedules until
 * an administrator deliberately deactivates synthetic or former staff.
 * Never deletes users, appointments, time blocks or audit history.
 */
export class AddCalendarStaffActive1794403200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "calendarStaffActive" boolean NOT NULL DEFAULT true',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "users" DROP COLUMN IF EXISTS "calendarStaffActive"',
        );
    }
}
