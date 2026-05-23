import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOnlinePendingAppointmentStatuses1760960000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing CHECK constraint on appointments.status and recreate it
        // with the two new values: 'online_pending' and 'rescheduled_pending'.
        // The constraint name follows TypeORM's auto-naming convention.
        await queryRunner.query(`
            ALTER TABLE "appointments"
            DROP CONSTRAINT IF EXISTS "CHK_appointments_status"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "CHK_appointments_status"
            CHECK ("status" IN (
                'scheduled', 'confirmed', 'in_progress',
                'cancelled', 'completed', 'no_show',
                'online_pending', 'rescheduled_pending'
            ))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "appointments"
            DROP CONSTRAINT IF EXISTS "CHK_appointments_status"
        `);
        await queryRunner.query(`
            ALTER TABLE "appointments"
            ADD CONSTRAINT "CHK_appointments_status"
            CHECK ("status" IN (
                'scheduled', 'confirmed', 'in_progress',
                'cancelled', 'completed', 'no_show'
            ))
        `);
    }
}
