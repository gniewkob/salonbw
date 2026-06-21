import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enables `allow_overlapping_appointments` on the singleton calendar_settings
 * row. The owner runs a one-person salon and deliberately double-books (e.g.
 * a second client while colour develops), so staff-created/rescheduled
 * appointments may overlap. Online self-booking still respects availability
 * (enforced in code, not by this flag). Owner-authorised 2026-06-21.
 */
export class EnableOverlappingAppointments1761180000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "calendar_settings" SET "allow_overlapping_appointments" = true`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "calendar_settings" SET "allow_overlapping_appointments" = false`,
        );
    }
}
