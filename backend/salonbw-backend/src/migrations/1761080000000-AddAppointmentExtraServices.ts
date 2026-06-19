import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * G2 (2026-06-19): additional services billed at finalization. Adds a jsonb
 * column on appointments holding extra service line-items added during the
 * visit (each with a denormalized name + price + per-item discount in cents).
 * They contribute to the visit total and the single combined commission.
 */
export class AddAppointmentExtraServices1761080000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "extraServices" jsonb`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "appointments" DROP COLUMN IF EXISTS "extraServices"`,
        );
    }
}
