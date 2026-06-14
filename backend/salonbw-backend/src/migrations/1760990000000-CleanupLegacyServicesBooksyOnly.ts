import { MigrationInterface, QueryRunner } from 'typeorm';
import {
    SERVICES,
    CATEGORIES,
} from './1760980000000-SeedBooksyCatalogAndHours';

/**
 * Follow-up to the Booksy catalog seed. The salon DB carried ~76 legacy
 * services from before Booksy (duplicate "X" / "X Ola" pairs, bare parents,
 * typo'd names), all with onlineBooking=true — so the client booking list
 * showed ~136 entries with duplicates. Owner decision (2026-06-14): the
 * online-booking catalog is exactly Aleksandra's 60 Booksy services.
 *
 * This migration:
 *  1. Canonicalizes the 60 Booksy services — re-applies duration/price/
 *     category/flags. This also repairs the 12 names whose seed INSERT was
 *     skipped because a legacy row already owned the name (kept stale prices,
 *     e.g. "Fryzura ślubna" 150 → 280, "Olaplex" 30min → 60).
 *  2. Hides every non-Booksy service from online booking
 *     (onlineBooking=false). Rows are kept (isActive untouched) so history,
 *     stats and panel still work and the owner can re-enable any in the panel.
 */
export class CleanupLegacyServicesBooksyOnly1760990000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        const categoryId: Record<string, number> = {};
        for (const name of CATEGORIES) {
            const row: Array<{ id: number }> = await queryRunner.query(
                `SELECT "id" FROM "service_categories" WHERE "name" = $1::text ORDER BY "id" ASC LIMIT 1`,
                [name],
            );
            if (row[0]) categoryId[name] = row[0].id;
        }

        // 1. Canonicalize the 60 Booksy services (repairs the 12 collisions).
        for (const s of SERVICES) {
            await queryRunner.query(
                `UPDATE "services"
                 SET "duration" = $2::int,
                     "price" = $3::numeric,
                     "priceType" = 'fixed',
                     "category" = $4::text,
                     "categoryId" = $5::int,
                     "isActive" = true,
                     "onlineBooking" = true,
                     "updatedAt" = now()
                 WHERE "name" = $1::text`,
                [s.name, s.dur, s.price, s.cat, categoryId[s.cat] ?? null],
            );
        }

        // 2. Hide everything that is not a Booksy service from online booking.
        const names = SERVICES.map((s) => s.name);
        await queryRunner.query(
            `UPDATE "services"
             SET "onlineBooking" = false, "updatedAt" = now()
             WHERE "name" <> ALL($1::text[])`,
            [names],
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Best-effort inverse: re-expose the legacy services to online booking.
        // Prior per-row onlineBooking values are not individually restored.
        const names = SERVICES.map((s) => s.name);
        await queryRunner.query(
            `UPDATE "services"
             SET "onlineBooking" = true, "updatedAt" = now()
             WHERE "name" <> ALL($1::text[])`,
            [names],
        );
    }
}
