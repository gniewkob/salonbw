import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAppointmentLegacyNotes1762560000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "notes"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "notes" text`,
        );
    }
}
