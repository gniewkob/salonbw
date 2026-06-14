import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The legacy catalog contained a handful of services with duplicate names
 * (e.g. two "Fryzura ślubna" rows). The Booksy cleanup canonicalized every
 * row matching a Booksy name (UPDATE … WHERE name = …, no row limit), which
 * flipped onlineBooking=true on BOTH duplicates — so the booking list showed
 * 65 instead of the intended 60.
 *
 * Keep one bookable row per name (the lowest id, which preserves any historical
 * appointment links) and drop the rest from online booking. Scoped to
 * onlineBooking=true rows; isActive is untouched. No-op where no duplicates
 * exist (e.g. fresh dev/test DBs).
 */
export class DedupeBookingServices1761000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "services"
            SET "onlineBooking" = false, "updatedAt" = now()
            WHERE "id" IN (
                SELECT "id" FROM (
                    SELECT "id",
                           row_number() OVER (
                               PARTITION BY "name" ORDER BY "id"
                           ) AS rn
                    FROM "services"
                    WHERE "onlineBooking" = true
                ) t
                WHERE t.rn > 1
            )
        `);
    }

    public async down(): Promise<void> {
        // No-op: which rows were duplicates cannot be reconstructed, and the
        // catalog should not regress to a duplicated booking list.
    }
}
