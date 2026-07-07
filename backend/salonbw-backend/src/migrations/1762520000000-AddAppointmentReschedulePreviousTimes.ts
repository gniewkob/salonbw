import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentReschedulePreviousTimes1762520000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments"
               ADD COLUMN IF NOT EXISTS "reschedulePreviousStartTime" TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "appointments"
               ADD COLUMN IF NOT EXISTS "reschedulePreviousEndTime" TIMESTAMP`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments"
               DROP COLUMN IF EXISTS "reschedulePreviousEndTime"`,
        );
        await queryRunner.query(
            `ALTER TABLE "appointments"
               DROP COLUMN IF EXISTS "reschedulePreviousStartTime"`,
        );
    }
}
