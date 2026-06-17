import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Catalog hygiene (2026-06-17). The ~64 pre-Booksy legacy services (duplicates
 * like "X" / "X Ola" and typos like "Rozjasnienie globalne wlosow") were set
 * `onlineBooking=false` in migration 1760990000000 but kept `isActive=true`
 * for history. That left them polluting every "active services" picker — most
 * visibly the calendar "Nowa wizyta" service dropdown (165 entries). The 60
 * canonical Booksy services all have `onlineBooking=true`.
 *
 * Deactivate the legacy set so it disappears from new-appointment / assignment
 * pickers while remaining in the DB (historical appointments + statistics keep
 * referencing it). Reversible.
 */
export class DeactivateLegacyServices1761070000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `UPDATE "services" SET "isActive" = false
             WHERE "onlineBooking" = false AND "isActive" = true`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Inverse: re-activate the legacy set (its pre-migration state).
        await queryRunner.query(
            `UPDATE "services" SET "isActive" = true
             WHERE "onlineBooking" = false`,
        );
    }
}
